from typing import List
from torch import Tensor, nn, stack
from torch.nn.functional import relu
import torch


class KeypointsEmbedding(nn.Module):

    def __init__(self,
                keys_amount: int,
                kernel_size: int = 5,
                emb_size: int = 64,
                keys_initial_emb_size: int = 128,
                ):
        super(KeypointsEmbedding, self).__init__()

        # in_features is the result of flattening the input of (x,y,c).(k1, ..., k42)
        self.fc = nn.Linear(in_features=keys_amount*3, out_features=keys_initial_emb_size)
        self.conv1d = nn.Conv1d(in_channels=keys_initial_emb_size, out_channels=emb_size, kernel_size=kernel_size)
        

    def forward(self, src_batch: List[List[Tensor]]):
        # flatten and apply fc frame by frame, then stack the frames and permute dims for conv; this for each sample in batch
        src_emb = stack([stack([relu(self.fc(torch.flatten(frame))) for frame in each]).permute(1,0) for each in src_batch])
        src_emb = self.conv1d(src_emb)
        return src_emb
