import imp
from pathlib import Path
from typing import Dict


def get_clip_paths(cut: Path) -> Dict[str, Path]:
    '''Given the metadata file location (i.json), return paths for al the files (if exists) corresponding to a single clip'''
    name = cut.name[:-5]
    return {
        'mp4': cut.parent / f"{name}.mp4",
        'json': cut.parent / f"{name}.json",
        'signer': cut.parent / f"{name}_signer.json",
        'ap': cut.parent / f"{name}_ap.json",
    }
