(()=>{
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
workerPatch();
})();
