import { PatchTypes, TASKBAR_HEIGHT } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the availHeight property of Screen
class FakeAvailHeight {
  public static OriginalGetFunction: originalFunction<[], Screen, number>;
  public static readonly Type: PatchTypes = PatchTypes.GET;
  // @ts-expect-error - This is intentional for patching Screen availHeight
  public static get availHeight(this: Screen): number | undefined {
    const returnValue = Reflect.apply(FakeAvailHeight.OriginalGetFunction, this, []);
    return returnValue ? returnValue - TASKBAR_HEIGHT : returnValue;
  }
}
export default FakeAvailHeight as Patch;
