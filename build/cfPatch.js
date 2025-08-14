(()=>{
const fullPatch=(win)=>{
const globalThis = win ?? window;
const workerPatch = (()=>{
// src/core/constant/global.ts
var NOT_FOUND = -1;
var FILTER_PATCH_NAME = "filterPatch";
var PROCESS_TIMEOUT = 15e3;
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

// src/utils/browser.ts
function hasDocument(win) {
  try {
    return Boolean(win.document);
  } catch {
    return false;
  }
}
var _self = Object.getOwnPropertyDescriptor(globalThis, "self")?.get ?? Object.getOwnPropertyDescriptor(WorkerGlobalScope.prototype, "self")?.get;
var _opener = Object.getOwnPropertyDescriptor(globalThis, "opener")?.get;
var _top = Object.getOwnPropertyDescriptor(globalThis, "top")?.get;
var _parent = Object.getOwnPropertyDescriptor(globalThis, "parent")?.get;
function opener(win) {
  return _opener?.call(win);
}
function parent(win) {
  return _parent?.call(win);
}
function self(win) {
  return _self?.call(win);
}
function top(win) {
  return _top?.call(win);
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
  findTopAccessibleWindow(topWindow) {
    topWindow ||= self(globalThis);
    const _self2 = self(topWindow);
    const _opener2 = opener(topWindow);
    const _top2 = top(topWindow);
    const _parent2 = parent(topWindow);
    if (_opener2) {
      return Browser.findTopAccessibleWindow(_opener2);
    } else if (_self2 === _top2) {
      return _self2;
    } else if (_top2 && hasDocument(_top2)) {
      return Browser.findTopAccessibleWindow(_top2);
    } else if (_parent2 && hasDocument(_parent2)) {
      return Browser.findTopAccessibleWindow(_parent2);
    }
    return _self2;
  }
};
var browser_default = Browser;

// src/utils/sleep.ts
var DEFAULT_SLEEP_TIME = 1e3;
async function sleep(ms = DEFAULT_SLEEP_TIME) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// src/container/globallyStorage.ts
var GloballyStorage = class _GloballyStorage {
  static instance;
  metaData;
  mouseSimBinding;
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
  exposeMouseSim(end) {
    if (!this.mouseSimBinding) return;
    const arguments_ = [end];
    this.mouseSimBinding(
      JSON.stringify({
        args: arguments_,
        isTrivial: !arguments_.some((value) => value instanceof Node),
        name: "mouseSim",
        seq: 0,
        type: "exposedFun"
      })
    );
  }
  getMetaData() {
    return this.metaData;
  }
  getRawScreenRect = () => this.screenRect;
  async getScreenRect() {
    const time = Date.now();
    if (this.screenRect === void 0 && globalThis.top && globalThis.self !== globalThis.top) {
      globalThis.top.postMessage({ command: "getScreen", type: "screen" }, "*");
    }
    while (time + PROCESS_TIMEOUT > Date.now()) {
      if (this.screenRect !== void 0) {
        return this.screenRect;
      }
      await sleep();
    }
    return new DOMRect();
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
  setMouseSimBinding(binding) {
    this.mouseSimBinding = binding;
  }
  setScreenRect(rect) {
    this.screenRect = rect;
  }
};
var globallyStorage = GloballyStorage.getInstance();

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
    if (topWindow === globalThis) {
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

// src/utils/logs.ts
var Logger = class _Logger {
  static instance;
  _error;
  _info;
  _warn;
  DEBUG = false;
  constructor() {
    const console = globalThis.console;
    this.init(console);
  }
  static getInstance() {
    _Logger.instance ??= new _Logger();
    return _Logger.instance;
  }
  init(console) {
    this._info = console.info;
    this._error = console.error;
    this._warn = console.warn;
  }
  debug(message, ...arguments_) {
    if (this.DEBUG) {
      this._info?.(`[DEBUG] ${message}`, ...arguments_);
    }
  }
  info(message, ...arguments_) {
    this._info?.(`[INFO] ${message}`, ...arguments_);
  }
  error(message, ...arguments_) {
    this._error?.(`[ERROR] ${message}`, ...arguments_);
  }
  warn(message, ...arguments_) {
    this._warn?.(`[WARN] ${message}`, ...arguments_);
  }
};
var logger = Logger.getInstance();

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

// src/utils/random.ts
function getRandomNumber() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967295;
}

// src/simulation/initMouseSimulation.ts
async function initFakeMouse(targetElement, iframeScreenRect) {
  const targetRect = targetElement.getBoundingClientRect();
  const targetCord = {
    x: targetRect.x + targetRect.width * getRandomNumber() + iframeScreenRect.x,
    y: targetRect.y + targetRect.height * getRandomNumber() + iframeScreenRect.y
  };
  globallyStorage.exposeMouseSim(targetCord);
}
function observeNode(observedNode) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
          const checkbox = node instanceof HTMLInputElement && node.tagName === "INPUT" && node.type === "checkbox" ? node : node.querySelector('input[type="checkbox"]');
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
  if (event.data?.command === "getScreen" && event.source) {
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
    globalThis.document.addEventListener("DOMContentLoaded", function() {
      initMouseSimulation_default(globalThis.document.documentElement);
    });
  },
  initOnMessageHandler() {
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
        if (globallyStorage.getTopWindow() === globalThis) {
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
  logger.init(globalThis.console);
  window_default.initStorageHandler();
  stackFilterStorage.add(CommonFunctionFilter);
  errorPatch_default.applyPatch(globalThis.Error);
  commonPatch_default.applyPatch(toString_default, globalThis.Function.prototype, "toString");
}

// src/strategies/build/workerBuild.ts
function WorkerBuild(metaData) {
  globallyStorage.setMetaData(metaData);
  CommonBuild();
  stackFilterStorage.add(consoleFilter);
  consolePatch_default.applyPatch(globalThis.console);
  consoleMethods[consoleMethods.indexOf("dirxml")] = "dirXml";
  commonPatch_default.applyPatch(context_default, globalThis.console, "context");
  commonPatch_default.applyPatch(getHighEntropyValues_default, globalThis.NavigatorUAData.prototype, "getHighEntropyValues");
  logger.debug("Worker Build Successful!");
}

// src/workerPatch.ts
WorkerBuild(globalThis.metaData);

});
const cfPatch = (()=>{
// src/core/constant/global.ts
var NOT_FOUND = -1;
var TASKBAR_HEIGHT = 32;
var FILTER_PATCH_NAME = "filterPatch";
var PROCESS_TIMEOUT = 15e3;
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

// src/filters/listenerFilter.ts
function listenerFilter(error, stackObject) {
  if (error.stack !== void 0) {
    const arrayStack = error.stack.split("\n");
    const stackIndex = arrayStack.findIndex((item) => item.includes("wrappedListener"));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, 1 /* SINGLE_ITEM_REMOVAL */);
      stackObject.splice(stackIndex - 1, 1 /* SINGLE_ITEM_REMOVAL */);
      error.stack = arrayStack.join("\n");
    }
  }
  return [error, stackObject];
}

// src/filters/mouseSimulationFilter.ts
function mouseSimulationFilter(error, stackObject) {
  if (error.stack !== void 0) {
    const arrayStack = error.stack.split("\n");
    const stackIndex = arrayStack.findIndex((item) => item.includes("moveStep"));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, 1 /* SINGLE_ITEM_REMOVAL */);
      stackObject.splice(stackIndex - 1, 1 /* SINGLE_ITEM_REMOVAL */);
      error.stack = arrayStack.join("\n");
    }
  }
  return [error, stackObject];
}

// src/filters/onMessageFilter.ts
function onMessageFilter(error, stackObject) {
  if (error.stack !== void 0) {
    const arrayStack = error.stack.split("\n");
    const stackIndex = arrayStack.findIndex((item) => item.includes("dispatchGlobalOnMessage"));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, 3 /* THREE_ITEM_REMOVAL */);
      stackObject.splice(stackIndex - 1, 3 /* THREE_ITEM_REMOVAL */);
      error.stack = arrayStack.join("\n");
    }
  }
  return [error, stackObject];
}

// src/utils/browser.ts
function hasDocument(win) {
  try {
    return Boolean(win.document);
  } catch {
    return false;
  }
}
var _self = Object.getOwnPropertyDescriptor(globalThis, "self")?.get ?? Object.getOwnPropertyDescriptor(WorkerGlobalScope.prototype, "self")?.get;
var _opener = Object.getOwnPropertyDescriptor(globalThis, "opener")?.get;
var _top = Object.getOwnPropertyDescriptor(globalThis, "top")?.get;
var _parent = Object.getOwnPropertyDescriptor(globalThis, "parent")?.get;
function opener(win) {
  return _opener?.call(win);
}
function parent(win) {
  return _parent?.call(win);
}
function self(win) {
  return _self?.call(win);
}
function top(win) {
  return _top?.call(win);
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
  findTopAccessibleWindow(topWindow) {
    topWindow ||= self(globalThis);
    const _self2 = self(topWindow);
    const _opener2 = opener(topWindow);
    const _top2 = top(topWindow);
    const _parent2 = parent(topWindow);
    if (_opener2) {
      return Browser.findTopAccessibleWindow(_opener2);
    } else if (_self2 === _top2) {
      return _self2;
    } else if (_top2 && hasDocument(_top2)) {
      return Browser.findTopAccessibleWindow(_top2);
    } else if (_parent2 && hasDocument(_parent2)) {
      return Browser.findTopAccessibleWindow(_parent2);
    }
    return _self2;
  }
};
var browser_default = Browser;

// src/utils/sleep.ts
var DEFAULT_SLEEP_TIME = 1e3;
async function sleep(ms = DEFAULT_SLEEP_TIME) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// src/container/globallyStorage.ts
var GloballyStorage = class _GloballyStorage {
  static instance;
  metaData;
  mouseSimBinding;
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
  exposeMouseSim(end) {
    if (!this.mouseSimBinding) return;
    const arguments_ = [end];
    this.mouseSimBinding(
      JSON.stringify({
        args: arguments_,
        isTrivial: !arguments_.some((value) => value instanceof Node),
        name: "mouseSim",
        seq: 0,
        type: "exposedFun"
      })
    );
  }
  getMetaData() {
    return this.metaData;
  }
  getRawScreenRect = () => this.screenRect;
  async getScreenRect() {
    const time = Date.now();
    if (this.screenRect === void 0 && globalThis.top && globalThis.self !== globalThis.top) {
      globalThis.top.postMessage({ command: "getScreen", type: "screen" }, "*");
    }
    while (time + PROCESS_TIMEOUT > Date.now()) {
      if (this.screenRect !== void 0) {
        return this.screenRect;
      }
      await sleep();
    }
    return new DOMRect();
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
  setMouseSimBinding(binding) {
    this.mouseSimBinding = binding;
  }
  setScreenRect(rect) {
    this.screenRect = rect;
  }
};
var globallyStorage = GloballyStorage.getInstance();

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

// src/utils/random.ts
function getRandomNumber() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 4294967295;
}

// src/simulation/initMouseSimulation.ts
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
function createAnimation(paths) {
  let greenDot = document.querySelector("#greenDot");
  if (!greenDot) {
    greenDot = document.createElement("div");
    greenDot.id = "greenDot";
    greenDot.style.cssText = "position:absolute;width:24px;height:24px;background-color:green;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events: none;z-index:9999;";
    document.body.after(greenDot);
  }
  createDynamicKeyframes(greenDot, paths);
}
async function initFakeMouse(targetElement, iframeScreenRect) {
  const targetRect = targetElement.getBoundingClientRect();
  const targetCord = {
    x: targetRect.x + targetRect.width * getRandomNumber() + iframeScreenRect.x,
    y: targetRect.y + targetRect.height * getRandomNumber() + iframeScreenRect.y
  };
  globallyStorage.exposeMouseSim(targetCord);
}
function observeNode(observedNode) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
          const checkbox = node instanceof HTMLInputElement && node.tagName === "INPUT" && node.type === "checkbox" ? node : node.querySelector('input[type="checkbox"]');
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
  if (event.data?.command === "getScreen" && event.source) {
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
    globalThis.document.addEventListener("DOMContentLoaded", function() {
      initMouseSimulation_default(globalThis.document.documentElement);
    });
  },
  initOnMessageHandler() {
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
    if (topWindow === globalThis) {
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

// src/patches/DocumentPictureInPicture/requestWindow.ts
var FakeRequestWindow = class _FakeRequestWindow {
  static OriginalFunction;
  static Type = 2 /* VALUE */;
  static requestWindow(...args) {
    return _FakeRequestWindow.OriginalFunction.apply(this, args).then((pipWindow) => {
      if (pipWindow) {
        fullPatch.apply(pipWindow, [pipWindow]);
        return pipWindow;
      }
    });
  }
};
var requestWindow_default = FakeRequestWindow;

// src/patches/eventTarget/addEventListener.ts
var AddEventListener = class _AddEventListener {
  static OriginalFunction;
  static Type = 2 /* VALUE */;
  static addEventListener(type, callback, ...options) {
    if (typeof callback === "function" && type === "message") {
      listenerStorage.onMessageAdd(callback);
      return;
    }
    Reflect.apply(_AddEventListener.OriginalFunction, this, [type, callback, ...options]);
  }
};
var addEventListener_default = AddEventListener;

// src/patches/eventTarget/removeEventListener.ts
var RemoveEventListener = class _RemoveEventListener {
  static OriginalFunction;
  static Type = 2 /* VALUE */;
  static removeEventListener(type, callback, ...options) {
    if (typeof callback === "function" && type === "message") {
      listenerStorage.onMessageRemove(callback);
      return;
    }
    Reflect.apply(_RemoveEventListener.OriginalFunction, this, [type, callback, ...options]);
  }
};
var removeEventListener_default = RemoveEventListener;

// src/patches/HTMLElement/attachShadow.ts
var FakeAttachShadow = class _FakeAttachShadow {
  static OriginalFunction;
  static Type = 2 /* VALUE */;
  static attachShadow(options) {
    const shadow = Reflect.apply(_FakeAttachShadow.OriginalFunction, this, [options]);
    initMouseSimulation_default(shadow);
    globallyStorage.addShadowRoot(shadow);
    return shadow;
  }
};
var attachShadow_default = FakeAttachShadow;

// src/patches/MouseEvent/screenX.ts
var ScreenX = class _ScreenX {
  static OriginalGetFunction;
  static Type = 0 /* GET */;
  // @ts-expect-error - This is intentional for patching MouseEvent screenX
  static get screenX() {
    const realScreenX = Reflect.apply(_ScreenX.OriginalGetFunction, this, []);
    const clientX = this.clientX;
    const screenRect = globallyStorage.getRawScreenRect();
    if (typeof realScreenX === "number" && screenRect && realScreenX - clientX < screenRect.x) {
      return clientX + screenRect.x;
    }
    return realScreenX;
  }
};
var screenX_default = ScreenX;

// src/patches/MouseEvent/screenY.ts
var ScreenY = class _ScreenY {
  static OriginalGetFunction;
  static Type = 0 /* GET */;
  // @ts-expect-error - This is intentional for patching MouseEvent screenY
  static get screenY() {
    const realScreenY = Reflect.apply(_ScreenY.OriginalGetFunction, this, []);
    const clientY = this.clientY;
    const screenRect = globallyStorage.getRawScreenRect();
    if (typeof realScreenY === "number" && screenRect && realScreenY - clientY < screenRect.y) {
      return clientY + screenRect.y;
    }
    return realScreenY;
  }
};
var screenY_default = ScreenY;

// src/patches/screen/availHeight.ts
var FakeAvailHeight = class _FakeAvailHeight {
  static OriginalGetFunction;
  static Type = 0 /* GET */;
  // @ts-expect-error - This is intentional for patching Screen availHeight
  static get availHeight() {
    const returnValue = Reflect.apply(_FakeAvailHeight.OriginalGetFunction, this, []);
    return returnValue ? returnValue - TASKBAR_HEIGHT : returnValue;
  }
};
var availHeight_default = FakeAvailHeight;

// src/patches/screenOrientation/type.ts
var FakeType = class {
  static OriginalGetFunction;
  static Type = 0 /* GET */;
  // eslint-disable-next-line @typescript-eslint/class-literal-property-style -- This is intentional for patching ScreenOrientation type
  static get type() {
    return "landscape-primary";
  }
};
var type_default = FakeType;

// src/utils/logs.ts
var Logger = class _Logger {
  static instance;
  _error;
  _info;
  _warn;
  DEBUG = false;
  constructor() {
    const console = globalThis.console;
    this.init(console);
  }
  static getInstance() {
    _Logger.instance ??= new _Logger();
    return _Logger.instance;
  }
  init(console) {
    this._info = console.info;
    this._error = console.error;
    this._warn = console.warn;
  }
  debug(message, ...arguments_) {
    if (this.DEBUG) {
      this._info?.(`[DEBUG] ${message}`, ...arguments_);
    }
  }
  info(message, ...arguments_) {
    this._info?.(`[INFO] ${message}`, ...arguments_);
  }
  error(message, ...arguments_) {
    this._error?.(`[ERROR] ${message}`, ...arguments_);
  }
  warn(message, ...arguments_) {
    this._warn?.(`[WARN] ${message}`, ...arguments_);
  }
};
var logger = Logger.getInstance();

// src/services/registerGlobalStorage.ts
function registerMouseSim() {
  if (globalThis.puppeteer_mouseSim) {
    globallyStorage.setMouseSimBinding(globalThis.puppeteer_mouseSim);
    delete globalThis.puppeteer_mouseSim;
    delete globalThis.mouseSim;
  }
  if (globalThis.top === globalThis.self)
    document.addEventListener("mouseSim", (event) => {
      try {
        if (event.detail) createAnimation(JSON.parse(event.detail));
      } catch (error) {
        logger.error("Error in mouseSim event:", error);
      }
    });
}

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

// src/utils/patch.ts
function createUrlWithPatchedWorker(blobUrl) {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", blobUrl, false);
    xhr.send();
    const code = xhr.responseText;
    const newCode = `(()=>{
const workerPatch=${workerPatch.toString()}
workerPatch();
})();
` + code;
    const blob = new Blob([newCode], { type: "text/javascript" });
    const newUrl = URL.createObjectURL(blob);
    return newUrl;
  } catch {
    return blobUrl;
  }
}

// src/Worker/sharedWorker.ts
var FakeSharedWorker = {
  Type: 2 /* VALUE */,
  SharedWorker: function(url, ...options) {
    const SharedWorkerCtor = FakeSharedWorker.OriginalFunction;
    if (url.toString().startsWith("blob:")) {
      url = createUrlWithPatchedWorker(url);
    }
    if (!new.target) {
      return Reflect.apply(SharedWorkerCtor, this, [url, ...options]);
    }
    return new SharedWorkerCtor(url, options);
  }
};
var sharedWorker_default = FakeSharedWorker;

// src/strategies/patch/sharedWorkerPatch.ts
var SharedWorkerPatch = {
  applyPatch() {
    const originalSharedWorker = globalThis.SharedWorker;
    const wrappedDescriptor = Object.getOwnPropertyDescriptor(sharedWorker_default, "SharedWorker");
    if (typeof wrappedDescriptor?.value === "function" && originalSharedWorker) {
      const originalSharedWorkerDescriptors = Object.getOwnPropertyDescriptors(originalSharedWorker.prototype);
      const constructorDescriptor = Object.getOwnPropertyDescriptor(wrappedDescriptor.value.prototype, "constructor");
      if (constructorDescriptor) {
        Object.defineProperties(originalSharedWorker.prototype, {
          ...originalSharedWorkerDescriptors,
          constructor: constructorDescriptor
        });
      }
      Object.setPrototypeOf(wrappedDescriptor.value, Object.getPrototypeOf(originalSharedWorker));
      Object.setPrototypeOf(wrappedDescriptor.value.prototype, Object.getPrototypeOf(originalSharedWorker.prototype));
      sharedWorker_default.OriginalFunction = originalSharedWorker;
      modifyFunction(globalThis, "SharedWorker", wrappedDescriptor, sharedWorker_default.Type);
    }
  }
};
var sharedWorkerPatch_default = SharedWorkerPatch;

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

// src/patches/function/toString.ts
var FakeToString = class _FakeToString {
  static OriginalFunction;
  static Type = 2 /* VALUE */;
  static toString(...arguments_) {
    const patch = {
      [FILTER_PATCH_NAME]: () => {
        if (globallyStorage.getTopWindow() === globalThis) {
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
  logger.init(globalThis.console);
  window_default.initStorageHandler();
  stackFilterStorage.add(CommonFunctionFilter);
  errorPatch_default.applyPatch(globalThis.Error);
  commonPatch_default.applyPatch(toString_default, globalThis.Function.prototype, "toString");
}

// src/strategies/build/cfBuild.ts
function cfBuild() {
  CommonBuild();
  window_default.initOnMessageHandler();
  stackFilterStorage.add(consoleFilter);
  stackFilterStorage.add(listenerFilter);
  stackFilterStorage.add(onMessageFilter);
  stackFilterStorage.add(mouseSimulationFilter);
  consolePatch_default.applyPatch(globalThis.console);
  consoleMethods[consoleMethods.indexOf("dirxml")] = "dirXml";
  commonPatch_default.applyPatch(context_default, globalThis.console, "context");
  commonPatch_default.applyPatch(availHeight_default, globalThis.Screen.prototype, "availHeight");
  commonPatch_default.applyPatch(screenX_default, globalThis.MouseEvent.prototype, "screenX");
  commonPatch_default.applyPatch(screenY_default, globalThis.MouseEvent.prototype, "screenY");
  commonPatch_default.applyPatch(type_default, globalThis.ScreenOrientation.prototype, "type");
  commonPatch_default.applyPatch(addEventListener_default, globalThis.EventTarget.prototype, "addEventListener");
  commonPatch_default.applyPatch(removeEventListener_default, globalThis.EventTarget.prototype, "removeEventListener");
  commonPatch_default.applyPatch(attachShadow_default, globalThis.Element.prototype, "attachShadow");
  if (typeof globalThis.DocumentPictureInPicture !== "undefined") {
    commonPatch_default.applyPatch(requestWindow_default, globalThis.DocumentPictureInPicture.prototype, "requestWindow");
  }
  sharedWorkerPatch_default.applyPatch();
  window_default.initObserverNode();
  registerMouseSim();
  logger.debug("CF Build Successful!");
}

// src/cfPatch.ts
cfBuild();

});
cfPatch();
};
fullPatch();
})();
