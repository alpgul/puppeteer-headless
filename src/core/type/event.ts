import type { originalFunction, wrappedFunction } from './function';

export interface FunctionStorageEvent {
  originalFunction: originalFunction;
  wrappedFunction: wrappedFunction<unknown[], void>;
}
export interface OnMessageEvent {
  command: 'getScreen' | 'receiveScreen' | undefined;
  rect: DOMRect | undefined;
  type: 'screen' | undefined;
}

export type AddEventListener = (
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: AddEventListenerOptions | boolean,
) => void;
