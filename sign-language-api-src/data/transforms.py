from math import ceil

from typing import Sequence, List, Callable
import torch
from torch import Tensor

from type_hints import T, KeypointData
from helpers.get_keypoints_centers import get_keypoints_centers

def get_frames_reduction_transform(max_frames: int) -> Callable[[Sequence[T]], List[T]]:
    '''Given the desired frame amount, returns a transform that reduces amount of frames of sequence to max_frames'''
    def frames_reduction_transform(clip: Sequence[T]) -> List[T]:
        frames = []
        for frame in [c for (i,c) in enumerate(clip) if (i%(ceil(len(clip)/max_frames)) == 0)]:
            frames.append(frame)
        if len(frames) < max_frames:
            for _ in range(max_frames - len(frames)):
                frames.append(frames[-1])
        return frames
    return frames_reduction_transform

def get_keypoint_format_transform(keypoints_to_use: List[int]) -> Callable[[KeypointData], Tensor]:
    def keypoint_format_transform(keypoint_data: KeypointData) -> Tensor:
        return Tensor([[
            k for j,k in enumerate(keypoint_data['keypoints']) if (j%3) == i and int(j/3) in keypoints_to_use
        ] for i in range(3)])
    return keypoint_format_transform

def keypoint_norm_to_center_transform(keypoints: List[KeypointData]) -> List[KeypointData]:
    centers = get_keypoints_centers(keypoints)
    keypoints_norm: List[KeypointData] = []
    for i_frame, keypoint_data in enumerate(keypoints):
        keypoint_norm = keypoint_data
        keypoint_norm['keypoints'] = [
            keypoint - centers[i_frame][0] if (i_key%3)==0 else
            keypoint - centers[i_frame][1] if (i_key%3)==1 else
            keypoint
            for i_key, keypoint in enumerate(keypoint_data['keypoints'])
        ]
        keypoints_norm.append(keypoint_norm)
    return keypoints_norm

def get_text_to_tensor_transform(bos_idx: int, eos_idx: int) -> Callable[[List[int]], Tensor]:
    def text_to_tensor_transform(token_ids: List[int]) -> Tensor:
        return torch.cat((torch.tensor([bos_idx]),
                        torch.tensor(token_ids),
                        torch.tensor([eos_idx])))
    return text_to_tensor_transform
