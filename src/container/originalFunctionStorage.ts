import type { originalFunction, wrappedFunction } from '../core/type/function';
class OriginalFunctionStorage {
  private static instance: OriginalFunctionStorage | undefined;
  private readonly storage: WeakMap<wrappedFunction<[unknown]>, originalFunction<[unknown]>>;

  private constructor() {
    this.storage = new WeakMap();
  }

  public static getInstance(): OriginalFunctionStorage {
    OriginalFunctionStorage.instance ??= new OriginalFunctionStorage();
    return OriginalFunctionStorage.instance;
  }

  public store(wrappedFunction: wrappedFunction, originalFunction: originalFunction): void {
    this.storage.set(wrappedFunction, originalFunction);
  }

  public get(wrappedFunction: wrappedFunction): originalFunction | undefined {
    return this.storage.get(wrappedFunction);
  }

  public has(wrappedFunction: wrappedFunction): boolean {
    return this.storage.has(wrappedFunction);
  }
}

export const originalFunctionStorage = OriginalFunctionStorage.getInstance();
