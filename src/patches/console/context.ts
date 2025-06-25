import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';
import ConsolePatch from '../../strategies/patch/consolePatch';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the console.context function
class FakeContext {
  public static OriginalFunction: originalFunction<[...unknown[]], Console, Console | undefined>;
  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static context(this: Console, ...arguments_: unknown[]): Console | undefined {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- code checks originalFunction before usage
    const consoleContext = Reflect.apply(FakeContext.OriginalFunction!, this, arguments_);
    if (!(consoleContext instanceof Object)) {
      return;
    }
    const typedContext = consoleContext as Console;
    ConsolePatch.applyPatch(typedContext);
    return typedContext;
  }
}
export default FakeContext as Patch;
