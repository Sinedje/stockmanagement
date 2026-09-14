import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
for (const lang of ['fr','en']) {
  const p = await (await b.newContext()).newPage();
  const errs = [];
  p.on('console', m => { if ((m.type()==='error'||m.text().includes('[i18n]')) && !/ERR_CONNECTION_REFUSED|401/.test(m.text())) errs.push(m.text().slice(0,130)); });
  p.on('pageerror', e => errs.push('PAGE: '+e.message.slice(0,130)));
  await p.goto('http://localhost:5173/feu-flamenco', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await p.fill('input[type="text"], input[type="email"]', 'admin');
  await p.fill('input[type="password"]', 'Flamenco@Test2026');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(6000);
  if (lang === 'en') {
    await p.goto('http://localhost:5173/settings', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    await p.click('.ant-select'); await p.waitForTimeout(500);
    await p.click('.ant-select-item-option:has-text("English")'); await p.waitForTimeout(2500);
  }
  let raw = 0;
  for (const s of ['strategic','articles','stock_entry','transfers','customers','settings','notifications']) {
    await p.goto(`http://localhost:5173/${s}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    const body = await p.textContent('body');
    raw += (body.match(/\b(?:s|nav|sidebar|role|action|common|cash)\.[a-z0-9_]+/g)||[]).length;
  }
  console.log(`[${lang}] clés brutes à l'écran : ${raw} | erreurs : ${errs.length}`, errs.slice(0,3));
  await p.context().close();
}
await b.close();
