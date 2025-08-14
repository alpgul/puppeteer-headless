import { listenerStorage } from '../../container/listenerStorage';
import { PatchTypes } from '../../core/constant/global';
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
  public static removeEventListener(
    this: HTMLElement | Window,
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    ...options: [boolean | EventListenerOptions]
  ): void {
    if (typeof callback === 'function' && type === 'message') {
      listenerStorage.onMessageRemove(callback);
      return;
    }
    Reflect.apply(RemoveEventListener.OriginalFunction, this, [type, callback, ...options]);
  }
}
export default RemoveEventListener as Patch;
