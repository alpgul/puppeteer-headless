import { globallyStorage } from '../../container/globallyStorage';
import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the screenX property of MouseEvent
class ScreenX {
  public static OriginalGetFunction: originalFunction<[], MouseEvent, number>;
  public static readonly Type: PatchTypes = PatchTypes.GET;
  // @ts-expect-error - This is intentional for patching MouseEvent screenX
  public static get screenX(this: MouseEvent): number | undefined {
    const realScreenX = Reflect.apply(ScreenX.OriginalGetFunction, this, []);
    const clientX = this.clientX;
    const screenRect = globallyStorage.getRawScreenRect();
    if (typeof realScreenX === 'number' && screenRect && realScreenX - clientX < screenRect.x) {
      return clientX + screenRect.x;
    }
    return realScreenX;
  }
}
export default ScreenX as Patch;
