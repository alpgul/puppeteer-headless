import { globallyStorage } from '../../container/globallyStorage';
import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { AttachShadowConstructor } from '../../core/type/attachShadow';
import observeNode from '../../simulation/initMouseSimulation';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the attachShadow function
class FakeAttachShadow {
  public static OriginalFunction: AttachShadowConstructor;

  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static attachShadow(this: HTMLElement, options: ShadowRootInit): ShadowRoot {
    const shadow = Reflect.apply(FakeAttachShadow.OriginalFunction, this, [options]);
    observeNode(shadow);
    globallyStorage.addShadowRoot(shadow);
    return shadow;
  }
}
export default FakeAttachShadow as Patch;
