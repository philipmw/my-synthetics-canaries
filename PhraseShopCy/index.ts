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
  if (pageTitle !== "phrase shop: secure yet memorable passphrases") {
    throw new Error("Unexpected page title")
  }

  // Wait for the first phrase to get generated
  await page.waitForTimeout(5000);

  const firstPhraseText = await page.$eval("div#phrase-inner", (el: Element) => el.textContent);
  log.info(`First phrase: ${firstPhraseText}`);
};

exports.handler = async () => {
  return await pageLoadBlueprint();
};