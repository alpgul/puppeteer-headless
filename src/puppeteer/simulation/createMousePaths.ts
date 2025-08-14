interface PathObject {
  x: number;
  y: number;
}

type EasingFunction = (t: number) => number;

const EasingFunctions = {
  linear: (t: number): number => t,

  easeOutQuad: (t: number): number => -t * (t - 2),

  easeInQuad: (t: number): number => t * t,

  easeInOutQuad: (t: number): number => {
    if (t < 0.5) {
      return 2 * t * t;
    }
    return -1 + (4 - 2 * t) * t;
  },

  easeInOutCubic: (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),

  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  easeInCubic: (t: number): number => t * t * t,

  easeOutCirc: (t: number): number => Math.sqrt(1 - Math.pow(t - 1, 2)),

  easeOutBounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984_375;
    }
  },
};

function calculateBezierPoint(bezier: {
  p0: PathObject;
  p1: PathObject;
  p2: PathObject;
  p3: PathObject;
  t: number;
}): PathObject {
  const { p0, p1, p2, p3, t } = bezier;
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/**
 *
 * @param start
 * @param start.startX
 * @param start.startY
 * @param end
 * @param end.endX
 * @param end.endY
 * @param area
 * @param area.maxX
 * @param area.maxY
 * @param area.minX
 * @param area.minY
 * @param options
 * @param options.curvature
 * @param options.easingFunction
 * @param options.frameRate
 * @param options.humanization
 * @param options.humanization.enabled
 * @param options.humanization.jitter
 * @param options.humanization.pauseProbability
 * @param options.humanization.speedVariation
 * @param options.speedMultiplier
 * @param options.targetWidth
 * @param options.timeframe
 */
function newCreateMousePaths(
  start: { startX: number; startY: number },
  end: { endX: number; endY: number },
  area: {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
  },
  options: {
    curvature?: number;
    easingFunction?: keyof typeof EasingFunctions;
    frameRate?: number;
    humanization?: {
      enabled: boolean;
      jitter?: number;
      pauseProbability?: number;
      speedVariation?: number;
    };
    speedMultiplier?: number;
    targetWidth?: number;
    timeframe?: number;
  } = {},
): Array<{ time: number; velocity?: number; x: number; y: number }> {
  const {
    curvature = 15,
    easingFunction = 'easeOutQuad',
    frameRate = 60,
    humanization = { enabled: true, jitter: 0.5, pauseProbability: 0.1, speedVariation: 0.2 },
    speedMultiplier = 1,
    targetWidth = 40,
    timeframe,
  } = options;

  const { startX, startY } = start;
  const { endX, endY } = end;

  // Clamp start and end points to the defined area
  const clampPoint = (point: PathObject): PathObject => ({
    x: Math.max(area.minX, Math.min(area.maxX, point.x)),
    y: Math.max(area.minY, Math.min(area.maxY, point.y)),
  });

  const startPoint = clampPoint({ x: startX, y: startY });
  const targetPoint = clampPoint({ x: endX, y: endY });

  const distance = Math.sqrt(Math.pow(targetPoint.x - startPoint.x, 2) + Math.pow(targetPoint.y - startPoint.y, 2));

  let movementTime: number;
  if (timeframe) {
    movementTime = timeframe * 1000;
  } else {
    const a = 50;
    const b = 150;
    const difficultyIndex = Math.log2(distance / targetWidth + 1);
    movementTime = (a + b * difficultyIndex) * speedMultiplier;
  }

  const totalFrames = Math.ceil((movementTime / 1000) * frameRate);
  const selectedEasing = EasingFunctions[easingFunction];

  // Calculate Bezier control points
  const controlOffset = curvature;
  const dx = targetPoint.x - startPoint.x;
  const dy = targetPoint.y - startPoint.y;
  const perpX = distance > 0 ? (-dy / distance) * controlOffset : 0;
  const perpY = distance > 0 ? (dx / distance) * controlOffset : 0;

  const p0 = startPoint;
  const p1 = clampPoint({
    x: startPoint.x + dx * 0.1 + perpX * 0.3,
    y: startPoint.y + dy * 0.1 + perpY * 0.3,
  });
  const p2 = clampPoint({
    x: targetPoint.x - dx * 0.1 + perpX * 0.3,
    y: targetPoint.y - dy * 0.1 + perpY * 0.3,
  });
  const p3 = targetPoint;

  // Generate the path points
  const path: Array<{ time: number; velocity?: number; x: number; y: number }> = [];
  let previousPoint: PathObject = startPoint;

  for (let index = 0; index <= totalFrames; index++) {
    const rawT = index / totalFrames;

    const easedT = selectedEasing(rawT);

    const point = calculateBezierPoint({ p0, p1, p2, p3, t: easedT });

    // Humanization effects
    if (humanization.enabled && humanization.jitter && index > 0 && index < totalFrames) {
      point.x += (Math.random() - 0.5) * humanization.jitter;
      point.y += (Math.random() - 0.5) * humanization.jitter;
    }

    // Clamp the calculated point to the area
    const clampedPoint = clampPoint(point);

    const velocity =
      index > 0
        ? Math.sqrt(Math.pow(clampedPoint.x - previousPoint.x, 2) + Math.pow(clampedPoint.y - previousPoint.y, 2))
        : 0;

    let frameTime = (1 / frameRate) * 1000;

    // Humanization: Speed variation
    if (humanization.enabled && humanization.speedVariation) {
      const variation = 1 + (Math.random() - 0.5) * humanization.speedVariation;
      frameTime *= variation;
    }

    // Humanization: Random pauses
    if (
      humanization.enabled &&
      humanization.pauseProbability &&
      Math.random() < humanization.pauseProbability &&
      index > 0 &&
      index < totalFrames
    ) {
      frameTime *= 1.5 + Math.random(); // 1.5x - 2.5x pause
    }

    path.push({
      time: frameTime,
      velocity,
      x: clampedPoint.x,
      y: clampedPoint.y,
    });

    previousPoint = clampedPoint;
  }

  return path;
}

/**
 *
 * @param path
 */
function getPathDuration(path: Array<{ time: number; x: number; y: number }>): number {
  return path.reduce((total, point) => total + point.time, 0);
}

/**
 *
 * @param path
 */
function getPathDistance(path: Array<{ time: number; x: number; y: number }>): number {
  let totalDistance = 0;
  for (let index = 1; index < path.length; index++) {
    const dx = path[index].x - path[index - 1].x;
    const dy = path[index].y - path[index - 1].y;
    totalDistance += Math.hypot(dx, dy);
  }
  return totalDistance;
}
export { type EasingFunction, type PathObject, EasingFunctions, getPathDistance, getPathDuration, newCreateMousePaths };
