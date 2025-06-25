export interface FakeErrorConstructor {
  (message?: string, options?: ErrorOptions): Error;
  prepareStackTrace?: (error: Error, stack: NodeJS.CallSite[]) => string;
  readonly prototype: Error;
  stackTraceLimit?: number;
}
