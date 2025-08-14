import { PatchTypes } from '../core/constant/global';
import { originalFunction } from '../core/type/function';
import { createUrlWithPatchedWorker } from '../utils/patch';

const FakeSharedWorker: {
  OriginalFunction?: unknown;
  Type: PatchTypes;
  SharedWorker: unknown;
} = {
  Type: PatchTypes.VALUE,
  SharedWorker: function (url: string, ...options: unknown[]) {
    const SharedWorkerCtor = FakeSharedWorker.OriginalFunction as new (
      url: string | URL,
      options?: unknown[],
    ) => SharedWorker;
    if (url.toString().startsWith('blob:')) {
      url = createUrlWithPatchedWorker(url);
    }
    if (!new.target) {
      return Reflect.apply(SharedWorkerCtor, this, [url, ...options]);
    }
    return new SharedWorkerCtor(url, options);
  },
};
export default FakeSharedWorker;
