from dataclasses import replace
import json
from pathlib import Path

from typing import List, Iterator, Callable, Optional, Generator, Literal, Tuple
from type_hints import ClipData, ClipSample, SignerData, KeypointData, KEYPOINT_FORMAT

from torch import stack, Tensor
from torchvision.io import VideoReader
from torchvision.datasets import VisionDataset
from torchtext.data.utils import get_tokenizer
from torchtext.vocab import build_vocab_from_iterator

from helpers.get_clip_paths import get_clip_paths


def split_train_test(samples: List[Path]) -> Tuple[List[Path], List[Path]]:
    # only videos from "resumen semanal" playlist are used
    test_videos = sorted([video for video in {sample.parent.name for sample in samples} if "resumen-semanal" in video])[-8:]
    test_samples: List[Path] = []
    train_samples: List[Path] = []
    for sample in sorted(filter(lambda s: "resumen-semanal" in s.parent.name, samples)):
        (train_samples, test_samples)[str(sample.parent.name) in test_videos].append(sample)
    return (train_samples, test_samples)

def yield_tokens(samples: List[Path], tokenizer) -> Generator:
    for sample in samples:
        with sample.open() as data_file:
            data: ClipData = json.load(data_file)
            yield tokenizer(data['label'])

class LSA_Dataset(VisionDataset):

    def __init__(self,
        root: str,
        load_videos = True,
        load_keypoints = True,
        mode: Literal["train", "test"] = "train",
        frame_transform: Optional[Callable[[Tensor], Tensor]] = None,
        video_transform: Optional[Callable[[List[Tensor]], List[Tensor]]] = None,
        keypoints_transform: Optional[Callable[[List[KeypointData]], List[KeypointData]]] = None,
        keypoints_transform_each: Optional[Callable[[KeypointData], KEYPOINT_FORMAT]] = None,
        label_transform: Optional[Callable[[List[int]], Tensor]] = None
        ) -> None:

        super().__init__(root)
        self.mode = mode

        # samples stores metadata's file path for train/test samples
        all_samples = [(clip.parent / (clip.name[:-3] + 'json')) for clip in
            sorted(Path(root).glob('**/*.mp4'), key=lambda p: (str(p.parent), int(str(p.name)[:-4])))]
        self.train_samples, self.test_samples = split_train_test(all_samples)

        self.tokenizer: Callable[[str], List[str]] = get_tokenizer('spacy', language='es_core_news_lg')
        special_symbols = ['<unk>', '<pad>', '<bos>', '<eos>']
        self.vocab = build_vocab_from_iterator(yield_tokens(self.train_samples, self.tokenizer),
                                                min_freq=1,
                                                specials=special_symbols,
                                                special_first=True)
        # by default returns <unk> index
        self.vocab.set_default_index(0)
        self.max_tgt_len = max(map(len, yield_tokens(all_samples, self.tokenizer)))

        self.load_videos = load_videos
        self.load_keypoints = load_keypoints
        self.frame_transform = frame_transform
        self.video_transform = video_transform
        self.keypoints_transform = keypoints_transform
        self.keypoints_transform_each = keypoints_transform_each
        self.label_transform = label_transform

    def __len__(self) -> int:
        return len(self.train_samples if self.mode == "train" else self.test_samples)

    def __getitem__(self, index: int) -> ClipSample:
        paths = get_clip_paths((self.train_samples if self.mode == "train" else self.test_samples)[index])
        with paths['json'].open() as data_file:
            data: ClipData = json.load(data_file)
        # label stores a list of the token indices for the corresponding label
        label: List[int] = self.vocab(self.tokenizer(data['label']))

        with paths['signer'].open() as signer_file:
            signer: SignerData = json.load(signer_file)
        
        if self.load_keypoints:
            keypoints = self.keypoints_transform(signer['keypoints']) if self.keypoints_transform is not None else signer['keypoints']
            if self.keypoints_transform_each is not None:
                keypoints = list(map(self.keypoints_transform_each, keypoints))
                
        if self.load_videos:
            clip: List[Tensor] = list(map(lambda frame: frame['data'], VideoReader(str(paths['mp4']), "video")))
            clip = self.video_transform(clip) if self.video_transform is not None else clip
            if self.frame_transform is not None:
                clip = list(map(lambda f: self.frame_transform(f, signer['roi']), clip))
            out_clip = stack(clip)

        return (
            out_clip if self.load_videos else None,
            keypoints if self.load_keypoints else None,
            label if self.label_transform is None else self.label_transform(label))
    
    def __iter__(self) -> Iterator[ClipSample]:
        for i in range(self.__len__()):
            yield self.__getitem__(i)
    
    def get_token_idx(self, token: str) -> int:
        return self.vocab.__getitem__(token)
