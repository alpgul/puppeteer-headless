import { ArrayItem, PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction, wrappedFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the onclick property of HTMLElement
class FakeOnClickEL {
  public static OriginalGetFunction: originalFunction<
    [],
    HTMLElement,
    | (EventListenerOrEventListenerObject & { originalListener: EventListenerOrEventListenerObject | undefined })
    | undefined
  >;
  public static readonly originalSetFunction: originalFunction<
    [EventListenerOrEventListenerObject | undefined],
    HTMLElement,
    void
  >;
  public static readonly Type: PatchTypes = PatchTypes.SET;
  // @ts-expect-error - This is intentional for patching HTMLElement onclick
  public static get onclick(this: HTMLElement): EventListenerOrEventListenerObject | undefined {
    const listener = Reflect.apply(FakeOnClickEL.OriginalGetFunction, this, []);
    if (listener?.originalListener) {
      return listener.originalListener;
    }
    return listener;
  }
  public static set onclick(listener: EventListenerOrEventListenerObject | undefined) {
    if (typeof listener === 'function') {
      const wrappedListener: wrappedFunction<[...unknown[]], HTMLElement, void> & {
        originalListener?: EventListenerOrEventListenerObject;
      } = function (this: HTMLElement, ...arguments_: unknown[]): void {
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
      Reflect.apply(FakeOnClickEL.originalSetFunction, this, [wrappedListener]);
    } else {
      Reflect.apply(FakeOnClickEL.originalSetFunction, this, [listener]);
    }
  }
}
export default FakeOnClickEL as Patch;
