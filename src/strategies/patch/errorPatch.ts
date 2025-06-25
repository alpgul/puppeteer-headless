import { stackFilterStorage } from '../../container/stackFilterStorage';
import { errorTypes } from '../../core/constant/global';
import FakeError from '../../patches/error/error';
import { modifyFunction } from '../modifyFunction';

const ErrorPatch = {
  applyPatch(originalError: ErrorConstructor): void {
    const wrappedDescriptor = Object.getOwnPropertyDescriptor(FakeError, 'Error');
    if (typeof wrappedDescriptor?.value === 'function') {
      for (const errorType of errorTypes) {
        const errorConstructor = globalThis[errorType];
        if (typeof errorConstructor === 'function') {
          Object.setPrototypeOf(errorConstructor, wrappedDescriptor.value);
          Object.setPrototypeOf(errorConstructor.prototype, wrappedDescriptor.value.prototype);
        }
      }
      for (const property of Object.getOwnPropertyNames(originalError.prototype)) {
        if (property !== 'constructor') {
          const descriptor = Object.getOwnPropertyDescriptor(originalError.prototype, property);
          if (descriptor) Object.defineProperty(wrappedDescriptor.value.prototype, property, descriptor);
        }
      }
      for (const property of Object.getOwnPropertyNames(originalError)) {
        if (property !== 'prototype') {
          const descriptor = Object.getOwnPropertyDescriptor(originalError, property);
          if (descriptor) Object.defineProperty(wrappedDescriptor.value, property, descriptor);
        }
      }
      originalError.prepareStackTrace = function prepareStackTrace(error, stack) {
        const wrappedPrototype = Error.prototype;
        Object.defineProperty(Error, 'prototype', {
          value: originalError.prototype,
        });
        Object.setPrototypeOf(error, originalError.prototype);

        if (Object.getPrototypeOf(Object.getPrototypeOf(error)) === originalError.prototype) {
          Object.setPrototypeOf(Object.getPrototypeOf(error), Error.prototype);
        }
        const limit = Math.max(Error.stackTraceLimit, 0);
        originalError.stackTraceLimit = limit;
        const stackArray = error.stack?.split('\n');
        error.stack = stackArray?.slice(0, limit + 1).join('\n');
        stack = stack.slice(0, limit);
        [error, stack] = stackFilterStorage.apply(error, stack);
        if (Error.prepareStackTrace) {
          error.stack = Error.prepareStackTrace(error, stack);
        }
        Object.defineProperty(Error, 'prototype', {
          value: wrappedPrototype,
        });

        Object.setPrototypeOf(error, wrappedPrototype);
        return error.stack;
      };
      FakeError.OriginalFunction = originalError;

      modifyFunction(globalThis, 'Error', wrappedDescriptor, FakeError.Type);
    }
  },
};
export default ErrorPatch;
