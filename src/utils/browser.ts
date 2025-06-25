import { globallyStorage } from '../container/globallyStorage';

function hasDocument(win: Window): boolean {
  try {
    return Boolean(win.document);
  } catch {
    return false;
  }
}
function traverseParentChain(currentWindow: Window): Window {
  try {
    while (currentWindow.parent !== currentWindow && hasDocument(currentWindow.parent)) {
      currentWindow = currentWindow.parent;
    }
    return currentWindow;
  } catch {
    return currentWindow;
  }
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
  findTopAccessibleWindow(): Window {
    const topWindow = globalThis;
    if (topWindow.top && topWindow.top instanceof Window && hasDocument(topWindow.top)) {
      return topWindow.top;
    }
    return traverseParentChain(topWindow.self);
  },
};
export default Browser;
