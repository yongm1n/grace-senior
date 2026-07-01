#!/usr/bin/env node
/*
 * build.js — src/site.html 의 자리표시자(__IMG_*__ / __PNG_*__)를 채워 배포 산출물 생성.
 *   index.html              → GitHub Pages용 (이미지는 assets/ 상대경로, 경량)
 *   dist/site.artifact.html → Claude Artifact용 (이미지 base64 자체완결, CSP OK)
 * 사용:  node build.js
 * 규칙:  __IMG_HERO__ → assets/hero.jpg,  __PNG_LOGO__ → assets/logo.png  (KEY 소문자)
 */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = fs.readFileSync(path.join(root, 'src', 'site.html'), 'utf8');
const title = (src.match(/<title>(.*?)<\/title>/) || [, 'Site'])[1];
// favicon/apple-touch-icon <link> 는 <body> 안에 두면 브라우저가 head 로 재배치하지 않으므로
// (HTML5 파싱 스펙: body 시작 후의 메타데이터 태그는 body 에 그대로 남음) 명시적으로 head 에 넣는다.
const iconLinkRe = /\s*<link\b[^>]*\brel="(?:icon|apple-touch-icon)"[^>]*>/g;
const headLinks = (src.match(iconLinkRe) || []).map(s => s.trim()).join('');
const wrap = body =>
  '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>' + title + '</title>' + headLinks + '</head><body>' + body + '</body></html>';

// ---- Pages 빌드: assets/ 상대경로 ---- (favicon link 는 head 로 옮겼으니 body 에서는 제거)
const pages = src
  .replace(iconLinkRe, '')
  .replace(/__IMG_([A-Z0-9]+)__/g, (_, k) => 'assets/' + k.toLowerCase() + '.jpg')
  .replace(/__PNG_([A-Z0-9]+)__/g, (_, k) => 'assets/' + k.toLowerCase() + '.png');
fs.writeFileSync(path.join(root, 'index.html'), wrap(pages));

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

console.log('built: index.html (Pages, 상대경로)  +  dist/site.artifact.html (Artifact, base64)');
