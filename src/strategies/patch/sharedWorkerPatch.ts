import FakeSharedWorker from '../../Worker/sharedWorker';
import { modifyFunction } from '../modifyFunction';

const SharedWorkerPatch = {
  applyPatch(): void {
    const originalSharedWorker = globalThis.SharedWorker;
    const wrappedDescriptor = Object.getOwnPropertyDescriptor(FakeSharedWorker, 'SharedWorker');
    if (typeof wrappedDescriptor?.value === 'function' && originalSharedWorker) {
      const originalSharedWorkerDescriptors = Object.getOwnPropertyDescriptors(originalSharedWorker.prototype);
      const constructorDescriptor = Object.getOwnPropertyDescriptor(wrappedDescriptor.value.prototype, 'constructor');
      if (constructorDescriptor) {
        Object.defineProperties(originalSharedWorker.prototype, {
          ...originalSharedWorkerDescriptors,
          constructor: constructorDescriptor,
        });
      }
      Object.setPrototypeOf(wrappedDescriptor.value, Object.getPrototypeOf(originalSharedWorker));
      Object.setPrototypeOf(wrappedDescriptor.value.prototype, Object.getPrototypeOf(originalSharedWorker.prototype));
      FakeSharedWorker.OriginalFunction = originalSharedWorker;
      modifyFunction(globalThis, 'SharedWorker', wrappedDescriptor, FakeSharedWorker.Type);
    }
  },
};
export default SharedWorkerPatch;
