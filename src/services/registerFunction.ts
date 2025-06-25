import { originalFunctionStorage } from '../container/originalFunctionStorage';
import type { originalFunction, wrappedFunction } from '../core/type/function';

import { globallyStorage } from './../container/globallyStorage';
class RegisterService {
  private static instance: RegisterService | undefined;
  private readonly originalDispatch = globalThis.dispatchEvent;

  private constructor() {
    this.originalDispatch = globalThis.dispatchEvent;
  }

  public static getInstance(): RegisterService {
    RegisterService.instance ??= new RegisterService();
    return RegisterService.instance;
  }

  public registerFunction({
    originalFunction,
    wrappedFunction,
  }: {
    originalFunction: originalFunction;
    wrappedFunction: wrappedFunction;
  }): void {
    const topWindow = globallyStorage.getTopWindow();
    if (topWindow === globalThis.self) {
      originalFunctionStorage.store(wrappedFunction, originalFunction);
    } else {
      Reflect.apply(this.originalDispatch, topWindow, [
        new CustomEvent('__cfPatch__addFunctionToStorage', { detail: { originalFunction, wrappedFunction } }),
      ]);
    }
  }
}

export const registerService = RegisterService.getInstance();
