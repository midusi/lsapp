from pathlib import Path
import torch
from torchvision.transforms import Compose

from model.KeypointModel import KeypointModel
from data.LSA_Dataset import LSA_Dataset
from data.transforms import (
    keypoint_norm_to_center_transform,
    get_frames_reduction_transform,
    get_keypoint_format_transform,
    get_text_to_tensor_transform
)
from translate import translate

root = '/mnt/data/datasets/cn_sordos_db/data/cuts'
load_videos = False
load_keypoints = True
max_frames = 75
batch_size = 128
keypoints_to_use = [i for i in range(94, 136)]
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CHECKPOINT_PATH = Path("checkpoints/")

print("Loading train dataset")
dataset = LSA_Dataset(
    root,
    mode="train",
    load_videos = load_videos,
    load_keypoints = load_keypoints,
    keypoints_transform = Compose([
        keypoint_norm_to_center_transform,
        get_frames_reduction_transform(max_frames)
    ]),
    keypoints_transform_each = get_keypoint_format_transform(keypoints_to_use)
    )
dataset.label_transform = get_text_to_tensor_transform(dataset.vocab.__getitem__("<bos>"), dataset.vocab.__getitem__("<eos>"))

model = KeypointModel(max_frames, dataset.max_tgt_len + 2, len(keypoints_to_use), len(dataset.vocab)).to(DEVICE)

checkpoint = torch.load(CHECKPOINT_PATH / "checkpoint_20_epochs.tar")
model.load_state_dict(checkpoint['model_state_dict'])
epoch = checkpoint['epoch']

res = translate(model, dataset.__getitem__(5)[1], dataset, DEVICE)
print(res)