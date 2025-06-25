import { ArrayItem, PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction, wrappedFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the onclick property of Window
class FakeOnClick {
  public static OriginalGetFunction: originalFunction<
    [],
    Window,
    | (EventListenerOrEventListenerObject & { originalListener: EventListenerOrEventListenerObject | undefined })
    | undefined
  >;
  public static OriginalSetFunction: originalFunction<[EventListenerOrEventListenerObject | undefined], Window, void>;
  public static readonly Type: PatchTypes = PatchTypes.SET;
  // @ts-expect-error - This is intentional for patching Window onclick
  public static get onclick(this: Window): EventListenerOrEventListenerObject | undefined {
    const listener = Reflect.apply(FakeOnClick.OriginalGetFunction, this, []);
    if (listener?.originalListener) {
      return listener.originalListener;
    }
    return listener;
  }
  public static set onclick(listener: EventListenerOrEventListenerObject | undefined) {
    if (typeof listener === 'function') {
      const wrappedListener: wrappedFunction<[...unknown[]], Window, void> & {
        originalListener?: EventListenerOrEventListenerObject;
      } = function (this: Window, ...arguments_: unknown[]): void {
        const event = arguments_[ArrayItem.FIRST_ITEM];
        if (event instanceof Event) {
          arguments_[ArrayItem.FIRST_ITEM] = new Proxy(event, {
            get(target, property) {
              if (property === 'isTrusted' && Reflect.get(target, '_isTrusted') === true) {
                return true;
              }
              if (property === 'sourceCapabilities' && Reflect.has(globalThis, 'InputDeviceCapabilities')) {
                const sourceCapabilities = { fireTouchEvents: true };
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- This is intentional for patching sourceCapabilities
                Object.setPrototypeOf(sourceCapabilities, globalThis.InputDeviceCapabilities.prototype);
                return sourceCapabilities;
              }
              return Reflect.get(target, property) as unknown;
            },
          });
        }
        Reflect.apply(listener, this, arguments_);
      };
      wrappedListener.originalListener = listener;
      Reflect.apply(FakeOnClick.OriginalSetFunction, this, [wrappedListener]);
    } else {
      Reflect.apply(FakeOnClick.OriginalSetFunction, this, [listener]);
    }
  }
}
export default FakeOnClick as Patch;
