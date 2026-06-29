# 더 그레이스 시니어 주간보호센터 — 브랜드 사이트

부산 해운대 **더 그레이스 시니어 주간보호센터**(THE GRACE Senior Day Care)의 시네마틱 스크롤 브랜드 사이트.
무료 생성형 이미지(Higgsfield z_image) + WebGL 스크롤-스크럽 배경 + 글래스 카드 모션. 전부 자체완결 코드.

## 라이브
- **https://gracedaycare.co.kr** (커스텀 도메인, HTTPS / Let's Encrypt)
- Pages: https://yongm1n.github.io/grace-senior/
- repo: https://github.com/yongm1n/grace-senior  (origin/main → 푸시 시 1~2분 내 자동 반영)

## 폴더 구조
```
.
├── index.html              # ← GitHub Pages가 서빙 (build.js 생성물, 직접 편집 금지)
├── assets/                 # 이미지 (hero/intro/program/health/meal.jpg + logo.png)
├── CNAME                   # gracedaycare.co.kr (커스텀 도메인 유지 — 지우지 말 것)
├── src/site.html           # ← 편집하는 소스 (자리표시자 __IMG_*__ / __PNG_LOGO__)
├── build.js                # src/site.html → index.html(+ dist/site.artifact.html)
├── render.js               # Playwright 검증 (섹션별 스크린샷 + pageerror)
└── dist/                   # Artifact용 산출물 (gitignore)
```

## 수정 → 배포 흐름
1. **편집**: `src/site.html` 만 고친다 (카피·CSS·섹션). `index.html` 은 직접 고치지 말 것 — 빌드가 덮어쓴다.
2. **빌드**: `node build.js` → `index.html`(Pages 상대경로) + `dist/site.artifact.html`(Artifact base64) 생성.
3. **검증(선택)**: `NODE_PATH=/Users/yongmin/node_modules node render.js` → `shot-<섹션>.png` + `pageerrors 0` 확인.
4. **배포**: `git add -A && git commit -m "..." && git push` → 1~2분 후 https://gracedaycare.co.kr 반영.

## 이미지 교체/추가
- 파일명 규칙: `__IMG_HERO__` ↔ `assets/hero.jpg` (KEY 소문자), `__PNG_LOGO__` ↔ `assets/logo.png`.
- 새 이미지: Higgsfield `z_image`(무료, 16:9 2048×1152) **순차 생성** → CloudFront PNG `curl` → `sips -s format jpeg -s formatOptions 82` 압축 → `assets/`에.
- 섹션 추가 시: `src/site.html` 에 `<section class="scene" ...>` 블록 추가(+`class="scene"` 필수, `data-key`/`data-label`), JS의 `TEXKEY` 배열에 키 추가, `assets/` 이미지 배치.

## 커스텀 도메인 (이미 연결됨)
- 레지스트라 DNS: A 4개 `185.199.108~111.153`(루트 @) + `www` CNAME→`yongm1n.github.io`.
- repo 루트 `CNAME` 파일(`gracedaycare.co.kr`)이 연결을 유지 — **푸시할 때 항상 포함**되어야 함.
- HTTPS는 GitHub가 Let's Encrypt 인증서 자동 발급. Settings→Pages에서 **Enforce HTTPS** 체크 권장.

## 공개 전 남은 일 (실사 데이터 교체)
- [ ] AI 연출 이미지 → **실제 센터 사진**으로 교체 (현재 인물은 실제 어르신·직원 아님)
- [ ] 정확한 **도로명 주소 · 전화번호 · 운영시간** 반영 (현재 "부산 해운대구" + 통상값/SNS 링크만)
