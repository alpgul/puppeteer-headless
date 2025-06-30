import { PatchTypes } from "../../core/constant/global";
import { Patch } from "../../core/interface/global";
import { originalFunction } from "../../core/type/function";

class FakeRequestWindow {
   public static OriginalFunction: originalFunction<
      [...unknown[]],
      PictureInPictureEvent,
      Promise<Window>
    >;
    public static readonly Type: PatchTypes = PatchTypes.VALUE;
    public static requestWindow(
      this: PictureInPictureEvent,
      ...args: [...unknown[]]
    ): Promise<Window| undefined>  {
      return FakeRequestWindow.OriginalFunction.apply(this, args).then((pipWindow)=>{
        if (pipWindow) {
          fullPatch.apply(pipWindow,[pipWindow]);
          return pipWindow;
        }
      });
    }

}
export default FakeRequestWindow as Patch;
