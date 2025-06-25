export type originalFunction<A extends unknown[] = unknown[], T = unknown, R = unknown> = (
  this: T,
  ...arguments_: A
) => R;
export type wrappedFunction<A extends unknown[] = unknown[], T = unknown, R = unknown> = (
  this: T,
  ...arguments_: A
) => R;
