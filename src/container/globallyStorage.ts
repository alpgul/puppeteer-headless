import Browser from '../utils/browser';

class GloballyStorage {
  private static instance: GloballyStorage | undefined;
  private metaData: Record<string, string> | undefined;
  private screenRect: DOMRect | undefined;
  private readonly shadowRootSet: Set<ShadowRoot>;
  private topWindow: (Window & { Function: FunctionConstructor }) | undefined;
  private topWindowToString: (() => string) | undefined;

  private constructor() {
    // Singleton pattern - private constructor
    this.shadowRootSet = new Set();
  }

  public static getInstance(): GloballyStorage {
    GloballyStorage.instance ??= new GloballyStorage();
    return GloballyStorage.instance;
  }
  public addShadowRoot(shadowRoot: ShadowRoot): void {
    this.shadowRootSet.add(shadowRoot);
  }
  public getMetaData(): Record<string, string> | undefined {
    return this.metaData;
  }
  public getScreenRect(): DOMRect {
    if (this.screenRect === undefined) {
      return new DOMRect();
    }
    return this.screenRect;
  }
  public getShadowRootSet(): Set<ShadowRoot> {
    return this.shadowRootSet;
  }
  public getTopWindow(): Window & { Function: FunctionConstructor } {
    this.topWindow ??= Browser.findTopAccessibleWindow();
    return this.topWindow;
  }
  public getToWindowToString(): (...arguments_: unknown[]) => string {
    this.topWindowToString ??= this.getTopWindow().Function.prototype.toString;
    return this.topWindowToString;
  }
  public setMetaData(metaData: Record<string, string>): void {
    this.metaData = metaData;
  }
  public setScreenRect(rect: DOMRect): void {
    this.screenRect = rect;
  }
}

export const globallyStorage = GloballyStorage.getInstance();
