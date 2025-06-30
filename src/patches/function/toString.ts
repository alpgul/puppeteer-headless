import { globallyStorage } from '../../container/globallyStorage';
import { originalFunctionStorage } from '../../container/originalFunctionStorage';
import { FILTER_PATCH_NAME, PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction, wrappedFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the toString method of functions.
class FakeToString {
  public static OriginalFunction: originalFunction<[...unknown[]], unknown, string>;
  public static readonly Type: PatchTypes = PatchTypes.VALUE;

  public static toString(this: wrappedFunction<[...unknown[]], unknown, string>, ...arguments_: unknown[]): string {
    const patch = {
      [FILTER_PATCH_NAME]: (): string => {
        if (globallyStorage.getTopWindow() === globalThis as unknown as Window) {
          if (originalFunctionStorage.has(this)) {
            return Reflect.apply(FakeToString.OriginalFunction, originalFunctionStorage.get(this), arguments_);
          }
          return Reflect.apply(FakeToString.OriginalFunction, this, arguments_);
        }
        return Reflect.apply(globallyStorage.getToWindowToString(), this, arguments_);
      },
    };
    // eslint-disable-next-line security/detect-object-injection -- FILTER_PATCH_NAME is a constant and safe to use
    return patch[FILTER_PATCH_NAME]();
  }
}
export default FakeToString as Patch;
