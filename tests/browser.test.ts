import fs from 'node:fs';
import path from 'node:path';

import chromium from '@sparticuz/chromium-min';
import puppeteer, { type Browser, type CDPSession, type Page } from 'puppeteer-core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
interface WebsiteTest {
  name: string;
  selector: string;
  url: string;
}

const testWebsites: WebsiteTest[] = [
  {
    name: 'Nopecha',
    selector: 'body > div.main-wrapper > div > div:nth-child(3)[style="display: none;"]',
    url: 'https://nopecha.com/demo/cloudflare',
  },
  {
    name: 'Pixelscan',
    selector: 'div.bg-consistentBg > img',
    url: 'https://pixelscan.net/fingerprint-check',
  },
  {
    name: 'Browserscan',
    selector:
      '#browserscan > main > div > div > div.row.row-align-start.row-justify-start > div.col.col-xs-24.col-md-12 > div > div:nth-child(6) > div > div > div > span',
    url: 'https://www.browserscan.net/',
  },
  {
    name: 'Brotector',
    selector: '#detections',
    url: 'https://kaliiiiiiiiii.github.io/brotector/',
  },
  {
    name: 'CreepJS',
    selector: 'div.visitor-info div.col-six > div > span.unblurred',
    url: 'https://abrahamjuliot.github.io/creepjs/',
  },
  {
    name: 'Sannysoft',
    selector: '#webgl-renderer.passed',
    url: 'https://bot.sannysoft.com/',
  },
  {
    name: 'IPHey',
    selector: 'body > div.loader.hide',
    url: 'https://iphey.com/',
  },
  {
    name: 'ReBrowser',
    selector: '#detections-table > tbody > tr:nth-child(10) > td:nth-child(1) > span',
    url: 'https://bot-detector.rebrowser.net/',
  },
];
const isDevelopment = process.env.NODE_ENV === 'production';
const gotoTimeout = 10_000;
const selectorTimeout = 30_000;
const createWebsiteScreenshotTest = (page: Page) => async (site: WebsiteTest) => {
  await page.goto(site.url, {
    timeout: gotoTimeout,
    waitUntil: 'load',
  });

  try {
    await page.waitForSelector(site.selector, {
      timeout: selectorTimeout,
      visible: false,
    });
  } catch {
    await page.screenshot({
      path: `out/${site.name}.png`,
    });
    throw new Error('Selector not found');
  }
  await Bun.sleep(100);
  const screenshotPromise = page.screenshot({
    path: `out/${site.name}.png`,
  });

  return await screenshotPromise;
};
const localExecutablePath = '/usr/bin/google-chrome-canary';
const chromeVersion = '139.0.7252.0';
const chromeVersionMajor = chromeVersion.split('.')[0];
const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersionMajor}.0.0.0 Safari/537.36`;
const metaData = {
  architecture: 'x86',
  bitness: '64',
  brands: [
    {
      brand: 'Not)A;Brand',
      version: '99',
    },
    {
      brand: 'Chromium',
      version: chromeVersionMajor,
    },
    {
      brand: 'Google Chrome',
      version: chromeVersionMajor,
    },
  ],
  fullVersion: chromeVersion,
  fullVersionList: [
    {
      brand: 'Not)A;Brand',
      // eslint-disable-next-line sonarjs/no-hardcoded-ip -- IP-like version string is intentional for browser compatibility
      version: '99.0.0.0',
    },
    {
      brand: 'Chromium',
      version: chromeVersion,
    },
    {
      brand: 'Google Chrome',
      version: chromeVersion,
    },
  ],
  mobile: false,
  model: '',
  platform: 'Linux',
  platformVersion: '6.11.0',
  wow64: false,
};
async function createWorkerHandleInjection(
  cdp: CDPSession,
  filter: Array<{ type: string }>,
  workerFile: string,
): Promise<void> {
  await cdp.send('Target.setAutoAttach', {
    autoAttach: true,
    filter,
    flatten: true,
    waitForDebuggerOnStart: true,
  });
  await cdp.send('Target.setDiscoverTargets', {
    discover: true,
    filter,
  });
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Event handler needs to be async to run worker code
  cdp.on('Target.attachedToTarget', async ({ sessionId }) => {
    const connection = cdp.connection();
    const sessionCDP = connection?.session(sessionId);
    await sessionCDP?.send('Runtime.evaluate', {
      expression: workerFile,
    });
    await sessionCDP?.send('Runtime.runIfWaitingForDebugger');
  });
}
describe.sequential('Browser Tests', () => {
  let browser: Browser;
  let page: Page;
  let websiteScreenshotTest;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      args: [
        '--allow-pre-commit-input',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-extensions-with-background-pages',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--enable-blink-features=IdleDetection',
        '--export-tagged-pdf',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--no-first-run',
        '--password-store=basic',
        '--use-mock-keychain',
        '--disable-domain-reliability',
        '--disable-print-preview',
        '--disable-speech-api',
        '--disk-cache-size=33554432',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--font-render-hinting=none',
        '--enable-features=NetworkServiceInProcess2,SharedArrayBuffer',
        '--hide-scrollbars',
        '--ignore-gpu-blocklist',
        '--in-process-gpu',
        '--use-gl=angle',
        '--enable-unsafe-swiftshader',
        '--allow-running-insecure-content',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--no-zygote',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=PdfOopif',
        `--screen-info={${1920 / 1.25}x${1080 / 1.25} }`, //workAreaLeft=0 workAreaRight=0 workAreaTop=0 workAreaBottom=32
        '--start-fullscreen',
        '--user-agent=' + userAgent,
      ],
      debuggingPort: 9222,
      defaultViewport: { deviceScaleFactor: 1.25, height: 1080 / 1.25, width: 1920 / 1.25 },
      executablePath: isDevelopment
        ? await chromium.executablePath(
            'https://github.com/Sparticuz/chromium/releases/download/v137.0.1/chromium-v137.0.1-pack.x64.tar',
          )
        : localExecutablePath,
      headless: true,
      ignoreDefaultArgs: [
        '--enable-automation',
        '--disable-popup-blocking',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-extensions',
      ],
    });
    page = await browser.newPage();
    websiteScreenshotTest = createWebsiteScreenshotTest(page);
  });

  afterAll(async () => {
    await browser.close();
    expect(browser.connected).toBe(false);
  });

  it('should initialize the browser and the page', () => {
    expect(browser).toBeDefined();
    expect(page).toBeDefined();
  });

  it('create workerPatch and cfPatch', async () => {
    const build = await Bun.build({
      entrypoints: ['./src/cfPatch.js', './src/workerPatch.js'],
      format: 'iife',
      outdir: './build',
    });
    expect(build.success).toBe(true);
  });

  it('page and worker injection', async () => {
    const browserCDP = await browser.target().createCDPSession();
    let workerFile = fs.readFileSync(path.join(process.cwd(), '/build/workerPatch.js'), 'utf8');
    workerFile = workerFile.replace('globalThis.metaData', JSON.stringify(metaData));
    await createWorkerHandleInjection(browserCDP, [{ type: 'service_worker' }, { type: 'shared_worker' }], workerFile);
    await page.setUserAgent(userAgent, metaData);
    const pageCDP = await page.createCDPSession();
    await createWorkerHandleInjection(pageCDP, [{ type: 'worker' }], workerFile);
    const preloadFile = fs.readFileSync(path.join(process.cwd(), '/build/cfPatch.js'), 'utf8');
    const evaluationPromise = page.evaluateOnNewDocument(preloadFile);
    await expect(evaluationPromise).resolves.not.toThrow();
  });
  describe('Multiple Website Screenshots', () => {
    beforeAll(() => {
      expect(page).toBeDefined();
    });
    for (const site of testWebsites) {
      it(
        `screenshot for ${site.name}`,
        // eslint-disable-next-line @typescript-eslint/no-loop-func -- this is a test
        async () => {
          expect(websiteScreenshotTest).toBeDefined();
          const screenshot = await websiteScreenshotTest(site);
          expect(screenshot).toBeDefined();
        },
        selectorTimeout + gotoTimeout,
      );
    }
  });
});
