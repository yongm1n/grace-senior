#!/usr/bin/env node
/*
 * build.js — src/site.html 의 자리표시자(__IMG_*__ / __PNG_*__)를 채워 배포 산출물 생성.
 *   index.html              → GitHub Pages용 (이미지는 assets/ 상대경로, 경량)
 *   dist/site.artifact.html → Claude Artifact용 (이미지만 base64 임베드 — media/ 비디오·포스터,
 *                             favicon 은 상대참조로 남아 완전 자체완결은 아님)
 * 사용:  node build.js
 * 규칙:  __IMG_HERO__ → assets/hero.jpg,  __PNG_LOGO__ → assets/logo.png  (KEY 소문자)
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = fs.readFileSync(path.join(root, 'src', 'site.html'), 'utf8');
const title = (src.match(/<title>(.*?)<\/title>/) || [, 'Site'])[1];
// head 승격 1: src/site.html 의 <!--HEAD--> ... <!--/HEAD--> 블록(meta description·OG·JSON-LD·
// canonical·계측 스니펫 등)을 통째로 <head> 로 옮긴다. 소스에는 <head> 가 없으므로 이 마커가
// 유일한 head 주입 통로 — 여기 안 넣으면 메타 태그는 body 로 들어가 무효가 된다.
const headBlockRe = /<!--HEAD-->([\s\S]*?)<!--\/HEAD-->\s*/;
const headExtra = ((src.match(headBlockRe) || [, ''])[1] || '').trim();
const bodySrc = src.replace(headBlockRe, '');
// head 승격 2: favicon/apple-touch-icon <link> 는 <body> 안에 두면 브라우저가 head 로 재배치하지 않으므로
// (HTML5 파싱 스펙: body 시작 후의 메타데이터 태그는 body 에 그대로 남음) 명시적으로 head 에 넣는다.
const iconLinkRe = /\s*<link\b[^>]*\brel="(?:icon|apple-touch-icon)"[^>]*>/g;
const headLinks = (bodySrc.match(iconLinkRe) || []).map(s => s.trim()).join('');
const wrap = body =>
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  // 에디션 마커 — /admin 의 "현재 배포" 확인과 switch-edition.js 사후 검증이 읽는다.
  // (wrap() 산출물인 index.html·v1 에만 들어감 — dist 는 wrap 없이 원본 src 를 임베드하므로 마커 없음)
  '<meta name="edition" content="main">' +
  '<title>' + title + '</title>' + headLinks + headExtra + '</head><body>' + body + '</body></html>';

// ---- Pages 빌드: assets/ 상대경로 ---- (head 로 옮긴 title/favicon/HEAD 블록은 body 에서 제거)
// 자리표시자 치환은 wrap 결과 전체에 적용 — HEAD 블록 안에서 __IMG_*__ 를 써도 동작한다.
const pages = wrap(
  bodySrc
    .replace(/<title>.*?<\/title>\s*/, '')
    .replace(iconLinkRe, '')
)
  .replace(/__IMG_([A-Z0-9]+)__/g, (_, k) => 'assets/' + k.toLowerCase() + '.jpg')
  .replace(/__PNG_([A-Z0-9]+)__/g, (_, k) => 'assets/' + k.toLowerCase() + '.png');
fs.writeFileSync(path.join(root, 'index.html'), pages);

// ---- v1 스냅샷: 애니메이티드 에디션을 /v1/ 에서 항상 미리볼 수 있게 (에디션 전환 후에도) ----
// 상대참조만 한 단계 위로(assets/→../assets/, media/→../media/). 절대 URL
// (https://gracedaycare.co.kr/assets/og.jpg)은 앞 글자가 '/' 라 치환되지 않는다.
// 루트와 동일 콘텐츠의 중복 표면이므로 v2/v3 미리보기와 동일하게 noindex 를 주입한다
// (canonical 은 지시가 아닌 힌트라 단독으로는 별도 색인을 못 막음).
fs.mkdirSync(path.join(root, 'v1'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'v1', 'index.html'),
  pages
    .replace('<meta name="edition" content="main">',
             '<meta name="edition" content="main"><meta name="robots" content="noindex">')
    .replace(/(["'(])(assets|media)\//g, '$1../$2/')
);

// ---- Artifact 빌드: base64 임베드 ----
function embed(html) {
  for (const k of new Set([...src.matchAll(/__IMG_([A-Z0-9]+)__/g)].map(m => m[1]))) {
    const f = path.join(root, 'assets', k.toLowerCase() + '.jpg');
    if (!fs.existsSync(f)) { console.error('MISSING image:', f); process.exit(1); }
    html = html.split('__IMG_' + k + '__').join('data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64'));
  }
  for (const k of new Set([...src.matchAll(/__PNG_([A-Z0-9]+)__/g)].map(m => m[1]))) {
    const f = path.join(root, 'assets', k.toLowerCase() + '.png');
    if (!fs.existsSync(f)) { console.error('MISSING png:', f); process.exit(1); }
    html = html.split('__PNG_' + k + '__').join('data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
  }
  return html;
}
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'site.artifact.html'), embed(src));

console.log('built: index.html (Pages, 상대경로)  +  v1/index.html (스냅샷)  +  dist/site.artifact.html (Artifact, base64)');

// ---- 에디션 가드: edition.json 이 main 이 아닌데 build.js 를 직접 돌리면 방금 쓴 index.html 이
// 선택된 에디션을 덮어쓴다 → switch-edition.js 를 재실행해 선택을 복원한다.
// (switch-edition.js 가 build.js 를 부를 때는 NO_SWITCH=1 이라 재귀하지 않음) ----
if (!process.env.NO_SWITCH) {
  const edFile = path.join(root, 'edition.json');
  if (fs.existsSync(edFile)) {
    let ed;
    try { ed = JSON.parse(fs.readFileSync(edFile, 'utf8')).edition; }
    catch (e) { console.error('edition.json 파싱 실패:', e.message); process.exit(1); }
    if (ed && ed !== 'main') {
      console.warn('\n⚠️  ⚠️  edition.json 선택이 "' + ed + '" 입니다 — 루트 index.html 은 main 이 아니라');
      console.warn('⚠️  ⚠️  선택 에디션이어야 하므로 switch-edition.js 로 재적용합니다.\n');
      const r = require('child_process').spawnSync('node', [path.join(root, 'switch-edition.js')], { stdio: 'inherit' });
      if (r.error || r.status !== 0) process.exit(r.status || 1);
    }
  }
}
