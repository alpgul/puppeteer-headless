import { PatchTypes } from '../core/constant/global';
import { registerService } from '../services/registerFunction';

import type { originalFunction } from './../core/type/function';
/**
 * Patches a function on an object with the given property descriptor.
 * @param originalFunctionParent - The parent object containing the function to patch.
 * @param property - The property name of the function to patch.
 * @param wrappedDescriptor - The property descriptor containing the new function or getter/setter.
 * @param type - Specifies how to patch (GET, SET, or VALUE).
 */ export function modifyFunction(
  originalFunctionParent: object,
  property: string,
  wrappedDescriptor: PropertyDescriptor,
  type: PatchTypes,
): void {
  const originalDescriptor = Object.getOwnPropertyDescriptor(originalFunctionParent, property);
  if (originalDescriptor) {
    switch (type) {
      case PatchTypes.GET: {
        if (typeof originalDescriptor.get === 'function' && typeof wrappedDescriptor.get === 'function') {
          Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
          registerService.registerFunction({
            originalFunction: originalDescriptor.get as originalFunction<[unknown]>,
            wrappedFunction: wrappedDescriptor.get as originalFunction<[unknown]>,
          });
        }
        break;
      }
      case PatchTypes.SET: {
        if (
          typeof originalDescriptor.get === 'function' &&
          typeof wrappedDescriptor.get === 'function' &&
          typeof originalDescriptor.set === 'function' &&
          typeof wrappedDescriptor.set === 'function'
        ) {
          Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
          registerService.registerFunction({
            originalFunction: originalDescriptor.get,
            wrappedFunction: wrappedDescriptor.get,
          });
          registerService.registerFunction({
            originalFunction: originalDescriptor.set,
            wrappedFunction: wrappedDescriptor.set,
          });
        }
        break;
      }
      case PatchTypes.VALUE: {
        if (typeof originalDescriptor.value === 'function' && typeof wrappedDescriptor.value === 'function') {
          Object.defineProperty(originalFunctionParent, property, wrappedDescriptor);
          registerService.registerFunction({
            originalFunction: originalDescriptor.value,
            wrappedFunction: wrappedDescriptor.value,
          });
        }
        break;
      }
    }
  }
}
