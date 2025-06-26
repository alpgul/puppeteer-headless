import { PatchTypes } from '../../core/constant/global';
import { Patch } from '../../core/interface/global';
import { originalFunction } from '../../core/type/function';

class Fake2GetParameter {
  public static OriginalFunction: originalFunction<[unknown], CanvasRenderingContext2D, unknown>;
  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static getParameter(this: CanvasRenderingContext2D, pname: unknown): unknown {
    const returnValue = Reflect.apply(Fake2GetParameter.OriginalFunction, this, [pname]);
    if (typeof returnValue === 'string') {
      if (returnValue === 'Google Inc. (Google)') return 'Google Inc. (NVIDIA Corporation)';
      if (returnValue.includes('ANGLE') && returnValue.includes('SwiftShader'))
        return 'ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 3060/PCIe/SSE2, OpenGL 4.6.0 NVIDIA 537.13)';
    }
    return returnValue;
  }
}
export default Fake2GetParameter as Patch;
