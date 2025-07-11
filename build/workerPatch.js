"use strict";
(() => {
  // src/utils/browser.ts
  function hasDocument(win) {
    try {
      return Boolean(win.document);
    } catch {
      return false;
    }
  }
  function traverseParentChain(currentWindow) {
    try {
      while (currentWindow.parent !== currentWindow && hasDocument(currentWindow.parent)) {
        currentWindow = currentWindow.parent;
      }
      return currentWindow;
    } catch {
      return currentWindow;
    }
  }
  var Browser = {
    findIframeByWindow(findIframe) {
      for (const shadowRoot of globallyStorage.getShadowRootSet()) {
        const iframes2 = shadowRoot.querySelectorAll("iframe");
        for (const iframe of iframes2) {
          if (iframe.contentWindow === findIframe) {
            return iframe;
          }
        }
      }
      const iframes = globalThis.document.querySelectorAll("iframe");
      for (const iframe of iframes) {
        if (iframe.contentWindow === findIframe) {
          return iframe;
        }
      }
    },
    findTopAccessibleWindow() {
      const topWindow = globalThis;
      if (topWindow.top && topWindow.top instanceof Window && hasDocument(topWindow.top)) {
        return topWindow.top;
      }
      return traverseParentChain(topWindow.self);
    }
  };
  var browser_default = Browser;

  // src/container/globallyStorage.ts
  var GloballyStorage = class _GloballyStorage {
    static instance;
    metaData;
    screenRect;
    shadowRootSet;
    topWindow;
    topWindowToString;
    constructor() {
      this.shadowRootSet = /* @__PURE__ */ new Set();
    }
    static getInstance() {
      _GloballyStorage.instance ??= new _GloballyStorage();
      return _GloballyStorage.instance;
    }
    addShadowRoot(shadowRoot) {
      this.shadowRootSet.add(shadowRoot);
    }
    getMetaData() {
      return this.metaData;
    }
    getScreenRect() {
      if (this.screenRect === void 0) {
        return new DOMRect();
      }
      return this.screenRect;
    }
    getShadowRootSet() {
      return this.shadowRootSet;
    }
    getTopWindow() {
      this.topWindow ??= browser_default.findTopAccessibleWindow();
      return this.topWindow;
    }
    getToWindowToString() {
      this.topWindowToString ??= this.getTopWindow().Function.prototype.toString;
      return this.topWindowToString;
    }
    setMetaData(metaData) {
      this.metaData = metaData;
    }
    setScreenRect(rect) {
      this.screenRect = rect;
    }
  };
  var globallyStorage = GloballyStorage.getInstance();

  // src/core/constant/global.ts
  var NOT_FOUND = -1;
  var FILTER_PATCH_NAME = "filterPatch";
  var consoleMethods = ["log", "error", "info", "warn", "trace", "dir", "debug", "dirxml", "table"];
  var errorTypes = [
    "TypeError",
    "ReferenceError",
    "SyntaxError",
    "RangeError",
    "EvalError",
    "URIError",
    "AggregateError"
  ];

  // src/container/stackFilterStorage.ts
  var StackFilterStorage = class _StackFilterStorage {
    static instance;
    filters = [];
    constructor() {
    }
    static getInstance() {
      _StackFilterStorage.instance ??= new _StackFilterStorage();
      return _StackFilterStorage.instance;
    }
    add(filter) {
      this.filters.push(filter);
    }
    remove(filter) {
      const index = this.filters.indexOf(filter);
      if (index !== NOT_FOUND) {
        this.filters.splice(index, 1 /* SINGLE_ITEM_REMOVAL */);
      }
    }
    getFilters() {
      return this.filters;
    }
    apply(error, stackObject) {
      for (const filter of this.filters) {
        if (typeof filter === "function" && error.stack !== void 0) {
          [error, stackObject] = filter(error, stackObject);
        }
      }
      return [error, stackObject];
    }
    clear() {
      this.filters = [];
    }
  };
  var stackFilterStorage = StackFilterStorage.getInstance();

  // src/filters/consoleFilter.ts
  function consoleFilter(error, stackObject) {
    if (error.stack !== void 0) {
      const arrayStack = error.stack.split("\n");
      const stackIndex = arrayStack.findIndex((item) => item.includes("consoleCommonFunction"));
      if (stackIndex > NOT_FOUND) {
        arrayStack.splice(stackIndex, 1 /* SINGLE_ITEM_REMOVAL */);
        if (stackIndex < arrayStack.length - 1) {
          const line = arrayStack.at(stackIndex);
          if (typeof line === "string") {
            arrayStack.splice(
              stackIndex,
              1,
              line.replaceAll(/eval at applyPatch[^)]+\), /g, "").replaceAll(/(<anonymous>):\d+:\d+/g, "$1")
            );
          }
        }
        stackObject.splice(stackIndex - 1, 1 /* SINGLE_ITEM_REMOVAL */);
        error.stack = arrayStack.join("\n");
      }
    }
    return [error, stackObject];
  }

  // src/patches/console/console.ts
  var FakeConsole = class {
    static Type = 2 /* VALUE */;
    static consoleCommonFunction = (...arguments_) => {
      for (const argument of arguments_) {
        if (argument !== null && argument !== void 0 && (typeof argument === "object" || typeof argument === "function") && Reflect.has(argument, "toString")) {
          argument.toString();
        }
      }
    };
  };
  var console_default = FakeConsole;

  // src/container/originalFunctionStorage.ts
  var OriginalFunctionStorage = class _OriginalFunctionStorage {
    static instance;
    storage;
    constructor() {
      this.storage = /* @__PURE__ */ new WeakMap();
    }
    static getInstance() {
      _OriginalFunctionStorage.instance ??= new _OriginalFunctionStorage();
      return _OriginalFunctionStorage.instance;
    }
    store(wrappedFunction, originalFunction) {
      this.storage.set(wrappedFunction, originalFunction);
    }
    get(wrappedFunction) {
      return this.storage.get(wrappedFunction);
    }
    has(wrappedFunction) {
      return this.storage.has(wrappedFunction);
    }
  };
  var originalFunctionStorage = OriginalFunctionStorage.getInstance();

  // src/services/registerFunction.ts
  var RegisterService = class _RegisterService {
    static instance;
    originalDispatch = globalThis.dispatchEvent;
    constructor() {
      this.originalDispatch = globalThis.dispatchEvent;
    }
    static getInstance() {
      _RegisterService.instance ??= new _RegisterService();
      return _RegisterService.instance;
    }
    registerFunction({
      originalFunction,
      wrappedFunction
    }) {
      const topWindow = globallyStorage.getTopWindow();
      if (topWindow === globalThis.self) {
        originalFunctionStorage.store(wrappedFunction, originalFunction);
      } else {
        Reflect.apply(this.originalDispatch, topWindow, [
          new CustomEvent("__cfPatch__addFunctionToStorage", { detail: { originalFunction, wrappedFunction } })
        ]);
      }
    }
  };
  var registerService = RegisterService.getInstance();

  // src/strategies/modifyFunction.ts
  function modifyFunction(originalFunctionParent, property, wrappedDescriptor, type) {
    const originalDescriptor = Object.getOwnPropertyDescriptor(originalFunctionParent, property);
    if (originalDescriptor) {
      switch (type) {
        case 0 /* GET */: {
          if (typeof originalDescriptor.get === "function" && typeof wrappedDescriptor.get === "function") {
            Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
            registerService.registerFunction({
              originalFunction: originalDescriptor.get,
              wrappedFunction: wrappedDescriptor.get
            });
          }
          break;
        }
        case 1 /* SET */: {
          if (typeof originalDescriptor.get === "function" && typeof wrappedDescriptor.get === "function" && typeof originalDescriptor.set === "function" && typeof wrappedDescriptor.set === "function") {
            Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
            registerService.registerFunction({
              originalFunction: originalDescriptor.get,
              wrappedFunction: wrappedDescriptor.get
            });
            registerService.registerFunction({
              originalFunction: originalDescriptor.set,
              wrappedFunction: wrappedDescriptor.set
            });
          }
          break;
        }
        case 2 /* VALUE */: {
          if (typeof originalDescriptor.value === "function" && typeof wrappedDescriptor.value === "function") {
            Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
            registerService.registerFunction({
              originalFunction: originalDescriptor.value,
              wrappedFunction: wrappedDescriptor.value
            });
          }
          break;
        }
      }
    }
  }

  // src/strategies/patch/consolePatch.ts
  var ConsolePatch = {
    applyPatch(console) {
      for (const name of consoleMethods) {
        const wrappedFunctionString = `{${name}(...args){return Reflect.apply(modifyFunction,this,args);}}`;
        const wrappedDescriptor = new Function(
          "modifyFunction",
          `return Object.getOwnPropertyDescriptor(${wrappedFunctionString}, '${name}')`
        )(console_default.consoleCommonFunction);
        if (wrappedDescriptor) {
          modifyFunction(console, name, wrappedDescriptor, 2 /* VALUE */);
        }
      }
    }
  };
  var consolePatch_default = ConsolePatch;

  // src/patches/console/context.ts
  var FakeContext = class _FakeContext {
    static OriginalFunction;
    static Type = 2 /* VALUE */;
    static context(...arguments_) {
      const consoleContext = Reflect.apply(_FakeContext.OriginalFunction, this, arguments_);
      if (!(consoleContext instanceof Object)) {
        return;
      }
      const typedContext = consoleContext;
      consolePatch_default.applyPatch(typedContext);
      return typedContext;
    }
  };
  var context_default = FakeContext;

  // src/patches/NavigatorUAData/getHighEntropyValues.ts
  var FakeMetaData = class _FakeMetaData {
    static OriginalFunction;
    static Type = 2 /* VALUE */;
    static getHighEntropyValues(hints, ...arguments_) {
      const returnValue = Reflect.apply(_FakeMetaData.OriginalFunction, this, [hints, ...arguments_]);
      if (!returnValue) {
        return Promise.resolve({});
      }
      const data = returnValue.then((meta) => {
        const metaData = globallyStorage.getMetaData();
        if (metaData && typeof metaData === "object") {
          if (metaData.fullVersion) {
            metaData.uaFullVersion = metaData.fullVersion;
            delete metaData.fullVersion;
          }
          for (const key in meta) {
            if (metaData[key]) {
              meta[key] = metaData[key] ?? meta[key];
            }
          }
        }
        return meta;
      });
      return data;
    }
  };
  var getHighEntropyValues_default = FakeMetaData;

  // src/patches/WebGLRenderingContext/getParameter.ts
  var FakeGetParameter = class _FakeGetParameter {
    static OriginalFunction;
    static Type = 2 /* VALUE */;
    static getParameter(pname) {
      const returnValue = Reflect.apply(_FakeGetParameter.OriginalFunction, this, [pname]);
      if (typeof returnValue === "string") {
        if (returnValue === "Google Inc. (Google)") return "Google Inc. (NVIDIA Corporation)";
        if (returnValue.includes("ANGLE") && returnValue.includes("SwiftShader"))
          return "ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 3060/PCIe/SSE2, OpenGL 4.6.0 NVIDIA 537.13)";
      }
      return returnValue;
    }
  };
  var getParameter_default = FakeGetParameter;

  // src/strategies/patch/commonPatch.ts
  var CommonPatch = {
    applyPatch(classPatch, originalFunctionParent, property) {
      const wrappedDescriptor = Object.getOwnPropertyDescriptor(classPatch, property);
      const originalDescriptor = Object.getOwnPropertyDescriptor(originalFunctionParent, property);
      if (wrappedDescriptor && originalDescriptor) {
        switch (classPatch.Type) {
          case 0 /* GET */: {
            classPatch.OriginalGetFunction = originalDescriptor.get;
            break;
          }
          case 1 /* SET */: {
            classPatch.OriginalSetFunction = originalDescriptor.set;
            classPatch.OriginalGetFunction = originalDescriptor.get;
            break;
          }
          case 2 /* VALUE */: {
            classPatch.OriginalFunction = originalDescriptor.value;
            break;
          }
        }
        modifyFunction(originalFunctionParent, property, wrappedDescriptor, classPatch.Type);
      }
    }
  };
  var commonPatch_default = CommonPatch;

  // src/filters/commonFunctionFilter.ts
  function CommonFunctionFilter(error, stackObject) {
    if (error.stack !== void 0) {
      const arrayStack = error.stack.split("\n");
      const stackIndex = arrayStack.findIndex((item) => item.includes(FILTER_PATCH_NAME));
      if (stackIndex > NOT_FOUND) {
        arrayStack.splice(stackIndex, 2 /* TWO_ITEM_REMOVAL */);
        stackObject.splice(stackIndex - 1, 2 /* TWO_ITEM_REMOVAL */);
        error.stack = arrayStack.join("\n");
      }
    }
    return [error, stackObject];
  }

  // src/container/listenerStorage.ts
  var ListenerStorage = class _ListenerStorage {
    static instance;
    globalOnMessageArr;
    listenerMap;
    constructor() {
      this.listenerMap = /* @__PURE__ */ new WeakMap();
      this.globalOnMessageArr = [];
    }
    static getInstance() {
      _ListenerStorage.instance ??= new _ListenerStorage();
      return _ListenerStorage.instance;
    }
    deleteListenerMap(callback) {
      this.listenerMap.delete(callback);
    }
    dispatchGlobalOnMessage(that_, event) {
      for (const function_ of this.globalOnMessageArr) {
        function_.apply(that_, [event]);
      }
    }
    getListenerMap(callback) {
      return this.listenerMap.get(callback);
    }
    onMessageAdd(callback) {
      this.globalOnMessageArr.push(callback);
    }
    onMessageRemove(callback) {
      const index = this.globalOnMessageArr.indexOf(callback);
      if (index !== NOT_FOUND) {
        this.globalOnMessageArr.splice(index, 1 /* SINGLE_ITEM_REMOVAL */);
      }
    }
    setListenerMap(callback, wrappedListener) {
      this.listenerMap.set(callback, { counter: 1, wrappedListener });
    }
  };
  var listenerStorage = ListenerStorage.getInstance();

  // src/simulation/initMouseSimulation.ts
  var WAIT_TIME = 5e3;
  var BUTTON_NONE = -1;
  var BUTTON_PRIMARY = 0;
  var BUTTON_STATE_NONE = 0;
  var POINTER_ID = 1;
  var DETAIL_NONE = 0;
  var DETAIL_CLICK = 1;
  var MOVEMENT_NONE = 0;
  var createPointerEvent = (type, path, movement, options) => {
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
      pointerType: "mouse",
      screenX: path.x + globallyStorage.getScreenRect().x,
      screenY: path.y + globallyStorage.getScreenRect().y,
      view: globalThis.self
    });
    Object.defineProperty(event, "_isTrusted", {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    });
    return event;
  };
  var createMouseEvent = (path, movementX, movementY) => {
    const event = new MouseEvent("mousemove", {
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
      view: globalThis.self,
      which: BUTTON_STATE_NONE
    });
    Object.defineProperty(event, "_isTrusted", {
      configurable: false,
      enumerable: false,
      value: true,
      writable: false
    });
    return event;
  };
  function calculateBezierPoint(bezier) {
    const { naturalT, p0, p1, p2, p3 } = bezier;
    const u = 1 - naturalT;
    const tt = naturalT * naturalT;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * naturalT;
    return {
      x: uuu * p0.x + 3 * uu * naturalT * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
      y: uuu * p0.y + 3 * uu * naturalT * p1.y + 3 * u * tt * p2.y + ttt * p3.y
    };
  }
  function getRandomNumber() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 4294967295;
  }
  function createDynamicKeyframes(targetElement, pathArray) {
    let keyframesStyle = document.querySelector("#dynamicKeyframes");
    if (!keyframesStyle) {
      keyframesStyle = document.createElement("style");
      keyframesStyle.id = "dynamicKeyframes";
      document.head.append(keyframesStyle);
    }
    let keyframesCSS = "@keyframes dynamicPathMove {\n";
    for (const [index, path] of pathArray.entries()) {
      const percentage = index / (pathArray.length - 1) * 100;
      keyframesCSS += `  ${percentage.toFixed(2)}% {
left: ${path.x}px;
top: ${path.y}px;
}
`;
    }
    keyframesCSS += "}";
    keyframesStyle.textContent = keyframesCSS;
    targetElement.style.animation = `dynamicPathMove ${(pathArray.length / 60 * 1e3).toFixed(0)}ms linear infinite`;
  }
  function createMousePaths(start, end, targetWidth, area) {
    const { startX, startY } = start;
    const { endX, endY } = end;
    const clampPoint = (point) => ({
      x: Math.max(area.minX, Math.min(area.maxX, point.x)),
      y: Math.max(area.minY, Math.min(area.maxY, point.y))
    });
    const startPoint = clampPoint({ x: startX, y: startY });
    const targetPoint = clampPoint({ x: endX, y: endY });
    const distance = Math.sqrt(Math.pow(targetPoint.x - startPoint.x, 2) + Math.pow(targetPoint.y - startPoint.y, 2));
    const curvature = 50;
    const speedMultiplier = 6;
    const a = 50;
    const b = 150;
    const difficultyIndex = Math.log2(distance / targetWidth + 1);
    const movementTime = (a + b * difficultyIndex) * speedMultiplier;
    const totalFrames = Math.ceil(movementTime / 1e3 * 60);
    const controlOffset = curvature;
    const dx = targetPoint.x - startPoint.x;
    const dy = targetPoint.y - startPoint.y;
    const perpX = -dy / distance * controlOffset;
    const perpY = dx / distance * controlOffset;
    const p0 = startPoint;
    const p1 = clampPoint({
      x: startPoint.x + dx * 0.3 + perpX,
      y: startPoint.y + dy * 0.3 + perpY
    });
    const p2 = clampPoint({
      x: targetPoint.x - dx * 0.3 + perpX,
      y: targetPoint.y - dy * 0.3 + perpY
    });
    const p3 = targetPoint;
    const path = [];
    for (let index = 0; index <= totalFrames; index++) {
      const rawT = index / totalFrames;
      const naturalT = applyNaturalMotion(rawT);
      const point = calculateBezierPoint({ naturalT, p0, p1, p2, p3 });
      const clampedPoint = clampPoint(point);
      path.push({
        time: 1 / 60 * 1e3 * (100 + getRandomNumber() * 2) / 100,
        // fps drop using crypto
        x: clampedPoint.x,
        y: clampedPoint.y
      });
    }
    return path;
    function applyNaturalMotion(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
  }
  function createRealMouse(targetElement) {
    const startX = getRandomNumber() * globalThis.innerWidth;
    const startY = getRandomNumber() * globalThis.innerHeight;
    const rectEnd = targetElement.getBoundingClientRect();
    const endX = rectEnd.x + rectEnd.width * getRandomNumber();
    const endY = rectEnd.y + rectEnd.height * getRandomNumber();
    const area = {
      maxX: globalThis.innerWidth,
      maxY: globalThis.innerHeight,
      minX: 0,
      minY: 0
    };
    const paths = createMousePaths({ startX, startY }, { endX, endY }, rectEnd.width, area);
    mouseMovePaths(paths, targetElement);
  }
  function mouseMovePaths(paths, targetElement) {
    let pathIndex = 1;
    let previousTarget = void 0;
    let redDot = document.querySelector("#redDot");
    if (!redDot) {
      redDot = document.createElement("div");
      redDot.id = "redDot";
      redDot.style.cssText = "position:absolute;width:24px;height:24px;background-color:red;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events: none;z-index:9999;";
      document.body.after(redDot);
    }
    createDynamicKeyframes(redDot, paths);
    const moveStep = () => {
      const path = paths.at(pathIndex);
      if (!path) return;
      const target = document.elementFromPoint(path.x, path.y);
      if (!target) return;
      const previousPath = pathIndex > 0 ? paths[pathIndex - 1] : void 0;
      const movementX = previousPath ? path.x - previousPath.x : MOVEMENT_NONE;
      const movementY = previousPath ? path.y - previousPath.y : MOVEMENT_NONE;
      if (target !== previousTarget) {
        const pointerover = createPointerEvent(
          "pointerover",
          path,
          { movementX: MOVEMENT_NONE, movementY: MOVEMENT_NONE },
          { button: BUTTON_NONE }
        );
        target.dispatchEvent(pointerover);
        previousTarget = target;
      }
      const pointermove = createPointerEvent("pointermove", path, { movementX, movementY }, { button: BUTTON_NONE });
      target.dispatchEvent(pointermove);
      const mousemove = createMouseEvent(path, movementX, movementY);
      target.dispatchEvent(mousemove);
      pathIndex++;
      const nextPath = paths.at(pathIndex);
      if (nextPath) {
        setTimeout(moveStep, nextPath.time);
      } else {
        const click = createPointerEvent("click", path, void 0, { button: BUTTON_PRIMARY, detail: DETAIL_CLICK });
        if (targetElement instanceof HTMLElement) {
          targetElement.focus();
        }
        targetElement.dispatchEvent(click);
        target.dispatchEvent(click);
      }
    };
    setTimeout(() => {
      redDot.style.backgroundColor = "green";
      const animation = redDot.style.animation;
      redDot.style.animation = "none";
      redDot.offsetHeight;
      redDot.style.animation = animation;
    }, WAIT_TIME);
    setTimeout(moveStep, WAIT_TIME);
  }
  function observeNode(observedNode) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
            const checkbox = node instanceof HTMLInputElement && node.tagName === "INPUT" && node.type === "checkbox" ? node : node.querySelector('input[type="checkbox"]');
            if (checkbox) {
              createRealMouse(checkbox);
            }
          }
        }
      }
    });
    observer.observe(observedNode, {
      childList: true,
      subtree: true
    });
  }
  var initMouseSimulation_default = observeNode;

  // src/handlers/window.ts
  function globalOnMessageListener(that_, event) {
    const data = event.data;
    if (data?.type === "screen") {
      screenListener.apply(that_, [event]);
    } else {
      listenerStorage.dispatchGlobalOnMessage(that_, event);
    }
  }
  function screenListener(event) {
    if (event.data?.command === "getScreen" && event.source instanceof Window) {
      const targetIframe = browser_default.findIframeByWindow(event.source);
      if (targetIframe) {
        event.source.postMessage(
          { command: "receiveScreen", rect: targetIframe.getBoundingClientRect(), type: "screen" },
          { targetOrigin: event.origin }
        );
      }
    } else if (event.data?.command === "receiveScreen" && event.data.rect instanceof DOMRect) {
      globallyStorage.setScreenRect(event.data.rect);
    }
  }
  var WindowHandler = {
    initObserverNode() {
      document.addEventListener("DOMContentLoaded", function() {
        initMouseSimulation_default(document.documentElement);
      });
    },
    initOnMessageHandler() {
      if (globalThis.top && globalThis.self !== globalThis.top) {
        globalThis.top.postMessage({ command: "getScreen", type: "screen" }, "*");
      }
      globalThis.addEventListener("message", function(event) {
        globalOnMessageListener(this, event);
      });
    },
    initStorageHandler() {
      const topWindow = globallyStorage.getTopWindow();
      if (topWindow === globalThis.self) {
        globalThis.addEventListener("__cfPatch__addFunctionToStorage", (event) => {
          if (event.detail) {
            const { originalFunction, wrappedFunction } = event.detail;
            originalFunctionStorage.store(wrappedFunction, originalFunction);
          }
        });
      }
    }
  };
  var window_default = WindowHandler;

  // src/patches/function/toString.ts
  var FakeToString = class _FakeToString {
    static OriginalFunction;
    static Type = 2 /* VALUE */;
    static toString(...arguments_) {
      const patch = {
        [FILTER_PATCH_NAME]: () => {
          if (globallyStorage.getTopWindow() === globalThis.self) {
            if (originalFunctionStorage.has(this)) {
              return Reflect.apply(_FakeToString.OriginalFunction, originalFunctionStorage.get(this), arguments_);
            }
            return Reflect.apply(_FakeToString.OriginalFunction, this, arguments_);
          }
          return Reflect.apply(globallyStorage.getToWindowToString(), this, arguments_);
        }
      };
      return patch[FILTER_PATCH_NAME]();
    }
  };
  var toString_default = FakeToString;

  // src/patches/error/error.ts
  var FakeError = class _FakeError {
    static OriginalFunction;
    static Type = 2 /* VALUE */;
    static Error = function(message, options) {
      const error = new _FakeError.OriginalFunction(message, options);
      Object.setPrototypeOf(error, Error.prototype);
      if (typeof error.stack === "string") {
        const lines = error.stack.split("\n");
        error.stack = [
          ...lines.slice(0 /* FIRST_ITEM */, 1 /* SINGLE_ITEM_REMOVAL */),
          ...lines.slice(2 /* TWO_ITEM_REMOVAL */)
        ].join("\n");
      }
      return error;
    };
  };
  var error_default = FakeError;

  // src/strategies/patch/errorPatch.ts
  var ErrorPatch = {
    applyPatch(originalError) {
      const wrappedDescriptor = Object.getOwnPropertyDescriptor(error_default, "Error");
      if (typeof wrappedDescriptor?.value === "function") {
        for (const errorType of errorTypes) {
          const errorConstructor = globalThis[errorType];
          if (typeof errorConstructor === "function") {
            Object.setPrototypeOf(errorConstructor, wrappedDescriptor.value);
            Object.setPrototypeOf(errorConstructor.prototype, wrappedDescriptor.value.prototype);
          }
        }
        for (const property of Object.getOwnPropertyNames(originalError.prototype)) {
          if (property !== "constructor") {
            const descriptor = Object.getOwnPropertyDescriptor(originalError.prototype, property);
            if (descriptor) Object.defineProperty(wrappedDescriptor.value.prototype, property, descriptor);
          }
        }
        for (const property of Object.getOwnPropertyNames(originalError)) {
          if (property !== "prototype") {
            const descriptor = Object.getOwnPropertyDescriptor(originalError, property);
            if (descriptor) Object.defineProperty(wrappedDescriptor.value, property, descriptor);
          }
        }
        originalError.prepareStackTrace = function prepareStackTrace(error, stack) {
          const wrappedPrototype = Object.getPrototypeOf(error);
          Object.setPrototypeOf(error, originalError.prototype);
          if (Object.getPrototypeOf(Object.getPrototypeOf(error)) === originalError.prototype) {
            Object.setPrototypeOf(Object.getPrototypeOf(error), Error.prototype);
          }
          const limit = Math.max(Error.stackTraceLimit, 0);
          originalError.stackTraceLimit = limit;
          const stackArray = error.stack?.split("\n");
          error.stack = stackArray?.slice(0, limit + 1).join("\n");
          stack = stack.slice(0, limit);
          [error, stack] = stackFilterStorage.apply(error, stack);
          if (Error.prepareStackTrace) {
            error.stack = Error.prepareStackTrace(error, stack);
          }
          Object.setPrototypeOf(error, wrappedPrototype);
          return error.stack;
        };
        error_default.OriginalFunction = originalError;
        modifyFunction(globalThis, "Error", wrappedDescriptor, error_default.Type);
      }
    }
  };
  var errorPatch_default = ErrorPatch;

  // src/strategies/build/commonBuild.ts
  function CommonBuild() {
    window_default.initStorageHandler();
    stackFilterStorage.add(CommonFunctionFilter);
    errorPatch_default.applyPatch(globalThis.Error);
    commonPatch_default.applyPatch(toString_default, Function.prototype, "toString");
  }

  // src/strategies/build/workerBuild.ts
  function WorkerBuild(metaData) {
    globallyStorage.setMetaData(metaData);
    CommonBuild();
    stackFilterStorage.add(consoleFilter);
    consolePatch_default.applyPatch(globalThis.console);
    consoleMethods[consoleMethods.indexOf("dirxml")] = "dirXml";
    commonPatch_default.applyPatch(context_default, globalThis.console, "context");
    commonPatch_default.applyPatch(getParameter_default, WebGLRenderingContext.prototype, "getParameter");
    commonPatch_default.applyPatch(getParameter_default, WebGL2RenderingContext.prototype, "getParameter");
    commonPatch_default.applyPatch(getHighEntropyValues_default, globalThis.NavigatorUAData.prototype, "getHighEntropyValues");
  }

  // src/workerPatch.ts
  WorkerBuild(globalThis.metaData);
})();
