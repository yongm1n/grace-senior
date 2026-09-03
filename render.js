#!/usr/bin/env node
/*
 * render.js — 빌드된 index.html 을 열어 .scene[id] 섹션마다 스크린샷 + pageerror 검사.
 * 사용:  NODE_PATH=/Users/yongmin/node_modules node render.js [index.html | http URL]
 * 출력:  shot-<id>.png ...  +  pageerror 개수 (0 이어야 정상)
 * macOS 전용: Google Chrome + swiftshader(WebGL 소프트웨어 렌더; 경고는 무시).
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
(async () => {
  const file = process.argv[2] || 'index.html';
  let url;
  let localServer;
  if (/^https?:/.test(file)) {
    url = file;
  } else {
    // Serve local pages over HTTP so WebGL can load same-origin image textures.
    // file:// pages make Chrome reject texImage2D sources as cross-origin.
    const root = process.cwd();
    const requested = path.resolve(file);
    if (!requested.startsWith(root + path.sep)) throw new Error('Local render target must stay inside the repository');
    localServer = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      const target = path.resolve(root, '.' + pathname);
      if (!target.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
      fs.stat(target, (err, stat) => {
        if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200);
        fs.createReadStream(target).pipe(res);
      });
    });
    await new Promise(resolve => localServer.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${localServer.address().port}/${encodeURI(path.relative(root, requested))}`;
  }
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1512, height: 900 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const ids = await page.evaluate(() => Array.from(document.querySelectorAll('.scene[id]')).map(s => s.id));
  for (const id of ids) {
    await page.evaluate(x => document.getElementById(x).scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'shot-' + id + '.png' });
    process.stdout.write('shot ' + id + ' ');
  }
  console.log('\nscenes', ids.length, '| pageerrors', errs.length);
  if (errs.length) console.log(errs.slice(0, 8).join('\n'));
  await browser.close();
  if (localServer) await new Promise(resolve => localServer.close(resolve));
})().catch(e => { console.log('FATAL', e.message); process.exit(1); });
