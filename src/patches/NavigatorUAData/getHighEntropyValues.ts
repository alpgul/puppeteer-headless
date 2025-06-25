import { globallyStorage } from '../../container/globallyStorage';
import { PatchTypes } from '../../core/constant/global';
import type { Patch } from '../../core/interface/global';
import type { originalFunction } from '../../core/type/function';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- This class patches the getHighEntropyValues property of NavigatorUAData
class FakeMetaData {
  public static OriginalFunction: originalFunction<
    [...unknown[]],
    unknown,
    Promise<Record<string, string>> | undefined
  >;
  public static readonly Type: PatchTypes = PatchTypes.VALUE;
  public static getHighEntropyValues(
    this: unknown,
    hints: string[],
    ...arguments_: unknown[]
  ): Promise<object | Record<string, string>> | undefined {
    const returnValue = Reflect.apply(FakeMetaData.OriginalFunction, this, [hints, ...arguments_]);
    if (!returnValue) {
      return Promise.resolve({});
    }
    const data = returnValue.then((meta: Record<string, string>) => {
      const metaData = globallyStorage.getMetaData();
      if (metaData && typeof metaData === 'object') {
        if (metaData.fullVersion) {
          metaData.uaFullVersion = metaData.fullVersion;
          delete metaData.fullVersion;
        }
        for (const key in meta) {
          if (metaData[key]) {
            meta[key] = metaData[key] ?? meta[key];
          }
        }
      }
      return meta;
    });
    return data;
  }
}
export default FakeMetaData as Patch;
