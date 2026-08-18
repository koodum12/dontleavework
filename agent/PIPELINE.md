# 퇴근하지 마세요 — 6일 개발 파이프라인

`gamd.md`의 22단계 개발 순서를 4일 단위로 압축한 실행 계획.
Day 5~6은 그 위에 무대(장소)·연출(컷씬)·사람(NPC)과 외형을 얹는 확장분이다.

## 기술 스택 (Day 1에 확정)

```text
Next.js 15 (App Router) + React 19 + TypeScript   // 앱 셸 / UI / 배포
Canvas 2D + requestAnimationFrame                 // 2D 탑다운 씬 / 카메라 (의존성 없음)
zustand                                           // GameState 단일 스토어
sql.js + IndexedDB                                // index.db (브라우저 SQLite)
vitest                                            // 로직 단위 테스트
Vercel                                            // 배포
```

### Next.js를 쓰지만 서버는 쓰지 않는다

이 게임은 **100% 클라이언트 게임**이다. Next.js는 배포 편의(Vercel push → 자동 배포)와
정적 export를 위해 쓰는 것이지, SSR/서버 컴포넌트로 게임 로직을 짜기 위한 것이 아니다.

| 항목 | 방침 |
|------|------|
| 게임 씬 · UI | 전부 `'use client'` |
| 2D 캔버스 | `<canvas>` + `useEffect` 안에서만 `ctx`/`window` 접근 (dynamic import 불필요) |
| 스토리 JSON | `public/data/**` 에서 `fetch` — API Route 만들지 않는다 |
| 저장 데이터 | 브라우저 IndexedDB — DB 서버 없음 |
| 빌드 | `output: 'export'` 정적 빌드 (Vercel 외 어디든 올라간다) |

**서버 컴포넌트로 게임 상태를 다루려 하지 말 것.** GameState는 zustand 하나뿐이다.

## 일자별 개요

| Day | 주제 | 산출물 | 완료 판정 |
|-----|------|--------|-----------|
| [Day 1](./day1.md) | 환경 · 폴더구조 · UI 스켈레톤 · 플레이어 이동 | 2D 탑다운 사무실 씬 + 더미 UI | WASD로 걷고 벽에 막힌다 |
| [Day 2](./day2.md) | 상호작용 · JSON 이벤트 · GameState | 커피 조사 → 대화 → 선택 → 상태 변화 | 1차 개발 목표(21장) 흐름 전체 관통 |
| [Day 3](./day3.md) | 정신력 · 인벤토리 · 증거 · 기록노트 · 휴대폰 · 분기 | 세로 슬라이스(프롤로그~2장) | 조건 분기가 Flag/증거로 갈린다 |
| [Day 4](./day4.md) | 전체 스토리 JSON · 엔딩 · 저장 · 디자인/사운드 · QA · 배포 | 4엔딩 플레이 가능 빌드 | 4개 엔딩 전부 도달 + 새로고침 후 이어하기 |
| [Day 5](./day5.md) | 컷씬 · 장소 이동 (확장) | 맵 5개 + 프롤로그/엔딩 컷씬 | 문으로 왕복 이동 + 컷씬 스킵 + 기존 세이브 호환 |
| [Day 6](./day6.md) | 캐릭터 · NPC · 맵 디자인 (확장) | 맵에 선 NPC + 상황별 맵 + 스프라이트 | NPC 대화로 인물 단서 5명분 수집 + 야간/낮 구분 |

## 불변 원칙 (매일 지킨다)

1. **스토리는 코드에 넣지 않는다.** 모든 대사/선택지/수치는 `public/data/**.json`.
2. **UI는 기능 먼저.** Day 1~3은 무스타일 HTML, 디자인은 Day 4.
3. **상태는 GameState 하나.** 컴포넌트 로컬 state에 게임 진행 상태를 두지 않는다.
4. **하루 끝에 반드시 실행해서 눈으로 확인한다.** 빌드 성공은 검증이 아니다.
5. **진행에 직결되는 데이터는 스크립트로 검증한다.** 깨진 이벤트 참조·이동 대상·스폰 좌표는
   사람이 눈으로 잡는 종류의 버그가 아니다 (`npm run validate`).

## 매일의 검증 루틴

```bash
npm run dev          # 브라우저에서 실제 플레이 (localhost:3000)
npm run test         # 로직 단위 테스트
npm run build        # 타입 + 정적 export 확인
```

`npm run build`는 dev에서 안 보이던 SSR/`window` 참조 에러를 잡아준다.
**Day 1부터 매일 한 번은 돌린다.** 마지막 날 몰아서 돌리면 배포 직전에 터진다.
`npm run validate`는 `prebuild`에 걸려 있어 깨진 스토리 JSON은 빌드 자체가 막힌다.

> dev 서버를 띄운 채 `npm run build`를 돌리면 `.next` 청크가 깨져 화면이 검게 뜬다.
> 빌드는 dev를 끄고 돌린다.

각 day 파일 하단의 "완료 기준"을 체크리스트로 통과해야 다음 날로 넘어간다.
통과 못한 항목은 다음 날 첫 작업으로 이월한다.
