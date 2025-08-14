import { PROCESS_TIMEOUT } from '../core/constant/global';
import type { PathObject } from '../core/type/mouse';
import Browser from '../utils/browser';
import { sleep } from '../utils/sleep';

class GloballyStorage {
  private static instance: GloballyStorage | undefined;
  private metaData: Record<string, string> | undefined;
  private mouseSimBinding: ((string) => void) | undefined;
  private screenRect: DOMRect | undefined;
  private readonly shadowRootSet: Set<ShadowRoot>;
  private topWindow: Window | undefined;
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
  public exposeMouseSim(end: PathObject): void {
    if (!this.mouseSimBinding) return;
    const arguments_ = [end];
    this.mouseSimBinding(
      JSON.stringify({
        args: arguments_,
        isTrivial: !arguments_.some((value) => value instanceof Node),
        name: 'mouseSim',
        seq: 0,
        type: 'exposedFun',
      }),
    );
  }
  public getMetaData(): Record<string, string> | undefined {
    return this.metaData;
  }
  public getRawScreenRect: () => DOMRect | undefined = () => this.screenRect;
  public async getScreenRect(): Promise<DOMRect> {
    const time = Date.now();
    if (this.screenRect === undefined && globalThis.top && globalThis.self !== globalThis.top) {
      // eslint-disable-next-line sonarjs/post-message --  This is intentional for patching postMessage
      globalThis.top.postMessage({ command: 'getScreen', type: 'screen' }, '*');
    }
    while (time + PROCESS_TIMEOUT > Date.now()) {
      if (this.screenRect !== undefined) {
        return this.screenRect;
      }
      await sleep();
    }
    return new DOMRect();
  }
  public getShadowRootSet(): Set<ShadowRoot> {
    return this.shadowRootSet;
  }
  public getTopWindow(): Window & { Function: FunctionConstructor } {
    this.topWindow ??= Browser.findTopAccessibleWindow();
    return this.topWindow as Window & { Function: FunctionConstructor };
  }
  public getToWindowToString(): (...arguments_: unknown[]) => string {
    this.topWindowToString ??= this.getTopWindow().Function.prototype.toString;
    return this.topWindowToString;
  }
  public setMetaData(metaData: Record<string, string>): void {
    this.metaData = metaData;
  }
  public setMouseSimBinding(binding: (argument0: string) => void): void {
    this.mouseSimBinding = binding;
  }
  public setScreenRect(rect: DOMRect): void {
    this.screenRect = rect;
  }
}

export const globallyStorage = GloballyStorage.getInstance();
