/* eslint-disable @typescript-eslint/no-magic-numbers -- Disabling magic numbers check for simulation constants */
import type { PathObject } from '../core/type/mouse';

import { globallyStorage } from './../container/globallyStorage';

const WAIT_TIME = 5000;
const BUTTON_NONE = -1;
const BUTTON_PRIMARY = 0;
const BUTTON_STATE_NONE = 0;
const POINTER_ID = 1;
const DETAIL_NONE = 0;
const DETAIL_CLICK = 1;
const MOVEMENT_NONE = 0;
const createPointerEvent = (
  type: string,
  path: { x: number; y: number },
  movement: { movementX: number; movementY: number } | undefined,
  options: { button: number; detail?: number },
): PointerEvent => {
  const event = new PointerEvent(type, {
    ...movement,
    ...options,
    bubbles: true,
    buttons: BUTTON_STATE_NONE,
    cancelable: true,
    clientX: path.x,
    clientY: path.y,
    composed: true,
    isPrimary: true,
    pointerId: POINTER_ID,
    pointerType: 'mouse',
    screenX: path.x + globallyStorage.getScreenRect().x,
    screenY: path.y + globallyStorage.getScreenRect().y,
    view: globalThis as unknown as Window,
  });

  Object.defineProperty(event, '_isTrusted', {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
  return event;
};

const createMouseEvent = (path: { x: number; y: number }, movementX: number, movementY: number): MouseEvent => {
  const event = new MouseEvent('mousemove', {
    bubbles: true,
    button: BUTTON_PRIMARY,
    buttons: BUTTON_STATE_NONE,
    cancelable: true,
    clientX: path.x,
    clientY: path.y,
    composed: true,
    detail: DETAIL_NONE,
    movementX,
    movementY,
    screenX: path.x + globallyStorage.getScreenRect().x,
    screenY: path.y + globallyStorage.getScreenRect().y,
    view: globalThis as unknown as Window,
    which: BUTTON_STATE_NONE,
  });

  Object.defineProperty(event, '_isTrusted', {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
  return event;
};
function calculateBezierPoint(bezier: {
  naturalT: number;
  p0: PathObject;
  p1: PathObject;
  p2: PathObject;
  p3: PathObject;
}): PathObject {
  const { naturalT, p0, p1, p2, p3 } = bezier;
  const u = 1 - naturalT;
  const tt = naturalT * naturalT;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * naturalT;

  return {
    x: uuu * p0.x + 3 * uu * naturalT * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * naturalT * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}
function getRandomNumber(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xff_ff_ff_ff;
}

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
function createMousePaths(
  start: { startX: number; startY: number },
  end: { endX: number; endY: number },
  targetWidth: number,
  area: {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  },
): Array<{ time: number; x: number; y: number }> {
  const { startX, startY } = start;
  const { endX, endY } = end;
  // Clamp start and end points to the defined area
  const clampPoint = (point: PathObject): PathObject => ({
    x: Math.max(area.minX, Math.min(area.maxX, point.x)),
    y: Math.max(area.minY, Math.min(area.maxY, point.y)),
  });

  // Create temporary points
  const startPoint = clampPoint({ x: startX, y: startY });
  const targetPoint = clampPoint({ x: endX, y: endY });

  // Calculate distance between points
  const distance = Math.sqrt(Math.pow(targetPoint.x - startPoint.x, 2) + Math.pow(targetPoint.y - startPoint.y, 2));

  // Use default values for parameters
  const curvature = 50;
  const speedMultiplier = 6;

  // Calculate movement time using Fitts' Law
  const a = 50; // start time
  const b = 150; // slope factor
  const difficultyIndex = Math.log2(distance / targetWidth + 1);
  const movementTime = (a + b * difficultyIndex) * speedMultiplier;
  const totalFrames = Math.ceil((movementTime / 1000) * 60); // 60 FPS

  // Calculate Bezier control points
  const controlOffset = curvature;
  const dx = targetPoint.x - startPoint.x;
  const dy = targetPoint.y - startPoint.y;
  const perpX = (-dy / distance) * controlOffset;
  const perpY = (dx / distance) * controlOffset;

  const p0 = startPoint;
  const p1 = clampPoint({
    x: startPoint.x + dx * 0.3 + perpX,
    y: startPoint.y + dy * 0.3 + perpY,
  });
  const p2 = clampPoint({
    x: targetPoint.x - dx * 0.3 + perpX,
    y: targetPoint.y - dy * 0.3 + perpY,
  });
  const p3 = targetPoint;

  // Generate the path points
  const path: Array<{ time: number; x: number; y: number }> = [];
  for (let index = 0; index <= totalFrames; index++) {
    const rawT = index / totalFrames;
    const naturalT = applyNaturalMotion(rawT);
    const point = calculateBezierPoint({ naturalT, p0, p1, p2, p3 });

    // Clamp the calculated point to the area
    const clampedPoint = clampPoint(point);

    path.push({
      time: ((1 / 60) * 1000 * (100 + getRandomNumber() * 2)) / 100, // fps drop using crypto
      x: clampedPoint.x,
      y: clampedPoint.y,
    });
  }

  return path;

  // Helper functions
  function applyNaturalMotion(t: number): number {
    // Cubic ease-in-out
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
function createRealMouse(targetElement: Element): void {
  const startX = getRandomNumber() * globalThis.innerWidth;
  const startY = getRandomNumber() * globalThis.innerHeight;
  const rectEnd = targetElement.getBoundingClientRect();
  const endX = rectEnd.x + rectEnd.width * getRandomNumber();
  const endY = rectEnd.y + rectEnd.height * getRandomNumber();
  const area = {
    maxX: globalThis.innerWidth,
    maxY: globalThis.innerHeight,
    minX: 0,
    minY: 0,
  };
  const paths = createMousePaths({ startX, startY }, { endX, endY }, rectEnd.width, area);
  mouseMovePaths(paths, targetElement);
}
function mouseMovePaths(paths: Array<{ time: number; x: number; y: number }>, targetElement: Element): void {
  let pathIndex = 1;
  let previousTarget: Element | undefined = undefined;
  let redDot = document.querySelector('#redDot') as HTMLDivElement | null;
  if (!redDot) {
    redDot = document.createElement('div') as HTMLDivElement;
    redDot.id = 'redDot';
    redDot.style.cssText =
      'position:absolute;width:24px;height:24px;background-color:red;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events: none;z-index:9999;';
    document.body.after(redDot);
  }
  createDynamicKeyframes(redDot, paths);
  const moveStep = (): void => {
    const path = paths.at(pathIndex);
    if (!path) return;

    const target = document.elementFromPoint(path.x, path.y);
    if (!target) return;

    const previousPath = pathIndex > 0 ? paths[pathIndex - 1] : undefined;
    const movementX = previousPath ? path.x - previousPath.x : MOVEMENT_NONE;
    const movementY = previousPath ? path.y - previousPath.y : MOVEMENT_NONE;

    if (target !== previousTarget) {
      const pointerover = createPointerEvent(
        'pointerover',
        path,
        { movementX: MOVEMENT_NONE, movementY: MOVEMENT_NONE },
        { button: BUTTON_NONE },
      );
      target.dispatchEvent(pointerover);
      previousTarget = target;
    }

    const pointermove = createPointerEvent('pointermove', path, { movementX, movementY }, { button: BUTTON_NONE });
    target.dispatchEvent(pointermove);

    const mousemove = createMouseEvent(path, movementX, movementY);
    target.dispatchEvent(mousemove);

    pathIndex++;
    const nextPath = paths.at(pathIndex);
    if (nextPath) {
      setTimeout(moveStep, nextPath.time);
    } else {
      const click = createPointerEvent('click', path, undefined, { button: BUTTON_PRIMARY, detail: DETAIL_CLICK });
      if (targetElement instanceof HTMLElement) {
        targetElement.focus();
      }
      targetElement.dispatchEvent(click);
      target.dispatchEvent(click);
    }
  };
  setTimeout(() => {
    redDot.style.backgroundColor = 'green';
    const animation = redDot.style.animation;
    redDot.style.animation = 'none';

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Trigger browser reflow to reset CSS animation by accessing offsetHeight
    redDot.offsetHeight;
    redDot.style.animation = animation;
  }, WAIT_TIME);
  setTimeout(moveStep, WAIT_TIME);
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
            createRealMouse(checkbox);
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
