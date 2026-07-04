# 더 그레이스 시니어 주간보호센터 — 브랜드 사이트

부산 해운대 **더 그레이스 시니어 주간보호센터**(THE GRACE Senior Day Care)의 시네마틱 스크롤 브랜드 사이트.
**메인(/)은 애니메이티드 에디션** — Higgsfield 생성 애니메이션 비디오 5편(스즈메풍 수채 톤)을 스크롤 크로스페이드로 전환하는 `<video>` 배경 엔진. 이전 사진 기반 버전(v1)은 `/v2/`에 클래식 백업으로 동결.

## 라이브
- **https://gracedaycare.co.kr** (커스텀 도메인, HTTPS / Let's Encrypt)
- Pages: https://yongm1n.github.io/grace-senior/
- repo: https://github.com/yongm1n/grace-senior  (origin/main → 푸시 시 1~2분 내 자동 반영)

## 폴더 구조
```
.
├── index.html              # ← GitHub Pages가 서빙 (build.js 생성물, 직접 편집 금지)
├── src/site.html           # ← 편집하는 소스 (애니메이티드 메인. 1행 title + favicon + <!--HEAD--> 블록 + 본문)
├── build.js                # src/site.html → index.html(+ dist/site.artifact.html). HEAD 블록을 <head>로 승격
├── media/                  # 메인 배경 비디오 5편(mp4, 무음) + 포스터 jpg (hero/intro/program/health/meal)
├── assets/                 # 로고·파비콘·og.jpg + (v2가 쓰는) 사진 5장
├── v2/index.html           # 클래식 v1 백업 스냅샷 (noindex, 동결 — 편집 대상 아님)
├── CNAME                   # gracedaycare.co.kr (커스텀 도메인 유지 — 지우지 말 것)
├── render.js               # Playwright 검증 (섹션별 스크린샷 + pageerror)
├── robots.txt / sitemap.xml
└── dist/                   # Artifact용 산출물 (gitignore)
```

## 수정 → 배포 흐름
1. **편집**: `src/site.html` 만 고친다 (카피·CSS·섹션). `index.html` 은 직접 고치지 말 것 — 빌드가 덮어쓴다.
2. **빌드**: `node build.js` → `index.html`(Pages 상대경로) + `dist/site.artifact.html`(Artifact base64) 생성.
3. **검증(선택)**: `NODE_PATH=/Users/yongmin/node_modules node render.js` → `shot-<섹션>.png` + `pageerrors 0` 확인.
4. **배포**: `git add -A && git commit -m "..." && git push` → 1~2분 후 https://gracedaycare.co.kr 반영.

## 배경 비디오 교체/추가 (메인)
- 파일명 규칙: `media/<key>.mp4` + `media/<key>-poster.jpg` (key: hero/intro/program/health/meal). 파일명 유지하며 교체하면 코드 수정 불필요.
- 생성 파이프라인(Higgsfield MCP): ①스틸 `seedream_v4_5` 16:9(스타일: 일본 극장판 애니·수채 파스텔·볼류메트릭 광, 좌하단 텍스트존 비움) → ②`kling3_0_turbo` image-to-video 5초 1080p(다이나믹 카메라+동작, 무음) → ③`ffmpeg -an -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart` 재인코딩(개당 1~2MB) → ④포스터 = 스틸 1600px jpg.
- 콘텐츠 규칙: 바다/일출 장면 금지(실제 시설과 불일치), 식사는 완전 조리된 한식만, 간호사캡 금지.
- 섹션 추가 시: `src/site.html`에 `.scene` 블록 + `.vlayer`(video+poster) 추가, JS `TEXKEY` 배열에 키 추가.

## 클래식 백업 (/v2/)
- `v2/index.html` = 이전 사진 기반 v1의 동결 스냅샷(경로 `../assets/` 보정, noindex, 나브에 "메인으로" 링크). **수정 대상 아님** — 참고·롤백용.
- 메인 롤백이 필요하면 git 이력의 스왑 이전 `src/site.html`을 복원해 빌드하면 된다.

## 커스텀 도메인 (이미 연결됨)
- 레지스트라 DNS: A 4개 `185.199.108~111.153`(루트 @) + `www` CNAME→`yongm1n.github.io`.
- repo 루트 `CNAME` 파일(`gracedaycare.co.kr`)이 연결을 유지 — **푸시할 때 항상 포함**되어야 함.
- HTTPS는 GitHub가 Let's Encrypt 인증서 자동 발급. Settings→Pages에서 **Enforce HTTPS** 체크 권장.

## 공개 전 남은 일 (실사 데이터 교체)
- [ ] AI 연출 이미지 → **실제 센터 사진**으로 교체 (현재 인물은 실제 어르신·직원 아님)
- [ ] 정확한 **도로명 주소 · 전화번호 · 운영시간** 반영 (현재 "부산 해운대구" + 통상값/SNS 링크만)
