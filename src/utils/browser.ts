import { globallyStorage } from '../container/globallyStorage';

function hasDocument(win: Window): boolean {
  try {
    return Boolean(win.document);
  } catch {
    return false;
  }
}
const _self=Object.getOwnPropertyDescriptor(globalThis,'self')?.get ?? Object.getOwnPropertyDescriptor(WorkerGlobalScope.prototype,'self')?.get;
const _opener=Object.getOwnPropertyDescriptor(globalThis,'opener')?.get;
const _top=Object.getOwnPropertyDescriptor(globalThis,'top')?.get;
const _parent=Object.getOwnPropertyDescriptor(globalThis,'parent')?.get;
function self(win:Window|unknown):Window{
  return _self?.call(win);
}
function opener(win:Window|unknown):Window|undefined{
  return _opener?.call(win);
}
function top(win:Window|unknown):Window|undefined{
  return _top?.call(win);
}
function parent(win:Window|unknown):Window|undefined{
  return _parent?.call(win);
}
const Browser = {//opener da dahil edilecek
  /**
   *
   * function findTopWindow(startWindow = window, visited = new WeakSet()) {
    // 1. Önce window.opener kontrolü
    try {
        if (startWindow.opener && !visited.has(startWindow.opener)) {
            visited.add(startWindow.opener);
            return findTopWindow(startWindow.opener, visited);
        }
    } catch (e) {
        console.debug('Opener erişim hatası:', e);
    }

    // 2. window.top kontrolü (same-origin)
    try {
        if (startWindow.top && startWindow.top !== startWindow) {
            // window.top erişilebilir ve opener mevcut mu kontrolü
            try {
                if (startWindow.top.opener && !visited.has(startWindow.top.opener)) {
                    visited.add(startWindow.top.opener);
                    return findTopWindow(startWindow.top.opener, visited);
                }
            } catch (e) {
                console.debug('Top.opener erişim hatası:', e);
            }

            // Eğer opener yoksa direkt window.top'u döndür
            return startWindow.top;
        }
    } catch (e) {
        console.debug('Top erişim hatası:', e);
    }

    // 3. window.parent kontrolü (recursive)
    try {
        if (startWindow.parent && startWindow.parent !== startWindow) {
            return findTopWindow(startWindow.parent, visited);
        }
    } catch (e) {
        console.debug('Parent erişim hatası:', e);
    }

    // 4. Hiçbiri çalışmazsa mevcut window'u döndür
    return startWindow;
}

// Kullanım
const topWindow = findTopWindow();
  */
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
  findTopAccessibleWindow(topWindow?:Window): Window {
    if(!topWindow){
      topWindow=self(globalThis);
    }
    const _self=self(topWindow);
    const _opener=opener(topWindow);
    const _top=top(topWindow);
    const _parent=parent(topWindow);
    if(_opener){
      return Browser.findTopAccessibleWindow(_opener);
    }
    else if(_self===_top){
      return _self;
    }
    else if(_top && hasDocument(_top)){
      return Browser.findTopAccessibleWindow(_top);
    }
    else if(_parent && hasDocument(_parent)){
      return Browser.findTopAccessibleWindow(_parent);
    }
    return _self;
  },
};
export default Browser;
