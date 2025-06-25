import { NOT_FOUND, Removal } from '../core/constant/global';

/**
 * Filters mouse simulation related stack traces from error objects
 * @param error The error object to filter
 * @param stackObject The call site stack trace array to filter
 * @returns A tuple containing the filtered error and stack object
 */
export function mouseSimulationFilter(error: Error, stackObject: NodeJS.CallSite[]): [Error, NodeJS.CallSite[]] {
  if (error.stack !== undefined) {
    const arrayStack = error.stack.split('\n');
    const stackIndex = arrayStack.findIndex((item) => item.includes('moveStep'));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, Removal.SINGLE_ITEM_REMOVAL);
      stackObject.splice(stackIndex - 1, Removal.SINGLE_ITEM_REMOVAL);
      error.stack = arrayStack.join('\n');
    }
  }
  return [error, stackObject];
}
