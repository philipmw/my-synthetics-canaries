import {Page} from "puppeteer-core/lib/esm/puppeteer/common/Page";

const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

async function generateSimplePhrase(page: Page): Promise<void> {
  // Regenerate the simplest phrase
  await page.click("button#template-small");
  // wait for the re-generation to complete
  await page.waitForSelector("div#phrase span.plain");
  return Promise.resolve();
}

async function readPhrase(page: Page): Promise<string|null> {
  // wait for phrase to be available
  await page.waitForSelector("div#phrase span.plain");
  return page.$eval("div#phrase-inner", (el: Element) => el.textContent);
}

const pageLoadBlueprint = async function () {
  // Configure the stage of the API using environment variables
  const url = String(process.env.SITE_URL);

  const page = await synthetics.getPage();
  const response = await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 10000,
  });

  if (response.status() !== 200) {
    throw 'Failed to load page!';
  }

  await synthetics.takeScreenshot('loaded', 'loaded');

  const pageTitle = await page.title();
  log.info('Page title: ' + pageTitle);
  if (pageTitle !== "phrase shop: secure yet memorable passphrases") {
    throw new Error("Unexpected page title")
  }

  const firstPhraseText = await readPhrase(page);
  log.info(`First phrase: ${firstPhraseText}`);
  if (firstPhraseText == null) {
    throw new Error("Could not find the first phrase");
  }
  const firstPhraseWords = firstPhraseText.trim().split(' ');
  if (firstPhraseWords.length != 4) {
    throw new Error(`First phrase was expected to have 4 words, but had ${firstPhraseWords.length} instead`);
  }

  await generateSimplePhrase(page);

  const secondPhraseText = await readPhrase(page);
  log.info(`Second phrase: ${secondPhraseText}`);
  if (secondPhraseText == null) {
    throw new Error("Could not find the first phrase");
  }

  if (firstPhraseText === secondPhraseText) {
    throw new Error("Second phrase matches the first phrase");
  }

  const secondPhraseWords = secondPhraseText.trim().split(' ');
  if (secondPhraseWords.length != 4) {
    throw new Error(`Second phrase was expected to have 4 words, but had ${secondPhraseWords.length} instead`);
  }

};

exports.handler = async () => {
  return await pageLoadBlueprint();
};
