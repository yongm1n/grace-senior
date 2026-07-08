#!/usr/bin/env node
/*
 * switch-edition.js — edition.json 이 가리키는 에디션을 루트 index.html 로 반영.
 *   main    → node build.js (src/site.html 재빌드. NO_SWITCH=1 로 상호 재귀 차단)
 *   classic → v2/index.html 을 경로 보정(../assets/ → assets/)해 루트로 승격
 *   anime   → v3/index.html 을 경로 보정(../assets/ → assets/, media/ → v3/media/)해 루트로 승격
 * 승격 시 미리보기용 <meta name="robots" content="noindex"> 를 제거하고(잔존 시 홈페이지가
 * 색인에서 제거됨), <title> 을 SEO 타이틀로 정규화, <meta name="edition"> 마커를 주입한다.
 * 마지막에 모든 에디션 공통 사후 검증(상대참조 실재 + 마커 + title + SEO 태그 + noindex 부재)을 돌려
 * 하나라도 실패하면 exit 1 — CI 에서 깨진 페이지가 배포되는 것을 차단한다.
 * 사용:  node switch-edition.js   (edition.json 수정 후. 외부 의존성 없음)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const SEO_TITLE = '더 그레이스 시니어 주간보호센터 | 부산 해운대 데이케어';
const ALLOWED = ['main', 'classic', 'anime'];

function fail(msg) {
  console.error('[switch-edition] 실패: ' + msg);
  process.exit(1);
}

// ---- 1) edition.json 읽기 + 값 검증 ----
let edition;
try {
  edition = JSON.parse(fs.readFileSync(path.join(root, 'edition.json'), 'utf8')).edition;
} catch (e) {
  fail('edition.json 을 읽을 수 없습니다 — ' + e.message);
}
if (!ALLOWED.includes(edition)) {
  fail('edition.json 값이 잘못됨: "' + edition + '" (허용: ' + ALLOWED.join(' | ') + ')');
}

// ---- 2) 에디션별 index.html 생성 ----
if (edition === 'main') {
  // build.js 가 index.html(마커 포함) + v1/index.html + dist 를 생성한다.
  const r = spawnSync('node', [path.join(root, 'build.js')], {
    env: { ...process.env, NO_SWITCH: '1' },
    stdio: 'inherit',
  });
  if (r.error) fail('build.js 실행 실패 — ' + r.error.message);
  if (r.status !== 0) fail('build.js 비정상 종료 (exit ' + r.status + ')');
} else {
  const srcFile = edition === 'classic' ? path.join('v2', 'index.html') : path.join('v3', 'index.html');
  let html = fs.readFileSync(path.join(root, srcFile), 'utf8');
  html = html.replace(/\.\.\/assets\//g, 'assets/');                       // /v2·/v3 기준 → 루트 기준
  if (edition === 'anime') html = html.replace(/(["'(=])media\//g, '$1v3/media/'); // v3 전용 media
  // v2/v3 스냅샷의 미리보기용 noindex 는 루트 승격 시 반드시 제거 — 남기면 https://gracedaycare.co.kr/
  // 전체가 구글·네이버 색인에서 제거된다 (사후 검증에서도 부재를 재확인).
  html = html.replace(/<meta[^>]*name=["']robots["'][^>]*>\s*/gi, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + SEO_TITLE + '</title>'); // 루트 승격 시 SEO 정규화
  html = html.replace('<head>', '<head><meta name="edition" content="' + edition + '">'); // 배포 마커
  fs.writeFileSync(path.join(root, 'index.html'), html);
}

// ---- 3) 공통 사후 검증 (main 포함 — 깨진 index.html 배포 차단) ----
const out = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];

// 상대참조 전수 추출: " ' ( = 바로 뒤의 assets/media/v1/v2/v3 경로만 (절대 URL 의
// https://…/assets/… 는 앞 글자가 '/' 라 매치되지 않음 — 치환/검증 대상 아님)
const refRe = /(["'(=])((?:\.\.\/)*(?:assets|media|v1|v2|v3)\/[A-Za-z0-9._/-]+)/g;
const refs = new Set();
let m;
while ((m = refRe.exec(out)) !== null) refs.add(m[2]);
for (const ref of refs) {
  if (ref.startsWith('../')) errors.push('상위 디렉토리 참조 잔존 (루트에서 깨짐): ' + ref);
  else if (!fs.existsSync(path.join(root, ref))) errors.push('참조 대상 파일 없음: ' + ref);
}
if (!out.includes('<meta name="edition" content="' + edition + '">')) {
  errors.push('에디션 마커 누락: <meta name="edition" content="' + edition + '">');
}
const title = (out.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
if (title !== SEO_TITLE) errors.push('<title> 이 SEO 타이틀이 아님: "' + title + '"');
for (const need of ['rel="canonical"', 'google-site-verification', 'naver-site-verification', 'application/ld+json', 'og:image', 'name="description"']) {
  if (!out.includes(need)) errors.push('SEO 필수 태그 누락: ' + need);
}
// 루트에는 어떤 에디션이든 noindex 가 있으면 안 된다 — 승격 시 제거 로직의 회귀를 여기서 차단.
const robotsNoindex = (out.match(/<meta[^>]*name=["']robots["'][^>]*>/gi) || []).find(t => /noindex/i.test(t));
if (robotsNoindex) errors.push('루트에 noindex 잔존 (색인 제거 유발): ' + robotsNoindex);

if (errors.length) {
  errors.forEach(e => console.error('[switch-edition] 검증 실패: ' + e));
  fail('index.html 검증 ' + errors.length + '건 실패 — 배포하면 안 되는 상태입니다.');
}

console.log('[switch-edition] 완료: edition=' + edition + ' → index.html (상대참조 ' + refs.size + '건 실재 확인, 마커·title·SEO 태그·noindex 부재 OK)');
