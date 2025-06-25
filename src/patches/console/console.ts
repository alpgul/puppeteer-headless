import { PatchTypes } from '../../core/constant/global';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the console methods.
class FakeConsole {
  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static readonly consoleCommonFunction: (...arguments_: unknown[]) => void = (...arguments_) => {
    for (const argument of arguments_) {
      if (
        argument !== null &&
        argument !== undefined &&
        (typeof argument === 'object' || typeof argument === 'function') &&
        Reflect.has(argument, 'toString')
      ) {
        (argument as { toString: () => string }).toString();
      }
    }
  };
}
export default FakeConsole;
