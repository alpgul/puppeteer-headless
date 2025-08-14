import type { Page } from 'puppeteer';

import { SCREEN_SCALE, SCREEN_SIZE, SLEEP_TIME } from '../../core/constant/global';
import { getRandomNumber } from '../../utils/random';
import { sleep } from '../../utils/sleep';

import { newCreateMousePaths } from './createMousePaths';
/**
 *
 * @param target
 * @param target.x
 * @param target.y
 */
export function exposeMouseSim(this: Page, target: { x: number; y: number }): void {

  const area = {
    maxX: SCREEN_SIZE.width / SCREEN_SCALE,
    maxY: SCREEN_SIZE.height / SCREEN_SCALE,
    minX: 0,
    minY: 0,
  };
  const start = {
    startX: Math.floor(Math.random() * (area.maxX - area.minX + 1) + area.minX),
    startY: Math.floor(Math.random() * (area.maxY - area.minY + 1) + area.minY),
  };
  const end = {
    endX: target.x,
    endY: target.y,
  };
  const paths = newCreateMousePaths(start, end, area, {
    easingFunction: 'easeOutQuad',
    frameRate: 60, // FPS
    humanization: { enabled: false },
    timeframe: 0.32, // seconds
  });
  console.log(`startX:${start.startX}, startY:${start.startY}, endX:${end.endX}, endY:${end.endY},paths size:${paths.length}`)
  new Promise<void>(async (resolve) => {
    await sleep(SLEEP_TIME);
    for (const path of paths) {
      this.mouse.move(path.x, path.y);
      await new Promise((resolve) => setTimeout(resolve, 1000 / 60));
    }
    await new Promise((resolve) => setTimeout(resolve, 56));
    this.mouse.click(target.x, target.y);
    resolve();
  });
  this.evaluate((paths) => {
    const event = new CustomEvent('mouseSim', {
      detail: JSON.stringify(paths),
    });
    document.dispatchEvent(event);
  }, paths);
}
