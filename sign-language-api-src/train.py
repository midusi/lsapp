from timeit import default_timer as timer
from typing import Callable, List, Optional

import torch
from torch import nn
from torch.utils.data import DataLoader

from data.LSA_Dataset import LSA_Dataset
from helpers.create_mask import create_mask
from data.collate_fn import get_keypoint_model_collate_fn
from type_hints import KeypointModelSample, ClipSample, ModelCheckpoint


def train_epoch(model, optimizer, dataset, batch_size, collate_fn, loss_fn, device):
    model.train()
    losses = 0
    train_dataloader = DataLoader(dataset, batch_size=batch_size, collate_fn=collate_fn, shuffle=True)

    for i, (src, tgt) in enumerate(train_dataloader):
        print(f"Batch {i}/{len(train_dataloader)}")
        src = [[frame.to(device) for frame in each] for each in src]
        tgt = tgt.to(device)

        tgt_input = tgt[:-1, :]
        src_mask, tgt_mask, src_padding_mask, tgt_padding_mask = create_mask(src, tgt_input, dataset.vocab.__getitem__("<pad>"), device)

        logits = model(src, tgt_input, src_mask, tgt_mask, src_padding_mask, tgt_padding_mask, src_padding_mask)
        optimizer.zero_grad()
        tgt_out = tgt[1:, :]
        loss = loss_fn(logits.reshape(-1, logits.shape[-1]), tgt_out.reshape(-1))
        loss.backward()

        optimizer.step()
        losses += loss.item()

    return losses / len(train_dataloader)

def evaluate(
            model: nn.Module,
            dataset: LSA_Dataset,
            batch_size: int,
            collate_fn: Callable[[List[ClipSample]], KeypointModelSample],
            loss_fn,
            device: str):
    model.eval()
    losses = 0
    val_dataloader = DataLoader(dataset, batch_size=batch_size, collate_fn=collate_fn, shuffle=True)

    for i, (src, tgt) in enumerate(val_dataloader):
        print(f"Validation batch {i}/{len(val_dataloader)}")
        src = [[frame.to(device) for frame in each] for each in src]
        tgt = tgt.to(device)

        tgt_input = tgt[:-1, :]
        src_mask, tgt_mask, src_padding_mask, tgt_padding_mask = create_mask(src, tgt_input, dataset.vocab.__getitem__("<pad>"), device)

        logits = model(src, tgt_input, src_mask, tgt_mask,src_padding_mask, tgt_padding_mask, src_padding_mask)
        tgt_out = tgt[1:, :]
        loss = loss_fn(logits.reshape(-1, logits.shape[-1]), tgt_out.reshape(-1))
        losses += loss.item()

    return losses / len(val_dataloader)

def train(
        train_dataset: LSA_Dataset,
        validation_dataset: LSA_Dataset,
        model: nn.Module,
        num_epochs: int,
        batch_size: int,
        device: str,
        checkpoint: Optional[ModelCheckpoint]
    ) -> Optional[ModelCheckpoint]:

    loss_fn = torch.nn.CrossEntropyLoss(ignore_index=train_dataset.get_token_idx("<pad>"))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.0001, betas=(0.9, 0.98), eps=1e-9)
    if checkpoint is not None:
        optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
    collate_fn = get_keypoint_model_collate_fn(train_dataset.get_token_idx("<pad>"))

    train_loss_hist = [] if checkpoint is None else checkpoint['train_loss_hist']
    val_loss_hist = [] if checkpoint is None else checkpoint['val_loss_hist']
    for epoch in range(1, num_epochs+1):
        start_time = timer()
        train_loss = train_epoch(model, optimizer, train_dataset, batch_size, collate_fn, loss_fn, device)
        train_loss_hist.append(train_loss)
        end_time = timer()
        val_loss = evaluate(model, validation_dataset, batch_size, collate_fn, loss_fn, device)
        val_loss_hist.append(val_loss)
        print((f"Epoch: {epoch}, Train loss: {train_loss:.3f}, Val loss: {val_loss:.3f}, "f"Epoch time = {(end_time - start_time):.3f}s"))
        checkpoint = {
            'epoch': checkpoint['epoch'] + 1 if checkpoint is not None else epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
            'train_loss': train_loss,
            'val_loss': val_loss,
            'train_loss_hist': train_loss_hist,
            'val_loss_hist': val_loss_hist
            }
    return checkpoint
