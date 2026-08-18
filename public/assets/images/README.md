# 이미지 에셋

**모든 이미지는 선택 사항이다.** 파일이 없으면 렌더러가 색 사각형으로 대체한다 (day6.md §1).
색의 원본은 `public/data/characters.json` 의 `color` 이고, 이미지는 거기서 파생된다.

```text
characters/           걷기 스프라이트 시트 — 96×64 (24×32 프레임 × 4방향 × 2프레임)
  <id>.png            기본(주간) — locations 팔레트 day 용
  night/<id>.png      야간 — 팔레트 night 인 맵/변형에서 사용
portraits/            대화창·컷씬용 48×48 상반신
objects/              가구·소품 (32의 배수, 맵 오브젝트 rect 크기와 동일)
cutscenes/            컷씬 스틸 960×640 (없으면 검은 화면 + 텍스트)
```

## 방향 · 프레임 순서

```text
시트 가로: down · left · right · up
시트 세로: 0 = 정지, 1 = 걷기
```

## 다시 만들기

```bash
python3 scripts/gen-sprites.py
```

`characters.json` 의 `color` 를 바꾸고 다시 실행하면 스프라이트와 초상이 함께 갱신된다.
직접 그린 PNG로 교체하려면 같은 경로·같은 규격으로 덮어쓰면 된다 (생성기를 다시 돌리지 않는 한 유지된다).
