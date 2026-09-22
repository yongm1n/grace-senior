# 더 그레이스 시니어 주간보호센터 — 브랜드 사이트

부산 해운대 **더 그레이스 시니어 주간보호센터**(THE GRACE Senior Day Care)의 시네마틱 스크롤 브랜드 사이트.
**메인(/)은 실사 시네마 에디션** — hero 영상 1편과 섹션 정지 이미지 4장(CSS 카메라 움직임)을 스크롤 크로스페이드로 전환하는 배경 엔진. 애니메이션 룩 버전은 `/v3/`에 애니 에디션으로, 이전 사진 기반 버전(v1)은 `/v2/`에 클래식 백업으로 동결.

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
├── media/                  # 메인 배경: hero 영상(mp4, 무음)+포스터 jpg, intro·program·health·meal 정지 이미지(webp + jpg 대체)
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
현재 운영 에디션은 `classic`입니다. 운영 화면의 제휴업체 영역은 `v2/index.html`의 `#partners`에서 수정하고, `node switch-edition.js`로 루트 `index.html`을 재생성합니다. 아래 `src/site.html` 편집 절차는 `main` 에디션에 해당합니다.

**제휴업체 영역은 세 곳에 있습니다. 수정할 때는 세 곳을 모두 고쳐야 합니다.**
- classic: `v2/index.html`의 `#partners`. 수정 후 `node switch-edition.js`로 루트 `index.html`에 반영합니다.
- main: `src/site.html`의 `#partners`. `/v1/`에서 보이며, 수정 후 `node build.js`로 `v1/index.html`에 반영합니다.
- anime: `v3/index.html`의 `#partners`. 빌드 없이 직접 고치는 원본이며 `/v3/`에서 바로 보입니다. 루트로 올릴 때는 `switch-edition.js`가 경로를 보정합니다.
- 세 곳의 상호·링크·순서·새 창 열기·`rel`·`aria-label`은 똑같이 맞춥니다. 모양(CSS)만 에디션별로 다릅니다.

### 제휴업체 링크 (2026-09-11 확인)
- 다나음재활센터: https://danaumrehab.co.kr/ — 해운대 다나음 재활운동센터 홈페이지.
- 효성노인건강센터: http://www.ihyosung.org/ — 기관 등록 홈페이지와 브라우저 접속 확인.
- 해운대탑정형외과, 사랑방재가복지센터: 공식 홈페이지·블로그를 확실히 식별하지 못하여 상호만 표시. 사랑방은 타 지역 동명 기관의 블로그가 있어 연결하지 않음.
- 외부 홈페이지는 새 창으로 열립니다. 제휴 범위·진료 내용 등 확인되지 않은 설명은 추가하지 않았습니다.

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

## 배경 비디오·정지 이미지 교체/추가 (메인)
- **hero**: 영상 `media/hero.mp4` + 포스터 `media/hero-poster.jpg`(해운대 풍경). closing 섹션도 이 영상을 다시 쓴다.
- **intro·program·health·meal**: 정지 이미지 `media/<key>.webp`(우선) + `media/<key>.jpg`(WebP 미지원 대체). 크기는 1920×1080이다.
  - 배경은 `<picture>`로 불러온다. 마지막 섹션의 썸네일 카드(`.fleet .ph-<key>`)도 같은 파일을 쓴다.
  - 파일명을 유지한 채 교체하면 코드는 고칠 필요가 없다.
- **정지 이미지 만드는 방식(2026-09-22~)**: Codex image_gen으로 만든다. 실제 센터 공간 사진을 참조해 공간을 맞췄고, **인물은 AI 생성**이다. 인물과 주요 행동은 오른쪽 절반에 두고, 왼쪽 아래는 글 자리로 비운다.
- **움직임은 CSS 카메라로 준다**: 안쪽 이미지의 `transform`(scale 1.00↔1.06과 약한 이동)만 바꾼다.
  - 한 방향에 10.5~12초가 걸리고, `ease-in-out alternate infinite`로 오간다.
  - 섹션마다 `transform-origin`(인물 쪽)과 방향을 다르게 잡았다. `@keyframes cam-<key>`에 있다.
  - 화면에 안 보이는 레이어는 멈춘다. 스테이지 JS가 보이는 레이어에만 `.live`를 붙인다.
  - `prefers-reduced-motion`이면 움직이지 않는다.
- AI 영상을 쓰지 않은 이유: 사람이 나오는 AI 영상(LTX 2.5 로컬 1080p)을 만들어 봤지만 얼굴 눈꺼풀이 계속 떨려서 포기했다.
- **가독성**: 이 네 섹션의 `.scene`에는 `interior` 클래스가 붙는다.
  - 데스크톱: 글 덩어리 뒤에만 어둠막(`--veil-*` 토큰)과 글자 그림자(`--halo*` 토큰)가 들어간다.
  - 모바일: 어둠막이 화면 폭 띠 모양이 된다. 사진 위쪽의 밝은 구간(창·조명)에 오는 eyebrow·제목 부분은 `--veil-strong`으로 조금 더 진하다.
- **휴대폰 사진 자리(`--photo-space`, 세 에디션 공통)**: 휴대폰(≤760px)에서는 장면마다 글이 이 높이 아래에서 시작한다. 그래서 장면에 들어오는 순간 얼굴이 먼저 보이고, 글은 그 아래에서 올라온다.
  - 값은 에디션 파일의 `#intro{--photo-space:…}` 줄에 있다: main `src/site.html`, classic `v2/index.html`, anime `v3/index.html`.
  - 배경 사진·영상을 바꾸면 얼굴 높이에 맞춰 이 값도 다시 잡는다(얼굴 아래 끝 + 여유 10px 정도).
  - 데스크톱은 이 값과 상관없이, 장면 위에 고정 내비 높이(`--nav-h`)만큼 여백을 둔다.
- 콘텐츠 규칙: 바다/일출 장면 금지(실제 시설과 불일치), 식사는 완전 조리된 한식만, 간호사캡 금지.
- 이전 영상 생성 방식(참고, 2026-09 이전): Higgsfield MCP 파이프라인. ①스틸 `seedream_v4_5` 16:9(스타일: 일본 극장판 애니·수채 파스텔·볼류메트릭 광, 좌하단 텍스트존 비움) → ②`kling3_0_turbo` image-to-video 5초 1080p(다이나믹 카메라+동작, 무음) → ③`ffmpeg -an -c:v libx264 -crf 26 -pix_fmt yuv420p -movflags +faststart` 재인코딩(개당 1~2MB) → ④포스터 = 스틸 1600px jpg.
- **섹션 추가 시**
  - `src/site.html`에 `.scene` 블록과 `.vlayer`를 추가하고, JS `TEXKEY` 배열에 키를 넣는다.
  - 영상이면 `.vlayer`에 video와 poster를 넣는다.
  - 정지 이미지면 `<picture>`와 `img.vstill`을 넣고, `.vlayer[data-key]` 규칙(`object-position`·`transform-origin`)과 `@keyframes cam-<key>`를 만든다. 밝은 실내면 `interior` 클래스도 붙인다.

## 클래식 백업 (/v2/)
- `v2/index.html` = 이전 사진 기반 v1의 동결 스냅샷(경로 `../assets/` 보정, noindex, 나브에 "메인으로" 링크). **수정 대상 아님** — 참고·롤백용.
- 메인 롤백이 필요하면 git 이력의 스왑 이전 `src/site.html`을 복원해 빌드하면 된다.

## 커스텀 도메인 (이미 연결됨)
- 레지스트라 DNS: A 4개 `185.199.108~111.153`(루트 @) + `www` CNAME→`yongm1n.github.io`.
- repo 루트 `CNAME` 파일(`gracedaycare.co.kr`)이 연결을 유지 — **푸시할 때 항상 포함**되어야 함.
- HTTPS는 GitHub가 Let's Encrypt 인증서 자동 발급. Settings→Pages에서 **Enforce HTTPS** 체크 권장.

## 공개 전 남은 일 (실사 데이터 교체)
- [ ] AI 연출 이미지 → **실제 센터 사진**으로 교체 (현재 인물은 실제 어르신·직원 아님). 메인 배경 정지 이미지 4장은 실제 공간을 참조해 만들었지만 **인물은 AI 생성(실제 어르신·직원 아님)**이다.
- [ ] 정확한 **도로명 주소 · 전화번호 · 운영시간** 반영 (현재 "부산 해운대구" + 통상값/SNS 링크만)
