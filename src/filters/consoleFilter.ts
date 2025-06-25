import { NOT_FOUND, Removal } from '../core/constant/global';
/**
 * Filters console-related entries from stack traces
 * @param error The Error object containing the stack trace to filter
 * @param stackObject Array of CallSite objects representing the stack trace
 * @returns A tuple containing the filtered stack trace string and CallSite array
 */
export function consoleFilter(error: Error, stackObject: NodeJS.CallSite[]): [Error, NodeJS.CallSite[]] {
  if (error.stack !== undefined) {
    const arrayStack = error.stack.split('\n');
    const stackIndex = arrayStack.findIndex((item) => item.includes('consoleCommonFunction'));
    if (stackIndex > NOT_FOUND) {
      arrayStack.splice(stackIndex, Removal.SINGLE_ITEM_REMOVAL);
      if (stackIndex < arrayStack.length - 1) {
        const line = arrayStack.at(stackIndex);
        if (typeof line === 'string') {
          arrayStack.splice(
            stackIndex,
            1,
            line.replaceAll(/eval at applyPatch[^)]+\), /g, '').replaceAll(/(<anonymous>):\d+:\d+/g, '$1'),
          );
        }
      }
      stackObject.splice(stackIndex - 1, Removal.SINGLE_ITEM_REMOVAL);
      /*
       * stackObj[stackIndex-1] bu CallSite objesi orjinal console log,error,info vs ile değiştirilecek
       *
       */
      error.stack = arrayStack.join('\n');
    }
  }
  return [error, stackObject];
}
