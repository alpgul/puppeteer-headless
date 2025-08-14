/* eslint-disable @typescript-eslint/no-magic-numbers -- Disabling magic numbers check for simulation constants */
/* import type { PathObject } from '../core/type/mouse'; */

import { globallyStorage } from './../container/globallyStorage';
import { getRandomNumber } from '../utils/random';

function createDynamicKeyframes(targetElement: HTMLElement, pathArray: Array<{ x: number; y: number }>): void {
  let keyframesStyle = document.querySelector('#dynamicKeyframes');
  if (!keyframesStyle) {
    keyframesStyle = document.createElement('style');
    keyframesStyle.id = 'dynamicKeyframes';
    document.head.append(keyframesStyle);
  }

  let keyframesCSS = '@keyframes dynamicPathMove {\n';

  for (const [index, path] of pathArray.entries()) {
    const percentage = (index / (pathArray.length - 1)) * 100;

    keyframesCSS += `  ${percentage.toFixed(2)}% {
left: ${path.x}px;
top: ${path.y}px;
}\n`;
  }

  keyframesCSS += '}';

  keyframesStyle.textContent = keyframesCSS;

  targetElement.style.animation = `dynamicPathMove ${((pathArray.length / 60) * 1000).toFixed(0)}ms linear infinite`;
}
export function createAnimation(paths: Array<{ time: number; x: number; y: number }>): void {
  let greenDot = document.querySelector('#greenDot') as HTMLDivElement | null;
  if (!greenDot) {
    greenDot = document.createElement('div') as HTMLDivElement;
    greenDot.id = 'greenDot';
    greenDot.style.cssText =
      'position:absolute;width:24px;height:24px;background-color:green;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events: none;z-index:9999;';
    document.body.after(greenDot);
  }
  createDynamicKeyframes(greenDot, paths);
}
async function initFakeMouse(targetElement, iframeScreenRect) {
  const targetRect = targetElement.getBoundingClientRect();
  const targetCord = {
    x: targetRect.x + targetRect.width * getRandomNumber() + iframeScreenRect.x,
    y: targetRect.y + targetRect.height * getRandomNumber() + iframeScreenRect.y,
  };
  globallyStorage.exposeMouseSim(targetCord);
}
/**
 *
 * @param observedNode The DOM node to observe for mutations
 */
function observeNode(observedNode: Node): void {
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
          const checkbox =
            node instanceof HTMLInputElement && node.tagName === 'INPUT' && node.type === 'checkbox'
              ? node
              : node.querySelector<HTMLInputElement>('input[type="checkbox"]');
          if (checkbox) {
            globallyStorage.getScreenRect().then((screenRect) => {
              initFakeMouse(checkbox, screenRect);
            });
          }
        }
      }
    }
  });

  observer.observe(observedNode, {
    childList: true,
    subtree: true,
  });
}
export default observeNode;
/* eslint-enable @typescript-eslint/no-magic-numbers -- Disabling magic numbers check for simulation constants */
