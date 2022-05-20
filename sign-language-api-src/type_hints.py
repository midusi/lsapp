from typing import Dict, Optional, Sequence, Tuple, TypedDict, List, TypeVar, Union, OrderedDict
from torch import Tensor


T = TypeVar('T')

KEYPOINT_FORMAT = TypeVar('KEYPOINT_FORMAT')

class ClipData(TypedDict):
    label: str
    start: float
    end: float
    video: float

class KeypointData(TypedDict):
    image_id: str
    category_id: int
    keypoints: List[float]
    score: float
    box: List[float]
    idx: List[float]

class Box(TypedDict):
    x1: float
    y1: float
    width: float
    height: float

class SignerData(TypedDict):
    scores: List[float]
    roi: Box
    keypoints: List[KeypointData]

class ModelCheckpoint(TypedDict):
    epoch: int
    model_state_dict: OrderedDict[str, Tensor]
    optimizer_state_dict: Dict
    train_loss: float
    val_loss: float
    train_loss_hist: List[float]
    val_loss_hist: List[float]

ClipSample = Tuple[
    Optional[Tensor],
    Optional[Sequence[KEYPOINT_FORMAT]],
    Union[List[int], Tensor]]

KeypointModelSample = Tuple[
    List[Tensor],
    Tensor
]
