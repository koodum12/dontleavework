#!/usr/bin/env python3
"""
캐릭터 스프라이트 생성기 (day6.md §2, §6 규격)

  프레임   24 × 32
  시트     96 × 64   (가로 24px × 4방향 down/left/right/up, 세로 32px × 2프레임)
  색       외곽선 1 + 옷 1 + 강조 1 (+ 피부/머리)
  출력     public/assets/images/characters/<id>.png        기본(주간)
           public/assets/images/characters/night/<id>.png  야간 팔레트
           public/assets/images/portraits/<id>.png         대화창용 48×48

색은 characters.json 의 color 를 그대로 쓴다. 데이터가 원본이고 이미지는 파생물이다.
다시 만들려면: python3 scripts/gen-sprites.py
"""
import json
import pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'public/data/characters.json'
OUT = ROOT / 'public/assets/images'

FW, FH = 24, 32           # 프레임 크기
DIRS = ['down', 'left', 'right', 'up']
FRAMES = 2

TRANSPARENT = (0, 0, 0, 0)


def hex_rgb(value: str):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def shade(rgb, factor):
    return tuple(max(0, min(255, int(c * factor))) for c in rgb)


def draw_character(img: ImageDraw.ImageDraw, ox: int, oy: int, d: str, frame: int, palette: dict):
    """24×32 한 프레임. 얼굴은 그리지 않는다 — 실루엣과 색으로 구분한다.
    frame 1 은 걷는 프레임: 상체가 1px 내려가고 다리가 크게 엇갈린다."""
    oy += 1 if frame else 0   # 걸을 때의 상하 흔들림
    outline = palette['outline']
    shirt = palette['shirt']
    shirt_dark = palette['shirt_dark']
    hair = palette['hair']
    skin = palette['skin']
    accent = palette['accent']

    def rect(x0, y0, x1, y1, fill):
        img.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=fill)

    def px(x, y, fill):
        img.point((ox + x, oy + y), fill=fill)

    # 그림자
    rect(6, 30, 17, 31, (0, 0, 0, 60))

    # 머리 (7..15)
    rect(7, 4, 16, 15, skin)
    rect(6, 3, 17, 15, outline) if False else None
    # 머리 외곽선
    img.rectangle([ox + 6, oy + 3, ox + 17, oy + 16], outline=outline)
    rect(7, 4, 16, 15, skin)

    # 머리카락 — 방향에 따라 덮는 범위가 다르다
    if d == 'up':
        rect(7, 4, 16, 14, hair)          # 뒤통수
    elif d == 'down':
        rect(7, 4, 16, 7, hair)
        px(7, 8, hair); px(16, 8, hair)
    else:
        rect(7, 4, 16, 8, hair)
        if d == 'left':
            rect(7, 4, 10, 12, hair)
        else:
            rect(13, 4, 16, 12, hair)

    # 눈 (정면/측면만, 점 하나)
    if d == 'down':
        px(10, 11, outline); px(13, 11, outline)
    elif d == 'left':
        px(9, 11, outline)
    elif d == 'right':
        px(14, 11, outline)

    # 몸통 (17..26)
    img.rectangle([ox + 5, oy + 16, ox + 18, oy + 26], outline=outline, fill=shirt)
    # 강조: 사원증 줄 / 옷깃
    if d == 'down':
        rect(11, 17, 12, 21, accent)
        px(11, 22, accent); px(12, 22, accent)
    elif d == 'up':
        rect(9, 17, 14, 18, shirt_dark)
    else:
        rect(10, 17, 13, 22, shirt_dark)

    # 팔
    rect(4, 18, 5, 24, shirt_dark)
    rect(18, 18, 19, 24, shirt_dark)

    # 다리 — frame 1 에서 크게 엇갈린다 (걷기)
    leg = palette['leg']
    if frame == 0:
        rect(8, 27, 10, 30, leg)
        rect(13, 27, 15, 30, leg)
        px(8, 31, outline); px(14, 31, outline)
    else:
        rect(6, 27, 9, 29, leg)     # 앞으로 나간 다리
        rect(14, 27, 17, 30, leg)   # 뒤에 남은 다리
        px(6, 30, outline); px(15, 31, outline)


def palette_for(color_hex: str, night: bool):
    base = hex_rgb(color_hex)
    if night:
        base = shade(base, 0.62)
    skin = (232, 214, 198) if not night else (150, 138, 128)
    hair = (46, 40, 38) if not night else (32, 28, 27)
    return {
        'shirt': base + (255,),
        'shirt_dark': shade(base, 0.72) + (255,),
        'leg': shade(base, 0.45) + (255,),
        'outline': (18, 18, 22, 255) if not night else (10, 10, 13, 255),
        'skin': skin + (255,),
        'hair': hair + (255,),
        'accent': (200, 162, 90, 255) if not night else (128, 104, 58, 255),
    }


def make_sheet(color_hex: str, night: bool) -> Image.Image:
    sheet = Image.new('RGBA', (FW * len(DIRS), FH * FRAMES), TRANSPARENT)
    draw = ImageDraw.Draw(sheet)
    palette = palette_for(color_hex, night)
    for row in range(FRAMES):
        for col, d in enumerate(DIRS):
            draw_character(draw, col * FW, row * FH, d, row, palette)
    return sheet


def make_portrait(color_hex: str) -> Image.Image:
    """대화창·컷씬용 48×48 — 스프라이트의 상반신을 3배로 키운다"""
    frame = Image.new('RGBA', (FW, FH), TRANSPARENT)
    draw = ImageDraw.Draw(frame)
    draw_character(draw, 0, 0, 'down', 0, palette_for(color_hex, False))
    bust = frame.crop((4, 2, 20, 18)).resize((48, 48), Image.NEAREST)
    return bust


def main():
    characters = json.loads(DATA.read_text(encoding='utf-8'))
    (OUT / 'characters/night').mkdir(parents=True, exist_ok=True)
    (OUT / 'portraits').mkdir(parents=True, exist_ok=True)

    made = []
    for cid, c in characters.items():
        color = c.get('color')
        if not color:
            print(f'  건너뜀 {cid}: characters.json 에 color 가 없다')
            continue
        make_sheet(color, night=False).save(OUT / f'characters/{cid}.png')
        make_sheet(color, night=True).save(OUT / f'characters/night/{cid}.png')
        make_portrait(color).save(OUT / f'portraits/{cid}.png')
        made.append(f'{cid} ({c["name"]}, {color})')

    print(f'스프라이트 {len(made)}종 생성 — {FW}×{FH} × {len(DIRS)}방향 × {FRAMES}프레임')
    for m in made:
        print(f'  {m}')


if __name__ == '__main__':
    main()
