import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the type property of ScreenOrientation
class FakeType {
  public static OriginalGetFunction: originalFunction<[], ScreenOrientation, string>;
  public static readonly Type: PatchTypes = PatchTypes.GET;
  // eslint-disable-next-line @typescript-eslint/class-literal-property-style -- This is intentional for patching ScreenOrientation type
  public static get type(): string {
    return 'landscape-primary';
  }
}
export default FakeType as Patch;
