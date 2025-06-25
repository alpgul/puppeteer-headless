import { FILTER_PATCH_NAME, NOT_FOUND, Removal } from '../core/constant/global';

/**
 * Filters common function entries from error stack traces
 * @param error The error object to filter
 * @param stackObject The call site stack object to filter
 * @returns A tuple containing the filtered error and stack object
 */ export function CommonFunctionFilter(error: Error, stackObject: NodeJS.CallSite[]): [Error, NodeJS.CallSite[]] {
  if (error.stack !== undefined) {
    const arrayStack = error.stack.split('\n');
    const stackIndex = arrayStack.findIndex((item) => item.includes(FILTER_PATCH_NAME));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, Removal.TWO_ITEM_REMOVAL);
      stackObject.splice(stackIndex - 1, Removal.TWO_ITEM_REMOVAL);
      error.stack = arrayStack.join('\n');
    }
  }
  return [error, stackObject];
}
