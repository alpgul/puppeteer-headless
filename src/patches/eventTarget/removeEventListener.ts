import { listenerStorage } from '../../container/listenerStorage';
import { BIGGER_THEN_ONE, PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class --- This class patches the removeEventListener function
class RemoveEventListener {
  public static OriginalFunction: (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ) => void;

  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static patch(): {
    originalFunction: typeof RemoveEventListener.OriginalFunction;
    wrappedFunction: typeof RemoveEventListener.removeEventListener;
  } {
    Object.defineProperty(EventTarget.prototype, 'removeEventListener', {
      configurable: true,
      value: RemoveEventListener.removeEventListener,
      writable: true,
    });
    return {
      originalFunction: RemoveEventListener.OriginalFunction,
      wrappedFunction: RemoveEventListener.removeEventListener,
    };
  }
  public static removeEventListener(
    this: HTMLElement | Window,
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    ...options: [boolean | EventListenerOptions]
  ): void {
    if (typeof callback === 'function') {
      if (type === 'message') {
        listenerStorage.onMessageRemove(callback);
        return;
      }
      const data = listenerStorage.getListenerMap(callback);
      if (data) {
        if (data.counter > BIGGER_THEN_ONE) {
          // Decrement the counter if more than one reference exists
          data.counter--;
          callback = data.wrappedListener;
        } else {
          // Remove the listener when counter reaches zero
          callback = data.wrappedListener;
          listenerStorage.deleteListenerMap(callback);
        }
      }
    }

    Reflect.apply(RemoveEventListener.OriginalFunction, this, [type, callback, ...options]);
  }
}
export default RemoveEventListener as Patch;
