# 이미지 에셋

**모든 이미지는 선택 사항이다.** 파일이 없으면 렌더러가 색 사각형으로 대체한다 (day6.md §1).
색과 외형의 원본은 `public/data/characters.json` 의 `color` · `art` 이고, 이미지는 거기서 파생된다.

```text
characters/
  <id>.png              인게임 도트 스프라이트 시트 192×128
                        (프레임 48×64 @2x · 가로 4방향 · 세로 2프레임 · 논리 크기 24×32)
  night/<id>.png        야간 팔레트 (팔레트 night 인 맵/변형에서 사용)
  hires/<id>.png        전신 일러스트 720×1080 — 1080p 화면용 (컷씬·엔딩)
  hires/night/<id>.png  전신 야간판
portraits/<id>.png      대화창·컷씬용 얼굴 256×256
portraits/hd/<id>.png   대화창용 AI 생성 고해상도 초상 768×768 (투명 PNG)
portraits/cutout/<id>.png
                        대화창용 AI 생성 세로 전신 컷 1024×1536
                        (투명 PNG, 비도트 셀 셰이딩, 프레임 없음)
objects/                가구·소품 (32의 배수, 맵 오브젝트 rect 크기와 동일)
cutscenes/              컷씬 배경 스틸 (없으면 검은 화면 + 텍스트)
title-office.png        타이틀용 야간 사무실 키 비주얼 (AI 생성 원본)
```

## 방향 · 프레임 순서

```text
시트 가로: down · left · right · up
시트 세로: 0 = 정지, 1 = 걷기
```

## 외형 데이터

`characters.json` 의 각 인물에:

```jsonc
{
  "color": "#8d8f96",                              // 옷 기본색 — 명암 4단이 여기서 파생된다
  "art": { "hair": "short", "accessory": "badge" } // 실루엣 구분
}
// hair:      short · bob · long · tied
// accessory: none · badge · cap · glasses · tie
```

## 다시 만들기

```bash
python3 scripts/gen-sprites.py
```

`color` 나 `art` 를 바꾸고 다시 실행하면 스프라이트·야간판·기본 초상·전신이 함께 갱신된다.
`portraits/hd/` 와 `portraits/cutout/` 은 생성기가 건드리지 않으며 `characters.json` 의 `portrait` 가 사용할 세트를 선택한다.
맵 렌더러는 `characters/`의 48×64 원본 프레임을 보간 없이 논리 크기 24×32로 표시한다.
`portraits/cutout/` 전신 컷은 대화창에서 상반신만 보이도록 잘라 사용한다.
직접 그린 PNG로 교체하려면 같은 경로·같은 규격으로 덮어쓰면 된다 (생성기를 다시 돌리지 않는 한 유지된다).
