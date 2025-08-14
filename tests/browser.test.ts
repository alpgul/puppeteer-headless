import fs from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import * as esbuild from 'esbuild';
import puppeteer, { type Browser, type CDPSession, type Page } from 'puppeteer';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import config from '../esbuild.config.ts';
import { exposeMouseSim } from '../src/puppeteer/simulation/initMouseSimulation.ts';

const customTest = 1;
interface WebsiteTest {
  name: string;
  selector: string;
  url: string;
}
let testWebsites: WebsiteTest[] = [
  {
    //1
    name: 'Nopecha',
    selector: 'body > div.main-wrapper > div > div:nth-child(3)[style="display: none;"]',
    url: 'https://nopecha.com/demo/cloudflare',
  },
  {
    //2
    name: 'Pixelscan',
    selector: 'div.bg-consistentBg > img',
    url: 'https://pixelscan.net/fingerprint-check',
  },
  {
    //3
    name: 'Browserscan',
    selector:
      '#browserscan > main > div > div > div.row.row-align-start.row-justify-start > div.col.col-xs-24.col-md-12 > div > div:nth-child(6) > div > div > div > span',
    url: 'https://www.browserscan.net/',
  },
  {
    //4
    name: 'Brotector',
    selector: '#detections',
    url: 'https://kaliiiiiiiiii.github.io/brotector/',
  },
  {
    //5
    name: 'CreepJS',
    selector: 'div.visitor-info div.col-six > div > span.unblurred',
    url: 'https://abrahamjuliot.github.io/creepjs/',
  },
  {
    //6
    name: 'CreepJS-Workers',
    selector: 'body',
    url: 'https://abrahamjuliot.github.io/creepjs/tests/workers.html',
  },
  {
    //7
    name: 'CreepJS-Screen',
    selector: 'body',
    url: 'https://abrahamjuliot.github.io/creepjs/tests/screen.html',
  },
  {
    //8
    name: 'Sannysoft',
    selector: '#webgl-renderer.passed',
    url: 'https://bot.sannysoft.com/',
  },
  {
    //9
    name: 'IPHey',
    selector: 'body > div.loader.hide',
    url: 'https://iphey.com/',
  },
  {
    //10
    name: 'ReBrowser',
    selector: '#detections-table > tbody > tr:nth-child(10) > td:nth-child(1) > span',
    url: 'https://bot-detector.rebrowser.net/',
  },
  {
    //11
    name: 'DeviceInfo',
    selector: 'body',
    url: 'https://nopecha.com/demo/cloudflare',
  },
];
if (customTest > 0) {
  testWebsites = [testWebsites[customTest - 1]];
}
const gotoTimeout = 30_000;
const selectorTimeout = 30_000;
const createWebsiteScreenshotTest = (page: Page) => async (site: WebsiteTest) => {
  await page.goto(site.url, {
    timeout: gotoTimeout,
    waitUntil: 'networkidle2',
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

  await setTimeout(300);
  const screenshotPromise = page.screenshot({
    path: `out/${site.name}.png`,
  });

  return await screenshotPromise;
};
const localExecutablePath = '/usr/bin/google-chrome-stable';
const chromeVersion = '139.0.7258.127';
const chromeVersionMajor = chromeVersion.split('.')[0];
const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersionMajor}.0.0.0 Safari/537.36`;
const screen = { height: 1080 / 1.25, width: 1920 / 1.25 };
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
  platformVersion: '6.14.0',
  wow64: false,
};
async function createWorkerHandleInjection(
  cdp: CDPSession,
  filter: Array<{ exclude?: boolean; type: string }>,
  workerFile: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- Event handler needs to be async to run worker code
  cdp.on('Target.attachedToTarget', async ({ sessionId }) => {
    const connection = cdp.connection();
    const sessionCDP = connection?.session(sessionId);
    if (sessionCDP) {
      await sessionCDP.send('Runtime.evaluate', {
        expression: workerFile,
      });
      await sessionCDP.send('Runtime.runIfWaitingForDebugger');
    }
  });
  await cdp.send('Target.setDiscoverTargets', {
    discover: true,
    filter,
  });
  await cdp.send('Target.setAutoAttach', {
    autoAttach: true,
    filter,
    flatten: true,
    waitForDebuggerOnStart: true,
  });
}
describe.sequential('Browser Tests', () => {
  let browser: Browser;
  let page: Page;
  let websiteScreenshotTest;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      args: [
        '--proxy-server=socks5://127.0.0.1:1080',
        '--disable-features=PdfOopif,PrivacySandboxSettings4,MediaRouter,OptimizationHints,Translate',
        //'--disable-setuid-sandbox',
        '--force-fieldtrials',
        '--no-default-browser-check',
        '--no-sandbox',

        //'--enable-gpu',
        '--use-gl=angle',
        '--use-angle=gl-egl', //'--use-angle=shaderswift',
        '--ignore-gpu-blocklist',

        '--disable-blink-features=AutomationControlled',
        `--screen-info={${screen.width}x${screen.height}}`,
        '--start-fullscreen',
        '--user-agent=' + userAgent,
      ],
      debuggingPort: 9222,
      defaultViewport: { deviceScaleFactor: 1.25, height: screen.height, width: screen.width },
      executablePath: localExecutablePath,
      headless: true,
      ignoreDefaultArgs: [
        '--enable-features=NetworkServiceInProcess2',
        '--enable-blink-features=IdleDetection',
        '--allow-pre-commit-input',
        '--auto-open-devtools-for-tabs',
        '--disable-breakpad',
        '--disable-dev-shm-usage',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--enable-automation',
        '--export-tagged-pdf',
        '--force-color-profile',
        '--hide-scrollbars',
        '--remote-debugging-pipe',
      ],
    });
  }, selectorTimeout);

  afterAll(async () => {
    await browser?.close();
    expect(browser.connected).toBe(false);
  });

  it('should initialize the browser and the page', () => {
    expect(browser).toBeDefined();
  });

  it('create workerPatch and cfPatch', async () => {
    const build = await esbuild.build(config);
    expect(build).toBeDefined();
  });

  it('page and worker injection', async () => {
    let workerFile = fs.readFileSync(path.join(process.cwd(), '/build/workerPatch.js'), 'utf8');
    workerFile = workerFile.replace('globalThis.metaData', JSON.stringify(metaData));

    const browserCDP = await browser.target().createCDPSession();
    await sharedWorkerInjection(browserCDP, workerFile);
    await createWorkerHandleInjection(browserCDP, [{ type: 'shared_worker' }, { type: 'service_worker' }], workerFile);

    page = await browser.newPage();
    page.exposeFunction('mouseSim', exposeMouseSim.bind(page));
    expect(page).toBeDefined();
    websiteScreenshotTest = createWebsiteScreenshotTest(page);
    const pageCDP = await page.createCDPSession();
    await createWorkerHandleInjection(pageCDP, [{ type: 'worker' }], workerFile);

    await page.setUserAgent(userAgent, metaData);
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
        selectorTimeout + gotoTimeout + 1_000_000,
      );
    }
  });
});
async function sharedWorkerInjection(pageCDP: CDPSession, workerFile: string) {
  await pageCDP.send('Fetch.enable', {
    patterns: [
      {
        requestStage: 'Response',
        resourceType: 'Other',
      },
    ],
  });

  pageCDP.on('Fetch.requestPaused', async (event) => {
    try {
      const targets = await pageCDP.send('Target.getTargets');
      const target = targets.targetInfos.find((target) => target.url === event.request.url);
      if (target?.type === 'shared_worker') {
        const response = await pageCDP.send('Fetch.getResponseBody', { requestId: event.requestId });
        if (response.base64Encoded) {
          response.body = Buffer.from(response.body, 'base64').toString('utf-8');
        }
        await pageCDP.send('Fetch.fulfillRequest', {
          body: Buffer.from(workerFile + '\n' + response.body).toString('base64'),
          requestId: event.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }],
        });
      } else {
        await pageCDP.send('Fetch.continueRequest', { requestId: event.requestId });
      }
    } catch {
      await pageCDP.send('Fetch.continueRequest', { requestId: event.requestId });
    }
  });
}
