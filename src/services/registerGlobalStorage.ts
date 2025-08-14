import { globallyStorage } from '../container/globallyStorage';
import { createAnimation } from '../simulation/initMouseSimulation';
import { logger } from '../utils/logs';

/**
 *
 */
export function registerMouseSim(): void {
  if (globalThis.puppeteer_mouseSim) {
    globallyStorage.setMouseSimBinding(globalThis.puppeteer_mouseSim);
    delete globalThis.puppeteer_mouseSim;
    delete globalThis.mouseSim;
  }
  if (globalThis.top === globalThis.self)
    document.addEventListener('mouseSim', (event) => {
      try {
        if (event.detail) createAnimation(JSON.parse(event.detail));
      } catch (error) {
        logger.error('Error in mouseSim event:', error);
      }
    });
}
