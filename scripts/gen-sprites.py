#!/usr/bin/env python3
"""
캐릭터 이미지 생성기 (day6.md §2, §6)

세 종류를 만든다. 원본은 언제나 public/data/characters.json 의 color / art 다.

  1) 인게임 스프라이트 @2x   프레임 48×64  · 시트 192×128 (4방향 × 2프레임)
                            → 논리 크기는 24×32 그대로, 픽셀 밀도만 2배 (고DPI 대응)
  2) 대화창 초상            256×256
  3) 1080p 전신 일러스트     720×1080 (네이티브 240×360 을 정수배 ×3 확대 → 픽셀이 뭉개지지 않는다)

출력
  public/assets/images/characters/<id>.png          주간 스프라이트 시트
  public/assets/images/characters/night/<id>.png    야간 팔레트
  public/assets/images/portraits/<id>.png           초상 256×256
  public/assets/images/characters/hires/<id>.png    전신 720×1080
  public/assets/images/characters/hires/night/<id>.png

다시 만들기:  python3 scripts/gen-sprites.py
"""
import json
import pathlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'public/data/characters.json'
OUT = ROOT / 'public/assets/images'

FW, FH = 48, 64            # 스프라이트 프레임 (@2x — 논리 24×32)
DIRS = ['down', 'left', 'right', 'up']
FRAMES = 2

HIRES_W, HIRES_H = 240, 360   # 전신 네이티브
HIRES_SCALE = 3               # ×3 → 720×1080

TRANSPARENT = (0, 0, 0, 0)


# ---------------------------------------------------------------- 색

def hex_rgb(v: str):
    v = v.lstrip('#')
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def shade(rgb, f):
    return tuple(max(0, min(255, int(c * f))) for c in rgb)


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def palette_for(color_hex: str, night: bool):
    base = hex_rgb(color_hex)
    if night:
        base = shade(base, 0.6)
    skin = (233, 209, 189) if not night else (146, 133, 124)
    hair = (44, 36, 34) if not night else (28, 24, 23)
    return {
        'shirt': base,
        'shirt_lit': mix(base, (255, 255, 255), 0.18),
        'shirt_dark': shade(base, 0.74),
        'shirt_shadow': shade(base, 0.55),
        'pants': shade(base, 0.38),
        'pants_dark': shade(base, 0.26),
        'shoe': (30, 28, 30) if not night else (20, 19, 21),
        'outline': (17, 16, 20) if not night else (9, 9, 12),
        'skin': skin,
        'skin_shadow': shade(skin, 0.82),
        'skin_lit': mix(skin, (255, 255, 255), 0.14),
        'hair': hair,
        'hair_lit': mix(hair, (150, 140, 130), 0.35),
        'accent': (200, 162, 90) if not night else (126, 102, 57),
        'rim': (120, 150, 190) if night else (255, 250, 240),
        'eye': (24, 22, 26),
    }


def rgba(c, a=255):
    return (c[0], c[1], c[2], a)


# ---------------------------------------------------------------- 스프라이트 (@2x, 48×64)

def draw_sprite(d: ImageDraw.ImageDraw, ox: int, oy: int, facing: str, frame: int, p: dict, art: dict):
    """48×64 한 프레임. 얼굴은 눈·머리 실루엣까지만 — 멀리서도 색으로 구분되는 게 우선."""
    bob = 1 if frame else 0
    oy += bob

    def R(x0, y0, x1, y1, c, a=255):
        d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], fill=rgba(c, a))

    def O(x0, y0, x1, y1, c=None):
        d.rectangle([ox + x0, oy + y0, ox + x1, oy + y1], outline=rgba(c or p['outline']))

    def P(x, y, c):
        d.point((ox + x, oy + y), fill=rgba(c))

    # 바닥 그림자
    d.ellipse([ox + 12, oy + 58 - bob, ox + 35, oy + 63 - bob], fill=(0, 0, 0, 70))

    # ---- 머리 (y 6~30)
    R(14, 6, 33, 30, p['skin'])
    R(14, 6, 20, 30, p['skin_shadow'])          # 왼쪽 그늘
    O(13, 5, 34, 31)

    hair, acc = art.get('hair', 'short'), art.get('accessory', 'none')

    if facing == 'up':
        R(14, 6, 33, 27, p['hair'])
        R(14, 6, 33, 10, p['hair_lit'])
    else:
        R(14, 6, 33, 13, p['hair'])
        R(16, 6, 31, 8, p['hair_lit'])
        if hair == 'long':
            R(14, 6, 17, 26, p['hair']); R(30, 6, 33, 26, p['hair'])
        elif hair == 'bob':
            R(14, 6, 17, 20, p['hair']); R(30, 6, 33, 20, p['hair'])
        elif hair == 'tied':
            R(14, 6, 17, 18, p['hair']); R(30, 6, 33, 18, p['hair'])
            R(33, 12, 35, 22, p['hair'])       # 묶은 머리
        if facing == 'left':
            R(14, 6, 22, 22, p['hair'])
        elif facing == 'right':
            R(25, 6, 33, 22, p['hair'])

    # 눈
    if facing == 'down':
        R(19, 20, 21, 22, p['eye']); R(26, 20, 28, 22, p['eye'])
        P(19, 20, p['skin_lit']); P(26, 20, p['skin_lit'])
    elif facing == 'left':
        R(17, 20, 19, 22, p['eye'])
    elif facing == 'right':
        R(28, 20, 30, 22, p['eye'])

    # 모자 / 안경
    if acc == 'cap':
        R(13, 3, 34, 9, p['shirt_dark']); O(13, 3, 34, 9)
        if facing != 'up':
            R(11, 9, 36, 11, p['shirt_shadow'])
    elif acc == 'glasses' and facing == 'down':
        O(17, 19, 22, 23, p['accent']); O(25, 19, 30, 23, p['accent'])
        d.line([ox + 22, oy + 21, ox + 25, oy + 21], fill=rgba(p['accent']))

    # ---- 몸통 (y 32~50)
    R(10, 32, 37, 50, p['shirt'])
    R(10, 32, 16, 50, p['shirt_shadow'])        # 왼쪽 그늘
    R(31, 32, 37, 50, p['shirt_lit'])           # 오른쪽 하이라이트
    O(9, 31, 38, 51)
    R(15, 31, 32, 33, p['shirt_dark'])          # 어깨선

    if facing == 'down':
        R(22, 33, 25, 43, p['accent'])          # 사원증 줄
        R(21, 43, 26, 47, p['accent'])          # 카드
        R(22, 44, 25, 46, p['shirt_dark'])
    elif facing == 'up':
        R(18, 33, 29, 36, p['shirt_dark'])      # 목깃 뒤
    else:
        R(20, 33, 27, 45, p['shirt_dark'])

    # 팔
    R(6, 34, 10, 48, p['shirt_dark']); O(5, 33, 10, 49)
    R(37, 34, 41, 48, p['shirt_dark']); O(37, 33, 42, 49)
    R(6, 47, 10, 51, p['skin_shadow'])          # 손
    R(37, 47, 41, 51, p['skin'])

    # ---- 다리 (걷기 프레임에서 크게 엇갈린다)
    if frame == 0:
        R(16, 51, 22, 59, p['pants']); R(25, 51, 31, 59, p['pants_dark'])
        R(15, 59, 22, 62, p['shoe']); R(25, 59, 32, 62, p['shoe'])
    else:
        R(13, 51, 20, 58, p['pants']); R(27, 51, 34, 60, p['pants_dark'])
        R(11, 57, 19, 60, p['shoe']); R(27, 60, 35, 63, p['shoe'])


def make_sheet(color: str, art: dict, night: bool) -> Image.Image:
    sheet = Image.new('RGBA', (FW * len(DIRS), FH * FRAMES), TRANSPARENT)
    d = ImageDraw.Draw(sheet)
    p = palette_for(color, night)
    for row in range(FRAMES):
        for col, facing in enumerate(DIRS):
            draw_sprite(d, col * FW, row * FH, facing, row, p, art)
    return sheet


# ---------------------------------------------------------------- 전신 일러스트 (240×360 → ×3)

def draw_hires(d: ImageDraw.ImageDraw, p: dict, art: dict):
    """네이티브 240×360. 픽셀 하나가 최종 3px 이므로 음영을 띠로 쌓아 입체를 만든다.
    비례: 머리 7등신 기준으로 낮춰 잡아 사무실 인물처럼 보이게 한다."""
    hair_style = art.get('hair', 'short')
    acc = art.get('accessory', 'none')
    OL = rgba(p['outline'])

    def R(x0, y0, x1, y1, c, a=255):
        d.rectangle([x0, y0, x1, y1], fill=rgba(c, a))

    def O(x0, y0, x1, y1, c=None):
        d.rectangle([x0, y0, x1, y1], outline=c or OL)

    # 바닥 그림자
    d.ellipse([66, 338, 174, 356], fill=(0, 0, 0, 90))

    # ---- 다리 / 신발
    R(96, 236, 116, 332, p['pants']); R(124, 236, 144, 332, p['pants_dark'])
    R(96, 236, 102, 332, p['pants_dark'])
    R(138, 236, 144, 332, shade(p['pants'], 1.16))
    for y in range(252, 330, 16):
        R(100, y, 113, y + 1, p['pants_dark'])
        R(127, y + 8, 141, y + 9, shade(p['pants_dark'], 0.85))
    O(95, 235, 117, 333); O(123, 235, 145, 333)
    R(90, 332, 118, 344, p['shoe']); R(122, 332, 150, 344, p['shoe'])
    R(90, 332, 118, 335, shade(p['shoe'], 1.6))
    O(89, 331, 119, 345); O(121, 331, 151, 345)

    # ---- 상체 (어깨는 목보다 넓고, 허리로 갈수록 살짝 좁아진다)
    R(66, 132, 174, 240, p['shirt'])
    R(70, 126, 170, 134, p['shirt'])                   # 어깨 윗선
    R(66, 132, 84, 240, p['shirt_shadow'])
    R(156, 132, 174, 240, p['shirt_lit'])
    R(66, 226, 174, 240, p['shirt_dark'])
    for y in range(154, 224, 20):                      # 옷 주름
        R(94, y, 146, y + 2, shade(p['shirt'], 0.9))
        R(98, y + 3, 138, y + 3, p['shirt_lit'], 110)
    O(65, 131, 175, 241); O(69, 125, 171, 133)

    # ---- 팔 (어깨에서 이어지게 붙인다)
    R(48, 138, 68, 232, p['shirt_dark']); O(47, 137, 69, 233)
    R(172, 138, 192, 232, p['shirt_dark']); O(171, 137, 193, 233)
    R(50, 144, 55, 228, p['shirt_shadow'])
    R(185, 144, 190, 228, p['shirt_lit'])
    R(56, 136, 68, 150, p['shirt']); R(172, 136, 184, 150, p['shirt'])   # 어깨 이음새
    R(50, 232, 68, 258, p['skin_shadow']); O(49, 231, 69, 259)
    R(172, 232, 190, 258, p['skin']); O(171, 231, 191, 259)

    # ---- 목 / 옷깃
    R(108, 104, 132, 134, p['skin_shadow']); O(107, 103, 133, 135)
    R(104, 104, 110, 130, shade(p['skin'], 0.7))       # 턱 그림자
    d.polygon([(100, 132), (120, 172), (140, 132)], fill=rgba(p['shirt_dark']))
    d.line([(100, 132), (120, 172)], fill=OL); d.line([(140, 132), (120, 172)], fill=OL)
    R(96, 130, 144, 138, p['shirt_dark'])

    # ---- 사원증 (작게)
    R(117, 150, 119, 206, p['accent'])
    R(108, 206, 130, 234, p['accent'])
    R(111, 211, 127, 220, shade(p['accent'], 0.68))
    R(111, 223, 124, 226, shade(p['accent'], 0.68))
    O(107, 205, 131, 235)

    # ---- 머리 (좁게: 88~152)
    R(88, 36, 152, 108, p['skin'])
    R(88, 36, 100, 108, p['skin_shadow'])
    R(144, 44, 152, 104, p['skin_lit'])
    R(92, 96, 148, 104, p['skin_shadow'])              # 턱 아래 그늘
    O(87, 35, 153, 109)

    # 머리카락
    R(84, 26, 156, 58, p['hair'])
    R(92, 28, 148, 33, p['hair_lit'])
    for x in (96, 108, 124, 138):                      # 결은 드문드문
        R(x, 30, x + 1, 52, shade(p['hair'], 0.72))
    if hair_style in ('long', 'bob', 'tied'):
        side_bottom = {'long': 148, 'bob': 104, 'tied': 88}[hair_style]
        R(80, 44, 94, side_bottom, p['hair'])
        R(146, 44, 160, side_bottom, p['hair'])
        R(80, 44, 84, side_bottom, shade(p['hair'], 0.8))
        if hair_style == 'tied':
            R(152, 62, 166, 128, p['hair']); O(151, 61, 167, 129)
    else:
        R(84, 44, 94, 70, p['hair']); R(146, 44, 156, 70, p['hair'])
    O(83, 25, 157, 59)

    # 눈썹 · 눈
    R(98, 64, 114, 67, shade(p['hair'], 0.9))
    R(126, 64, 142, 67, shade(p['hair'], 0.9))
    R(98, 72, 114, 82, (250, 248, 245)); R(126, 72, 142, 82, (250, 248, 245))
    R(103, 72, 110, 82, p['eye']); R(131, 72, 138, 82, p['eye'])
    R(104, 74, 106, 76, (255, 255, 255)); R(132, 74, 134, 76, (255, 255, 255))
    O(97, 71, 115, 83); O(125, 71, 143, 83)

    # 코 · 입 · 볼
    R(118, 84, 121, 90, p['skin_shadow'])
    R(112, 94, 128, 96, shade(p['skin'], 0.7))
    R(96, 84, 102, 88, mix(p['skin'], (200, 140, 130), 0.35))
    R(138, 84, 144, 88, mix(p['skin'], (200, 140, 130), 0.35))

    # 액세서리
    if acc == 'cap':
        R(80, 18, 160, 42, p['shirt_dark'])
        R(80, 18, 160, 24, p['shirt'])
        R(66, 42, 174, 50, p['shirt_shadow'])
        O(79, 17, 161, 43); O(65, 41, 175, 51)
        R(112, 24, 128, 36, p['accent'])
    elif acc == 'glasses':
        O(94, 66, 118, 88, rgba(p['accent']))
        O(122, 66, 146, 88, rgba(p['accent']))
        d.line([118, 76, 122, 76], fill=rgba(p['accent']), width=2)
        d.line([94, 74, 84, 70], fill=rgba(p['accent']))
        R(96, 68, 116, 73, (255, 255, 255), 45)
    elif acc == 'tie':
        d.polygon([(120, 138), (111, 150), (120, 161), (129, 150)], fill=rgba(p['accent']))
        d.polygon([(120, 161), (113, 200), (120, 212), (127, 200)], fill=rgba(shade(p['accent'], 0.8)))

    # 림 라이트
    R(151, 40, 153, 104, p['rim'], 70)
    R(172, 134, 174, 232, p['rim'], 55)


def make_hires(color: str, art: dict, night: bool) -> Image.Image:
    img = Image.new('RGBA', (HIRES_W, HIRES_H), TRANSPARENT)
    draw_hires(ImageDraw.Draw(img), palette_for(color, night), art)
    return img.resize((HIRES_W * HIRES_SCALE, HIRES_H * HIRES_SCALE), Image.NEAREST)


def make_portrait(color: str, art: dict) -> Image.Image:
    """전신에서 얼굴·어깨만 잘라 256×256"""
    img = Image.new('RGBA', (HIRES_W, HIRES_H), TRANSPARENT)
    draw_hires(ImageDraw.Draw(img), palette_for(color, False), art)
    return img.crop((62, 14, 178, 130)).resize((256, 256), Image.NEAREST)


# ---------------------------------------------------------------- 실행

def main():
    characters = json.loads(DATA.read_text(encoding='utf-8'))
    for sub in ('characters/night', 'characters/hires/night', 'portraits'):
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    made = []
    for cid, c in characters.items():
        color = c.get('color')
        if not color:
            print(f'  건너뜀 {cid}: color 없음')
            continue
        art = c.get('art', {})
        make_sheet(color, art, False).save(OUT / f'characters/{cid}.png')
        make_sheet(color, art, True).save(OUT / f'characters/night/{cid}.png')
        make_hires(color, art, False).save(OUT / f'characters/hires/{cid}.png')
        make_hires(color, art, True).save(OUT / f'characters/hires/night/{cid}.png')
        make_portrait(color, art).save(OUT / f'portraits/{cid}.png')
        made.append(f'{cid:15} {c["name"]:8} {color}  {art.get("hair","short")}/{art.get("accessory","none")}')

    print(f'{len(made)}종 생성')
    print(f'  스프라이트 {FW}×{FH} × {len(DIRS)}방향 × {FRAMES}프레임 → 시트 {FW*len(DIRS)}×{FH*FRAMES}')
    print(f'  전신       {HIRES_W*HIRES_SCALE}×{HIRES_H*HIRES_SCALE} (네이티브 {HIRES_W}×{HIRES_H} ×{HIRES_SCALE})')
    print('  초상       256×256')
    for m in made:
        print(f'  {m}')


if __name__ == '__main__':
    main()
