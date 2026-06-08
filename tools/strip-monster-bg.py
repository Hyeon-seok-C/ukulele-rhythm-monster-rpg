#!/usr/bin/env python3
"""Remove backgrounds from monster PNGs (uses rembg)."""
from __future__ import annotations

import os
import sys
from io import BytesIO

from PIL import Image
from rembg import remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'images', 'ukulele_monster_assets_individual')

DEFAULT_FILES = [
    '01_slime.png', '07_bat.png', '11_beat_phoenix_boss.png',
    '20_crystal_crab.png', '21_crystal_golem.png', '22_conductor_bat.png',
    '23_salamander.png', '24_lava_crab.png', '25_magma_golem.png',
    '26_shadow_thief.png', '27_dark_jester.png',
]


def strip_bg(path: str) -> None:
    with open(path, 'rb') as f:
        data = remove(f.read())
    img = Image.open(BytesIO(data)).convert('RGBA')
    img.save(path, 'PNG')
    print('ok', os.path.basename(path))


def main() -> None:
    names = sys.argv[1:] or DEFAULT_FILES
    for name in names:
        path = os.path.join(ASSETS, name)
        if not os.path.isfile(path):
            print('skip missing', name)
            continue
        strip_bg(path)


if __name__ == '__main__':
    main()
