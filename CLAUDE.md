# 더 그레이스 시니어 주간보호센터 — 프로젝트 작업 규칙

## ⚠️ 작업 방식 (사용자 지시 — 엄수)
**이 프로젝트에서 진행되는 모든 디자인·마크업·카피·레이아웃 작업은 반드시 전문 웹디자이너 서브에이전트(`.claude/agents/web-designer.md`, `subagent_type: web-designer`)를 통해 수행하고, 그 에이전트의 자체 검증(빌드 + Playwright 렌더 + 스크린샷 육안 확인)을 거친 뒤 결과를 보고한다.**
메인 세션이 직접 `src/site.html`을 손대지 말 것 — 작업은 디자이너 에이전트에게 위임한다. 커밋/푸시는 사용자 확인 후 메인 세션이 처리.

## 빌드/배포 핵심 (상세는 README.md)
- 편집 소스는 **`src/site.html`** 뿐. `index.html`/`dist/`는 빌드 산출물 — 직접 편집 금지.
- 빌드: `node build.js` · 검증: `NODE_PATH=/Users/yongmin/node_modules node render.js`
- 배포: `git push origin main` → 1~2분 후 https://gracedaycare.co.kr (GitHub Pages, CNAME 유지 필수).

## 에디션 전환 (상세는 README.md "에디션 전환")
- 루트 `index.html` = `edition.json`(main|classic|anime)이 가리키는 에디션의 산출물. 전환은 `/admin/` 또는 `edition.json` 수정 → push(Actions 자동 반영), 로컬은 `node switch-edition.js`.
- `node build.js` 는 edition.json 이 main 이 아니면 끝에서 `switch-edition.js` 를 자동 재실행해 선택 에디션을 보존한다. `v1/index.html` 도 빌드 산출물 — 직접 편집 금지.
