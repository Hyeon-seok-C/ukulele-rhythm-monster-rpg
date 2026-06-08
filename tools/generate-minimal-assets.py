#!/usr/bin/env python3
"""Generate minimal game assets when source art is missing."""
from __future__ import annotations

import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def save_png(path: str, img: Image.Image) -> None:
    ensure_dir(os.path.dirname(path))
    img.save(path, 'PNG')


def draw_person(draw: ImageDraw.ImageDraw, cx: int, ground: int, body: str, pose: str = 'idle') -> None:
    skin = (255, 220, 180)
    if body == 'ukulele':
        shirt = (46, 134, 193)
        pants = (44, 62, 80)
        hair = (80, 50, 20)
    elif body == 'drum':
        shirt = (231, 76, 60)
        pants = (52, 73, 94)
        hair = (30, 30, 30)
    else:  # piano
        shirt = (155, 89, 182)
        pants = (44, 62, 80)
        hair = (50, 35, 20)

    head_y = ground - 130
    draw.ellipse((cx - 22, head_y - 22, cx + 22, head_y + 22), fill=skin)
    draw.ellipse((cx - 24, head_y - 28, cx + 24, head_y - 8), fill=hair)
    draw.rectangle((cx - 18, head_y + 18, cx + 18, ground - 28), fill=shirt)
    draw.rectangle((cx - 16, ground - 28, cx + 16, ground - 4), fill=pants)
    draw.rectangle((cx - 18, ground - 4, cx - 6, ground), fill=(40, 40, 40))
    draw.rectangle((cx + 6, ground - 4, cx + 18, ground), fill=(40, 40, 40))

    arm_y = head_y + 34
    if pose == 'attack':
        draw.rectangle((cx - 34, arm_y - 28, cx - 18, arm_y + 8), fill=shirt)
        draw.rectangle((cx + 18, arm_y - 28, cx + 34, arm_y + 8), fill=shirt)
    else:
        draw.rectangle((cx - 34, arm_y, cx - 18, arm_y + 36), fill=shirt)
        draw.rectangle((cx + 18, arm_y, cx + 34, arm_y + 36), fill=shirt)

    if body == 'ukulele':
        uy = ground - 52
        draw.ellipse((cx - 34, uy - 18, cx + 34, uy + 18), fill=(253, 203, 110), outline=(120, 80, 20), width=3)
        draw.line((cx, uy - 18, cx, uy - 42), fill=(120, 80, 20), width=4)
    elif body == 'drum':
        dy = ground - 36
        draw.ellipse((cx - 28, dy - 22, cx + 28, dy + 10), fill=(236, 240, 241), outline=(90, 90, 90), width=3)
        draw.rectangle((cx - 24, dy - 8, cx + 24, dy + 18), fill=(192, 57, 43))
    else:
        py = ground - 34
        draw.rectangle((cx - 36, py - 16, cx + 36, py + 14), fill=(45, 52, 54))
        for kx in range(cx - 24, cx + 25, 12):
            draw.line((kx, py - 16, kx, py + 14), fill=(220, 220, 220), width=2)


def make_character_png(path: str, body: str, pose: str = 'idle', size=(180, 220)) -> None:
    w, h = size
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_person(draw, w // 2, h - 12, body, pose)
    save_png(path, img)


def make_player_sheet() -> None:
    fw, fh = 341, 558
    sheet = Image.new('RGBA', (1024, 558), (255, 0, 255, 255))
    poses = ['attack', 'idle', 'idle']
    for i, pose in enumerate(poses):
        frame = Image.new('RGBA', (fw, fh), (255, 0, 255, 255))
        draw = ImageDraw.Draw(frame)
        draw_person(draw, fw // 2, fh - 40, 'ukulele', pose)
        sheet.paste(frame, (i * fw, 0))
    save_png(os.path.join(ASSETS, 'images', 'player_sheet.png'), sheet)

    hero = Image.new('RGBA', (220, 260), (0, 0, 0, 0))
    draw = ImageDraw.Draw(hero)
    draw_person(draw, 110, 248, 'ukulele', 'idle')
    save_png(os.path.join(ASSETS, 'images', 'player_hero.png'), hero)


def write_svg(path: str, content: str) -> None:
    ensure_dir(os.path.dirname(path))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def make_backgrounds() -> None:
    bgs = {
        'world-forest.svg': ('#87CEEB', '#228B22', '#2ecc71', '숲'),
        'world-cave.svg': ('#2c3e50', '#4a235a', '#5d6d7e', '동굴'),
        'world-volcano.svg': ('#922b21', '#e74c3c', '#f39c12', '화산'),
        'world-castle.svg': ('#1b2631', '#34495e', '#7f8c8d', '성'),
        'world-kingdom.svg': ('#f1c40f', '#f39c12', '#3498db', '왕국'),
        'duel-arena.svg': ('#667eea', '#764ba2', '#f093fb', 'VS'),
    }
    for name, (c1, c2, c3, label) in bgs.items():
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="55%" stop-color="{c2}"/>
      <stop offset="100%" stop-color="{c3}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <ellipse cx="400" cy="420" rx="320" ry="28" fill="rgba(0,0,0,0.18)"/>
  <text x="400" y="60" text-anchor="middle" font-family="Nunito,sans-serif" font-size="28" font-weight="800" fill="rgba(255,255,255,0.35)">{label}</text>
</svg>'''
        write_svg(os.path.join(ASSETS, 'backgrounds', name), svg)


def make_icons() -> None:
    icons = {
        'icon_hp.svg': ('#ee5a6f', 'HP'),
        'icon_exp.svg': ('#6c5ce7', 'EXP'),
        'rhythm_shield.svg': ('#3498db', '🛡'),
        'master_guide.svg': ('#9b59b6', '🎓'),
    }
    for name, (color, label) in icons.items():
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="{color}" stroke="#2d3436" stroke-width="2"/>
  <text x="16" y="21" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">{label}</text>
</svg>'''
        write_svg(os.path.join(ASSETS, 'icons', name), svg)


def main() -> None:
    make_backgrounds()
    make_icons()
    make_player_sheet()
    make_character_png(os.path.join(ASSETS, 'images', 'duel', 'drummer_idle.png'), 'drum', 'idle')
    make_character_png(os.path.join(ASSETS, 'images', 'duel', 'drummer_attack.png'), 'drum', 'attack')
    make_character_png(os.path.join(ASSETS, 'images', 'duel', 'piano_idle.png'), 'piano', 'idle', (200, 240))
    make_character_png(os.path.join(ASSETS, 'images', 'duel', 'piano_attack.png'), 'piano', 'attack', (200, 240))

    # legacy character sheet paths (optional fallbacks)
    for name in ('drummer_boy', 'piano_boy'):
        src = os.path.join(ASSETS, 'images', 'duel', 'drummer_idle.png' if 'drum' in name else 'piano_idle.png')
        dst = os.path.join(ASSETS, 'characters', name, 'sheet.png')
        ensure_dir(os.path.dirname(dst))
        Image.open(src).save(dst)

    print('Generated assets in', ASSETS)


if __name__ == '__main__':
    main()
