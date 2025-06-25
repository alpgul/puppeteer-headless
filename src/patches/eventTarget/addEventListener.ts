import { listenerStorage } from '../../container/listenerStorage';
import { ArrayItem, PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the addEventListener function
class AddEventListener {
  public static OriginalFunction: originalFunction<
    [string, EventListenerOrEventListenerObject | null, AddEventListenerOptions | boolean],
    HTMLElement | Window,
    void
  >;
  public static readonly Type: PatchTypes = PatchTypes.VALUE;

  public static addEventListener(
    this: HTMLElement | Window,
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    ...options: [AddEventListenerOptions | boolean]
  ): void {
    let wrappedListener: EventListenerOrEventListenerObject | undefined = undefined;
    if (typeof callback === 'function') {
      if (this === globalThis && type === 'message') {
        listenerStorage.onMessageAdd(callback);
        return;
      }
      const data = listenerStorage.getListenerMap(callback);
      if (data) {
        wrappedListener = data.wrappedListener;
        data.counter++;
      } else {
        wrappedListener = function (this: HTMLElement | Window, ...arguments_: unknown[]) {
          const event = arguments_[ArrayItem.FIRST_ITEM];
          if (
            event instanceof Event &&
            (event.type === 'click' ||
              event.type === 'pointermove' ||
              event.type === 'pointerover' ||
              event.type === 'mousemove')
          ) {
            arguments_[ArrayItem.FIRST_ITEM] = new Proxy(event, {
              get(target, property) {
                if (property === 'isTrusted' && Reflect.get(target, '_isTrusted') === true) {
                  return true;
                }
                if (property === 'sourceCapabilities') {
                  const sourceCapabilities = { fireTouchEvents: true };
                  if (typeof globalThis.InputDeviceCapabilities === 'function') {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- This is a polyfill
                    Object.setPrototypeOf(sourceCapabilities, globalThis.InputDeviceCapabilities.prototype);
                  }
                  return sourceCapabilities;
                }
                return Reflect.get(target, property) as unknown;
              },
            });
          }
          Reflect.apply(callback, this, arguments_);
        };
        listenerStorage.setListenerMap(callback, wrappedListener);
      }
    }
    Reflect.apply(AddEventListener.OriginalFunction, this, [type, wrappedListener ?? callback, ...options]);
  }
}
export default AddEventListener as Patch;
