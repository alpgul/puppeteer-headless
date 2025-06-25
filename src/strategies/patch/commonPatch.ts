import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import { modifyFunction } from '../modifyFunction';

const CommonPatch = {
  applyPatch(classPatch: Patch, originalFunctionParent: object, property: string): void {
    const wrappedDescriptor = Object.getOwnPropertyDescriptor(classPatch, property);
    const originalDescriptor = Object.getOwnPropertyDescriptor(originalFunctionParent, property);
    if (wrappedDescriptor && originalDescriptor) {
      switch (classPatch.Type) {
        case PatchTypes.GET: {
          classPatch.OriginalGetFunction = originalDescriptor.get;

          break;
        }
        case PatchTypes.SET: {
          classPatch.OriginalSetFunction = originalDescriptor.set;
          classPatch.OriginalGetFunction = originalDescriptor.get;

          break;
        }
        case PatchTypes.VALUE: {
          classPatch.OriginalFunction = originalDescriptor.value;

          break;
        }
      }
      modifyFunction(originalFunctionParent, property, wrappedDescriptor, classPatch.Type);
    }
  },
};
export default CommonPatch;
