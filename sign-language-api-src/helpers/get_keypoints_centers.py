from typing import List, Optional, Tuple

from type_hints import KeypointData, Box
#from helpers.format_box import format_box


def get_interpolated_point(i: int, points: List[tuple[float, float, float]], threshold: float) -> Tuple[float, float]:
    next_point = next(((point[0], point[1]) for point in points[(i+1):] if point[2] > threshold), None)
    prev_point = next(((point[0], point[1]) for point in reversed(points[:i]) if point[2] > threshold), None)
    return ((prev_point[0]+next_point[0])/2, (prev_point[1]+next_point[1])/2) if (prev_point is not None and next_point is not None) else (
        next_point if next_point is not None else (
            prev_point
        )
    )

def interpolate(keypoints: List[tuple[float, float, float]], threshold: float, max_missing_percent: float) -> Optional[List[Tuple[float, float]]]:
    # keypoints contains [x,y,z] for each frame 
    missing = sum(1 for point in keypoints if point[2] < threshold)
    if missing / len(keypoints) <= max_missing_percent:
        return [
            (each[0], each[1]) if each[2] > threshold else get_interpolated_point(i, keypoints, threshold) for i, each in enumerate(keypoints)
        ]
    return None

def get_keypoints_centers(keypoints: List[KeypointData], threshold = 0.5, max_missing_percent = 0.05) -> List[Tuple[float, float]]:
    return [(each['keypoints'][0], each['keypoints'][1]) for each in keypoints]
