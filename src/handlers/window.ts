import { globallyStorage } from '../container/globallyStorage';
import { listenerStorage } from '../container/listenerStorage';
import { originalFunctionStorage } from '../container/originalFunctionStorage';
import type { FunctionStorageEvent, OnMessageEvent } from '../core/type/event';
import observeNode from '../simulation/initMouseSimulation';
import Browser from '../utils/browser';
function globalOnMessageListener(that_: Window, event: MessageEvent<OnMessageEvent | undefined>): void {
  const data = event.data;
  if (data?.type === 'screen') {
    screenListener.apply(that_, [event]);
  } else {
    listenerStorage.dispatchGlobalOnMessage(that_, event);
  }
}
function screenListener(event: MessageEvent<OnMessageEvent | undefined>): void {
  if (event.data?.command === 'getScreen' && event.source) {
    const targetIframe = Browser.findIframeByWindow(event.source as Window);
    if (targetIframe) {
      event.source.postMessage(
        { command: 'receiveScreen', rect: targetIframe.getBoundingClientRect(), type: 'screen' },
        { targetOrigin: event.origin },
      );
    }
  } else if (event.data?.command === 'receiveScreen' && event.data.rect instanceof DOMRect) {
    globallyStorage.setScreenRect(event.data.rect);
  }
}
const WindowHandler = {
  initObserverNode(): void {
    globalThis.document.addEventListener('DOMContentLoaded', function () {
      observeNode(globalThis.document.documentElement);
    });
  },
  initOnMessageHandler(): void {
    // eslint-disable-next-line sonarjs/post-message -- This is intentional for patching postMessage
    globalThis.addEventListener('message', function (this: Window, event: MessageEvent<OnMessageEvent>) {
      globalOnMessageListener(this, event);
    });
  },
  initStorageHandler(): void {
    const topWindow = globallyStorage.getTopWindow();
    if (topWindow === globalThis.self) {
      globalThis.addEventListener('__cfPatch__addFunctionToStorage', (event: CustomEventInit<FunctionStorageEvent>) => {
        if (event.detail) {
          const { originalFunction, wrappedFunction } = event.detail;
          originalFunctionStorage.store(wrappedFunction, originalFunction);
        }
      });
    }
  },
};
export default WindowHandler;
