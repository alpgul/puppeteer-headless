import { consoleMethods, PatchTypes } from '../../core/constant/global';
import FakeConsole from '../../patches/console/console';
import { modifyFunction } from '../modifyFunction';

const ConsolePatch = {
  applyPatch(console: Console): void {
    for (const name of consoleMethods) {
      const wrappedFunctionString = `{${name}(...args){return Reflect.apply(modifyFunction,this,args);}}`;
      // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, sonarjs/code-eval -- Required to dynamically create function wrapper for console methods
      const wrappedDescriptor: PropertyDescriptor | undefined = new Function(
        'modifyFunction',
        `return Object.getOwnPropertyDescriptor(${wrappedFunctionString}, '${name}')`,
      )(FakeConsole.consoleCommonFunction);
      if (wrappedDescriptor) {
        modifyFunction(console, name, wrappedDescriptor, PatchTypes.VALUE);
      }
    }
  },
};
export default ConsolePatch;
