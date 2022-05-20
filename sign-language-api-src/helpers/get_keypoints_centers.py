from typing import List, Tuple

from type_hints import KeypointData

def get_keypoints_centers(keypoints: List[KeypointData], threshold = 0.5, max_missing_percent = 0.05) -> List[Tuple[float, float]]:
    return [(each['keypoints'][0], each['keypoints'][1]) for each in keypoints]
