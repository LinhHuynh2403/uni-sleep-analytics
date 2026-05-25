const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://127.0.0.1:8080/Main/index.html', {waitUntil: 'networkidle0'});
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
