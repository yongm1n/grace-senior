# 더 그레이스 시니어 주간보호센터 — 브랜드 사이트

부산 해운대 **더 그레이스 시니어 주간보호센터**(THE GRACE Senior Day Care)의 시네마틱 스크롤 브랜드 사이트.
**메인(/)은 실사 시네마 에디션** — 실사 촬영 톤의 비디오 5편을 스크롤 크로스페이드로 전환하는 `<video>` 배경 엔진. 애니메이션 룩 버전은 `/v3/`에 애니 에디션으로, 이전 사진 기반 버전(v1)은 `/v2/`에 클래식 백업으로 동결.

## 라이브
- **https://gracedaycare.co.kr** (커스텀 도메인, HTTPS / Let's Encrypt)
- Pages: https://yongm1n.github.io/grace-senior/
- repo: https://github.com/yongm1n/grace-senior  (origin/main → 푸시 시 1~2분 내 자동 반영)

## 폴더 구조
```
.
├── index.html              # ← GitHub Pages가 서빙 (edition.json이 가리키는 에디션의 산출물, 직접 편집 금지)
├── src/site.html           # ← 편집하는 소스 (실사 시네마 메인. 1행 title + favicon + <!--HEAD--> 블록 + 본문)
├── build.js                # src/site.html → index.html + v1/index.html (+ dist/site.artifact.html). HEAD 블록을 <head>로 승격
├── edition.json            # 루트에 서빙할 에디션 선택 (main | classic | anime) — "에디션 전환" 섹션 참고
├── switch-edition.js       # edition.json → index.html 반영 + 사후 검증 (CI·로컬 공용)
├── .github/workflows/      # switch-edition.yml — edition.json 푸시 시 자동 반영
├── media/                  # 메인 배경 비디오 5편(mp4, 무음, 실사) + 포스터 jpg (hero/intro/program/health/meal)
├── assets/                 # 로고·파비콘·og.jpg + (v2가 쓰는) 사진 5장
├── v1/index.html           # 메인(실사 시네마) 미리보기 스냅샷 (noindex, build.js 생성물, 직접 편집 금지)
├── v2/index.html           # 클래식 v1 백업 스냅샷 (noindex, 동결 — 편집 대상 아님)
├── v3/                     # 애니 에디션 (애니메이션 룩, noindex): index.html + media/ 비디오·포스터
├── admin/index.html        # 운영자용 에디션 전환 콘솔 (/admin/, noindex)
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

## 에디션 전환 (main / classic / anime)
루트(`/`)에 어떤 에디션을 서빙할지는 **`edition.json`** 하나로 결정된다: `{"edition":"main"}` (허용값 `main` | `classic` | `anime`).

- **작동 원리**: `edition.json` 변경을 main 에 push → GitHub Actions(`.github/workflows/switch-edition.yml`)가 `node switch-edition.js` 실행 → 선택 에디션으로 `index.html` 재생성(경로 보정, 미리보기용 noindex 제거, `<title>` SEO 정규화, `<meta name="edition">` 마커 주입) + 사후 검증(상대참조 실재·SEO 태그·**루트 noindex 부재** — 실패 시 커밋 없이 중단) → 봇이 산출물 커밋·푸시 → 1~2분 후 라이브 반영. 봇 커밋은 `edition.json` 을 건드리지 않아 무한루프 없음. 미리보기 스냅샷(`/v1/`·`/v2/`·`/v3/`)은 모두 noindex — 루트로 승격될 때만 색인 허용.
- **/admin 사용법**: https://gracedaycare.co.kr/admin/ 에서 에디션 카드 선택 → 5초 내 2단계 확인 클릭 → 자동으로 `edition.json` 커밋 후 반영 상태를 폴링해 보여준다. 미리보기: 메인(실사 시네마) `/v1/` · 클래식 `/v2/` · 애니 `/v3/`.
- **PAT 발급** (/admin 에 필요): https://github.com/settings/personal-access-tokens/new → Repository access: **Only select repositories** → `yongm1n/grace-senior` → Permissions → **Contents: Read and write**. 발급한 토큰은 /admin 토큰 칸에 저장(해당 브라우저 localStorage 에만 보관).
- **로컬 전환**: `edition.json` 수정 후 `node switch-edition.js` (사후 검증 포함, exit 0 확인) → 커밋·푸시.
- **주의**: `index.html` 은 이제 "선택된 에디션"의 산출물이다. `src/site.html` 수정 후 `node build.js` 를 돌리면 — 선택이 main 이 아닐 경우 — 빌드 끝에서 `switch-edition.js` 가 자동 재실행되어 선택 에디션이 복원된다(메인 소스 작업이 실수로 루트 선택을 덮지 않음). 메인(실사 시네마) 최신본 확인은 `/v1/` 로.
- **검증 주의 (classic)**: classic 승격 상태의 `render.js` 검증은 file:// 로 열면 v2 의 WebGL 스테이지(texImage2D)가 이미지를 cross-origin 으로 취급해 pageerrors 5건의 **거짓 양성**이 난다. `python3 -m http.server` 등 HTTP 서버 경유로 검증할 것(HTTP 기준 0건, 실배포 https same-origin 에서도 미발생).
- **알려진 동작**: classic/anime 가 루트로 승격된 동안 해당 페이지 나브의 "메인으로"(`href="/"`)는 자기 자신을 가리킨다(루트=선택 에디션 개념상 정상). 메인 에디션 확인은 `/v1/` 직접 접근으로.

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
