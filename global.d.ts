declare global {
  declare var NavigatorUAData: {
    new (): NavigatorUAData;
    prototype: NavigatorUAData;
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
  }
}
export {};
