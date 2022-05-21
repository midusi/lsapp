from typing import List

from type_hints import Box


def format_box(box: List[float]) -> Box:
    'Creates box from list of strings'
    return {
        'x1': box[0],
        'y1': box[1],
        'width': box[2],
        'height': box[3]
    }