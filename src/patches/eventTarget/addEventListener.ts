import { listenerStorage } from '../../container/listenerStorage';
import { PatchTypes } from '../../core/constant/global';
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
    if (typeof callback === 'function' && type === 'message') {
      listenerStorage.onMessageAdd(callback);
      return;
    }
    Reflect.apply(AddEventListener.OriginalFunction, this, [type, callback, ...options]);
  }
}
export default AddEventListener as Patch;
