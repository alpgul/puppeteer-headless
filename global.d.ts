declare global {
  declare var NavigatorUAData: {
    new (): NavigatorUAData;
    prototype: NavigatorUAData;
  };
  declare var fullPatch: (window: window) => void;
  declare var cfPatch: () => void;
  declare var workerPatch: () => void;
  declare var DocumentPictureInPicture: {
    new (): DocumentPictureInPicture;
    prototype: DocumentPictureInPicture;
  };
  declare var WorkerGlobalScope: {
    prototype: {
      self: unknown;
    };
  };
  interface NavigatorUAData {
    brands: Array<{ brand: string; version: string }>;
    mobile: boolean;
    platform: string;
    getHighEntropyValues(hints: Array<string>): Promise<UADataValues>;
  }

  interface UADataValues {
    brands?: Array<{ brand: string; version: string }>;
    mobile?: boolean;
    platform?: string;
    architecture?: string;
    bitness?: string;
    model?: string;
    platformVersion?: string;
  }
  namespace globalThis {
    var metaData: Record<string, string>;
    var puppeteer_mouseSim: ((argument0: string) => void) | undefined;
  }
}
export {};
