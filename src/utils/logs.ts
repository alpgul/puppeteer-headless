class Logger {
  private static instance: Logger | undefined;
  private _error: Console['error'] | undefined;
  private _info: Console['info'] | undefined;
  private _warn: Console['warn'] | undefined;
  private DEBUG = false;

  private constructor() {
    const console = globalThis.console;
    this.init(console);
  }

  public static getInstance(): Logger {
    Logger.instance ??= new Logger();
    return Logger.instance;
  }

  public init(console: Console): void {
    this._info = console.info;
    this._error = console.error;
    this._warn = console.warn;
  }

  public debug(message: string, ...arguments_: unknown[]): void {
    if (this.DEBUG) {
      this._info?.(`[DEBUG] ${message}`, ...arguments_);
    }
  }

  public info(message: string, ...arguments_: unknown[]): void {
    this._info?.(`[INFO] ${message}`, ...arguments_);
  }

  public error(message: string, ...arguments_: unknown[]): void {
    this._error?.(`[ERROR] ${message}`, ...arguments_);
  }

  public warn(message: string, ...arguments_: unknown[]): void {
    this._warn?.(`[WARN] ${message}`, ...arguments_);
  }
}

// Export a single instance
export const logger = Logger.getInstance();
