import { NOT_FOUND, Removal } from '../core/constant/global';

/**
 * Filters out wrappedListener entries from error stack traces
 * @param error The error object containing the stack trace
 * @param stackObject Array of call sites from the stack trace
 * @returns Tuple containing the filtered error and stack object
 */
export function listenerFilter(error: Error, stackObject: NodeJS.CallSite[]): [Error, NodeJS.CallSite[]] {
  if (error.stack !== undefined) {
    const arrayStack = error.stack.split('\n');
    const stackIndex = arrayStack.findIndex((item) => item.includes('wrappedListener'));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, Removal.SINGLE_ITEM_REMOVAL);
      stackObject.splice(stackIndex - 1, Removal.SINGLE_ITEM_REMOVAL);
      error.stack = arrayStack.join('\n');
    }
  }
  return [error, stackObject];
}
