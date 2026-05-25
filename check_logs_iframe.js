const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  await page.goto('http://127.0.0.1:8080/radial_bar_chart/radial_chart.html', {waitUntil: 'networkidle0'});
  await browser.close();
})();
