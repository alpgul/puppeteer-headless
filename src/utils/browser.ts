import { globallyStorage } from '../container/globallyStorage';

function hasDocument(win: Window): boolean {
  try {
    return Boolean(win.document);
  } catch {
    return false;
  }
}
const _self =
  Object.getOwnPropertyDescriptor(globalThis, 'self')?.get ??
  Object.getOwnPropertyDescriptor(WorkerGlobalScope.prototype, 'self')?.get;
const _opener = Object.getOwnPropertyDescriptor(globalThis, 'opener')?.get;
const _top = Object.getOwnPropertyDescriptor(globalThis, 'top')?.get;
const _parent = Object.getOwnPropertyDescriptor(globalThis, 'parent')?.get;
function opener(win: unknown | Window): Window | undefined {
  return _opener?.call(win);
}
function parent(win: unknown | Window): Window | undefined {
  return _parent?.call(win);
}
function self(win: unknown | Window): Window {
  return _self?.call(win);
}
function top(win: unknown | Window): Window | undefined {
  return _top?.call(win);
}
const Browser = {
  findIframeByWindow(findIframe: Window): HTMLIFrameElement | undefined {
    for (const shadowRoot of globallyStorage.getShadowRootSet()) {
      const iframes = shadowRoot.querySelectorAll('iframe');
      for (const iframe of iframes) {
        if (iframe.contentWindow === findIframe) {
          return iframe;
        }
      }
    }
    const iframes = globalThis.document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      if (iframe.contentWindow === findIframe) {
        return iframe;
      }
    }
  },
  findTopAccessibleWindow(topWindow?: Window): Window {
    topWindow ||= self(globalThis);
    const _self = self(topWindow);
    const _opener = opener(topWindow);
    const _top = top(topWindow);
    const _parent = parent(topWindow);
    if (_opener) {
      return Browser.findTopAccessibleWindow(_opener);
    } else if (_self === _top) {
      return _self;
    } else if (_top && hasDocument(_top)) {
      return Browser.findTopAccessibleWindow(_top);
    } else if (_parent && hasDocument(_parent)) {
      return Browser.findTopAccessibleWindow(_parent);
    }
    return _self;
  },
};
export default Browser;
