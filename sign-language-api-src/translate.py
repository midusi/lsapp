import torch
from torch import Tensor
from typing import List

from helpers.create_mask import generate_square_subsequent_mask
from data.LSA_Dataset import LSA_Dataset


def greedy_decode(model, src: List[Tensor], src_mask, max_len, bos_symbol, eos_symbol, device):
    '''function to generate output sequence using greedy algorithm'''
    batched_src: List[List[Tensor]] = [[frame.to(device) for frame in src]]
    src_mask = src_mask.to(device)

    memory = model.encode(batched_src, src_mask)
    ys = torch.ones(1, 1).fill_(bos_symbol).type(torch.long).to(device)
    for i in range(max_len-1):
        memory = memory.to(device)
        tgt_mask = (generate_square_subsequent_mask(ys.size(0), device).type(torch.bool)).to(device)
        out = model.decode(ys, memory, tgt_mask)
        out = out.transpose(0, 1)
        prob = model.generator(out[:, -1])
        _, next_word = torch.max(prob, dim=1)
        next_word = next_word.item()

        ys = torch.cat([ys, torch.ones(1, 1).type_as(src[0].data).fill_(next_word).to(device)], dim=0)
        if next_word == eos_symbol:
            break
    return ys


# actual function to translate input sentence into target language
def translate(model: torch.nn.Module, src: List[Tensor], dataset: LSA_Dataset, device: str):
    model.eval()
    # as size of mask depends on result of convolution, it is taken from positional encoding size
    # probably could be done cleaner
    src_mask_len = model.src_pe.pos_embedding.shape[0]
    src_mask = (torch.zeros(src_mask_len, src_mask_len)).type(torch.bool)
    tgt_tokens = greedy_decode(
        model, src, src_mask, dataset.max_tgt_len, dataset.get_token_idx('<bos>'), dataset.get_token_idx('<eos>'), device).flatten()
    return " ".join(dataset.vocab.lookup_tokens(list(tgt_tokens.cpu().numpy()))).replace("<bos>", "").replace("<eos>", "")
