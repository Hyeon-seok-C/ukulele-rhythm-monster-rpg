#!/usr/bin/env python3
"""소스 일러스트 → 게임용 5×4 투명 PNG 스프라이트 시트 + sheet.json"""
from __future__ import annotations

import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', 'characters')

FRAME_W = 256
FRAME_H = 256
COLS = 4
ROWS = 5
DISPLAY_H = 160

STATES = ['idle', 'attack', 'skill', 'hit', 'victory']


def chroma_key(img: Image.Image, threshold: int = 42) -> Image.Image:
    rgba = img.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r + g + b < threshold * 3:
                px[x, y] = (r, g, b, 0)
    return rgba


def fit_frame(src: Image.Image) -> Image.Image:
    canvas = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
    ratio = min(FRAME_W / src.width, FRAME_H / src.height)
    nw = max(1, int(src.width * ratio))
    nh = max(1, int(src.height * ratio))
    resized = src.resize((nw, nh), Image.Resampling.LANCZOS)
    ox = (FRAME_W - nw) // 2
    oy = FRAME_H - nh - 8
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def bob_frame(base: Image.Image, offset_y: int, scale: float = 1.0) -> Image.Image:
    if offset_y == 0 and scale == 1.0:
        return base.copy()
    w, h = base.size
    nw = max(1, int(w * scale))
    nh = max(1, int(h * scale))
    scaled = base.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ox = (w - nw) // 2
    oy = h - nh - 8 + offset_y
    canvas.paste(scaled, (ox, oy), scaled)
    return canvas


def extract_grid(src: Image.Image, cols: int, rows: int) -> list[Image.Image]:
    w, h = src.size
    fw, fh = w // cols, h // rows
    frames = []
    for row in range(rows):
        for col in range(cols):
            box = (col * fw, row * fh, (col + 1) * fw, (row + 1) * fh)
            crop = src.crop(box)
            frames.append(fit_frame(chroma_key(crop)))
    return frames


def build_row(frames: list[Image.Image]) -> list[Image.Image]:
    while len(frames) < COLS:
        frames.append(frames[-1].copy())
    return frames[:COLS]


def compose_sheet(rows: list[list[Image.Image]]) -> Image.Image:
    sheet = Image.new('RGBA', (FRAME_W * COLS, FRAME_H * ROWS), (0, 0, 0, 0))
    for row_idx, row in enumerate(rows):
        for col_idx, frame in enumerate(row):
            sheet.paste(frame, (col_idx * FRAME_W, row_idx * FRAME_H), frame)
    return sheet


def save_character(char_id: str, meta: dict, rows: list[list[Image.Image]]) -> None:
    out_dir = os.path.join(ASSETS, char_id)
    os.makedirs(out_dir, exist_ok=True)
    sheet = compose_sheet(rows)
    sheet_path = os.path.join(out_dir, 'sheet.png')
    sheet.save(sheet_path, optimize=True)

    state_frames = {}
    for i, state in enumerate(STATES):
        base = i * COLS
        state_frames[state] = list(range(base, base + COLS))

    config = {
        'id': char_id,
        'name': meta['name'],
        'sheetPath': f'assets/characters/{char_id}/sheet.png',
        'sheetWidth': FRAME_W * COLS,
        'sheetHeight': FRAME_H * ROWS,
        'frameWidth': FRAME_W,
        'frameHeight': FRAME_H,
        'columns': COLS,
        'rows': ROWS,
        'displayHeight': DISPLAY_H,
        'states': state_frames,
        'gameStateMap': {
            'IDLE': 'idle',
            'STRUM_DOWN': 'attack',
            'STRUM_UP': 'attack',
            'PERFECT': 'skill',
            'DAMAGE': 'hit',
            'VICTORY': 'victory',
        },
    }
    with open(os.path.join(out_dir, 'sheet.json'), 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f'✓ {char_id}: {sheet_path}')


def build_drummer() -> None:
    src_path = os.path.join(ROOT, 'assets', 'images', 'duel_player_drum_boy.png')
    src = Image.open(src_path)
    cells = extract_grid(src, 3, 2)
    # 0 back-L, 1 front idle, 2 back-R | 3 atk1, 4 atk2, 5 atk3
    idle = build_row([cells[1], cells[1], cells[2], cells[0]])
    attack = build_row([cells[3], cells[4], cells[5], cells[5]])
    skill = build_row([cells[4], cells[5], cells[5], cells[4]])
    hit = build_row([cells[0], cells[0], cells[1], cells[0]])
    victory = build_row([cells[5], cells[5], cells[1], cells[5]])
    save_character('drummer_boy', {'name': '드럼 소년'}, [idle, attack, skill, hit, victory])


def build_piano() -> None:
    piano_src = os.path.join(ROOT, 'assets', 'images', 'duel_player_piano_boy.png')
    src_path = piano_src if os.path.isfile(piano_src) else os.path.join(
        ROOT, 'assets', 'images', 'duel_opponent_bard.png'
    )
    src = chroma_key(Image.open(src_path))
    base = fit_frame(src)
    idle = build_row([
        bob_frame(base, 0, 1.0),
        bob_frame(base, -4, 1.0),
        bob_frame(base, 0, 1.0),
        bob_frame(base, -6, 0.98),
    ])
    attack = build_row([
        bob_frame(base, 2, 1.02),
        bob_frame(base, -2, 1.04),
        bob_frame(base, 0, 1.05),
        bob_frame(base, 2, 1.02),
    ])
    skill = build_row([
        bob_frame(base, -3, 1.03),
        bob_frame(base, -5, 1.05),
        bob_frame(base, -2, 1.06),
        bob_frame(base, 0, 1.04),
    ])
    hit = build_row([
        bob_frame(base, 6, 0.96),
        bob_frame(base, 8, 0.94),
        bob_frame(base, 6, 0.95),
        bob_frame(base, 4, 0.96),
    ])
    victory = build_row([
        bob_frame(base, -8, 1.08),
        bob_frame(base, -10, 1.1),
        bob_frame(base, -8, 1.08),
        bob_frame(base, -6, 1.06),
    ])
    save_character('piano_boy', {'name': '피아노 소년'}, [idle, attack, skill, hit, victory])


def main() -> None:
    build_drummer()
    build_piano()
    print('Done.')


if __name__ == '__main__':
    main()
