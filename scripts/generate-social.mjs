import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

// Optional artwork utility. The committed PNG is ready to deploy; Chromium is
// needed only when regenerating it, not to install, build, or run the invitation.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDir = join(root, 'public');
const serif = readFileSync(join(publicDir, 'fonts/cormorant-400-normal.woff2')).toString('base64');
const sans = readFileSync(join(publicDir, 'fonts/inter-400-normal.woff2')).toString('base64');
const flowers = readFileSync(join(publicDir, 'botanical.svg'), 'utf8')
  .replace(/<\?xml[^>]*>/, '')
  .replace('<svg ', '<svg aria-hidden="true" ');
const temporary = mkdtempSync(join(tmpdir(), 'nikah-social-'));
const htmlPath = join(temporary, 'preview.html');
const output = join(publicDir, 'social-preview.png');

writeFileSync(htmlPath, `<!doctype html><html lang="en"><meta charset="utf-8"><style>
@font-face{font-family:InvitationSerif;src:url(data:font/woff2;base64,${serif}) format('woff2');font-weight:400;font-style:normal}
@font-face{font-family:InvitationSans;src:url(data:font/woff2;base64,${sans}) format('woff2');font-weight:400;font-style:normal}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:#F7F4EC;color:#183B36;font-family:InvitationSerif,Georgia,serif;text-align:center;position:relative}
.outer{position:absolute;inset:24px;border:1px solid #B4965D}.inner{position:absolute;inset:32px;border:1px solid #B4965D40}
.botanical{position:absolute;top:-38px;left:-20px;width:275px;height:395px;transform:rotate(-7deg)}.botanical svg{width:100%;height:100%}
.right{left:auto;right:-20px;transform:scaleX(-1) rotate(-7deg)}
.arch{position:absolute;inset:52px 190px 48px;fill:none;stroke:#B4965D;stroke-width:1}
.copy{position:absolute;inset:130px 150px 90px}
.eyebrow{font-family:InvitationSans,Arial,sans-serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;margin:0 0 24px}
.occasion{font-size:33px;letter-spacing:1px;margin:0 0 25px;font-weight:400}
.names{font-size:93px;line-height:1.08;letter-spacing:-2px;margin:0;font-weight:400}
.separator{display:flex;align-items:center;justify-content:center;gap:17px;margin:28px 0 26px;color:#B4965D}
.separator span{width:80px;border-top:1px solid #B4965D80}.separator i{width:7px;height:7px;border:1px solid #B4965D;transform:rotate(45deg)}
.date{font-family:InvitationSans,Arial,sans-serif;font-size:15px;letter-spacing:4px;text-transform:uppercase;margin:0}
.foot{position:absolute;bottom:56px;left:0;right:0;font-size:19px;font-style:italic;color:#183B36b3}
</style><body><div class="outer"></div><div class="inner"></div>
<svg class="arch" viewBox="0 0 820 530" preserveAspectRatio="none" aria-hidden="true"><path d="M28 516V233C28 139 118 102 238 80C332 63 390 35 410 14C430 35 488 63 582 80C702 102 792 139 792 233V516"/><path opacity=".4" d="M39 516V235C39 148 121 113 241 91C328 75 388 49 410 28C432 49 492 75 579 91C699 113 781 148 781 235V516"/></svg>
<div class="botanical">${flowers}</div><div class="botanical right">${flowers}</div>
<main class="copy"><p class="eyebrow">With the blessings of Allah</p><p class="occasion">The Nikah Ceremony</p><h1 class="names">Fahad &amp; Rahnuma</h1><div class="separator"><span></span><i></i><span></span></div><p class="date">12 November 2026</p></main>
<p class="foot">An invitation to celebrate a blessed beginning</p>
</body></html>`);

let browser;
const server = createServer((_request, response) => { response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); response.end(readFileSync(htmlPath)); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const previewUrl = `http://127.0.0.1:${server.address().port}`;
try {
  const chromium = process.env.CHROME_BIN || 'chromium';
  browser = spawn(chromium, [
    '--headless', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--disable-dev-shm-usage', '--disable-background-networking', '--disable-gpu', '--hide-scrollbars',
    '--force-device-scale-factor=1', '--window-size=1200,630',
    `--user-data-dir=${join(temporary, 'chromium-profile')}`,
    '--remote-debugging-port=0', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, XDG_CACHE_HOME: join(temporary, 'cache') } });
  let diagnostic = '';
  browser.stderr.on('data', chunk => { diagnostic += chunk.toString(); });
  browser.on('error', error => { diagnostic += error.message; });
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      port = readFileSync(join(temporary, 'chromium-profile/DevToolsActivePort'), 'utf8').split('\n')[0];
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  if (!port) throw new Error(`Set CHROME_BIN to a Chromium executable.\n${diagnostic}`);
  const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(response => response.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  const pending = new Map();
  let sequence = 0;
  socket.addEventListener('message', event => {
    const response = JSON.parse(event.data);
    if (!response.id || !pending.has(response.id)) return;
    const { resolve, reject, timeout } = pending.get(response.id);
    clearTimeout(timeout);
    pending.delete(response.id);
    response.error ? reject(new Error(response.error.message)) : resolve(response.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out.`)); }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: previewUrl });
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))', awaitPromise: true });
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
  socket.close();
  console.log('Generated public/social-preview.png (1200 × 630).');
} finally {
  if (browser && browser.exitCode === null && browser.signalCode === null) {
    browser.kill('SIGTERM');
    await new Promise(resolve => browser.once('exit', resolve));
  }
  await new Promise(resolve => server.close(resolve));
  rmSync(temporary, { recursive: true, force: true });
}
