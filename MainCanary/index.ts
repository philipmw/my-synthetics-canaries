const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const pageLoadBlueprint = async function () {
  // Configure the stage of the API using environment variables
  const url = String(process.env.SITE_URL);

  const page = await synthetics.getPage();
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  // Wait for page to render. Increase or decrease wait time based on endpoint being monitored.
  await page.waitForTimeout(15000);

  if (response.status() !== 200) {
    throw 'Failed to load page!';
  }

  await synthetics.takeScreenshot('loaded', 'loaded');

  const pageTitle = await page.title();
  log.info('Page title: ' + pageTitle);
  if (pageTitle !== "Schreck's cross-country ski lessons at Snoqualmie Pass near Seattle") {
    throw new Error("Unexpected page title")
  }

  await page.waitForSelector("a#pricing");
};

exports.handler = async () => {
  return await pageLoadBlueprint();
};