import type { FakeErrorConstructor } from '../../core/interface/error';

import { ArrayItem, PatchTypes, Removal } from './../../core/constant/global';
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the Error class.
class FakeError {
  public static OriginalFunction: ErrorConstructor;
  public static readonly Type = PatchTypes.VALUE;
  public static readonly Error: FakeErrorConstructor = function (message?: string, options?: ErrorOptions): Error {
    const error = new FakeError.OriginalFunction(message, options);
    Object.setPrototypeOf(error, Error.prototype);
    if (typeof error.stack === 'string') {
      const lines = error.stack.split('\n');
      error.stack = [
        ...lines.slice(ArrayItem.FIRST_ITEM, Removal.SINGLE_ITEM_REMOVAL),
        ...lines.slice(Removal.TWO_ITEM_REMOVAL),
      ].join('\n');
    }
    return error;
  };
}

export default FakeError;
