const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  await page.goto('http://127.0.0.1:8080/Main/index.html', {waitUntil: 'networkidle0'});
  await page.waitForTimeout(2000); // Wait 2s for animations
  await page.screenshot({ path: 'screenshot2.png' });
  await browser.close();
})();
