import { globallyStorage } from '../../container/globallyStorage';
import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the screenY property of MouseEvent
class ScreenY {
  public static OriginalGetFunction: originalFunction<[], MouseEvent, number>;
  public static readonly Type: PatchTypes = PatchTypes.GET;
  // @ts-expect-error - This is intentional for patching MouseEvent screenY
  public static get screenY(this: MouseEvent): number | undefined {
    const realScreenY = Reflect.apply(ScreenY.OriginalGetFunction, this, []);
    const clientY = this.clientY;
    const screenRect = globallyStorage.getRawScreenRect();
    if (typeof realScreenY === 'number' && screenRect && realScreenY - clientY < screenRect.y) {
      return clientY + screenRect.y;
    }
    return realScreenY;
  }
}
export default ScreenY as Patch;
