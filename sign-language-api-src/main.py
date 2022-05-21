import os
from pathlib import Path
from typing import Optional

import torch
from torch import nn
from torchvision.transforms import Compose

from data.LSA_Dataset import LSA_Dataset
from data.transforms import (
    get_frames_reduction_transform,
    get_keypoint_format_transform,
    get_text_to_tensor_transform,
    keypoint_norm_to_center_transform
)
from model.KeypointModel import KeypointModel
from train import train
from type_hints import ModelCheckpoint


def __main__():
    root = '/mnt/data/datasets/cn_sordos_db/data/cuts'
    max_frames = 75
    batch_size = 128
    keypoints_to_use = [i for i in range(94, 136)]
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    CHECKPOINT_PATH = Path("checkpoints/")
    CHECKPOINT_PATH.mkdir(exist_ok=True)

    keypoints_transform = Compose([
        keypoint_norm_to_center_transform,
        get_frames_reduction_transform(max_frames)
    ])
    keypoints_transform_each = get_keypoint_format_transform(keypoints_to_use)

    print("Loading train dataset")
    train_dataset = LSA_Dataset(
        root,
        mode="train",
        load_videos = False,
        keypoints_transform = keypoints_transform,
        keypoints_transform_each = keypoints_transform_each
    )
    label_transform = get_text_to_tensor_transform(train_dataset.get_token_idx("<bos>"), train_dataset.get_token_idx("<eos>"))
    train_dataset.label_transform = label_transform
    
    print("Loading test dataset")
    test_dataset = LSA_Dataset(
        root,
        mode="test",
        load_videos = False,
        keypoints_transform = keypoints_transform,
        keypoints_transform_each = keypoints_transform_each
    )
    test_dataset.label_transform = label_transform
    
    print("Loading model")
    if not os.listdir(CHECKPOINT_PATH):
        torch.manual_seed(0)
        # adds 2 to max_seq_len for <bos> and <eos> tokens
        model = KeypointModel(max_frames, train_dataset.max_tgt_len + 2, len(keypoints_to_use), len(train_dataset.vocab)).to(DEVICE)
        for p in model.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)
        checkpoint = None
    else:
        checkpoint: Optional[ModelCheckpoint] = torch.load(CHECKPOINT_PATH / sorted(os.listdir(CHECKPOINT_PATH))[-1])
        model = KeypointModel(max_frames, train_dataset.max_tgt_len + 2, len(keypoints_to_use), len(train_dataset.vocab)).to(DEVICE)
        model.load_state_dict(checkpoint['model_state_dict'])

    checkpoint = train(train_dataset, test_dataset, model, 2, batch_size, DEVICE, checkpoint)

    torch.save(checkpoint, CHECKPOINT_PATH / f"checkpoint_{checkpoint['epoch']}_epochs.tar")

__main__()