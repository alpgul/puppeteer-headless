import { globallyStorage } from '../../container/globallyStorage';
import { stackFilterStorage } from '../../container/stackFilterStorage';
import { consoleMethods } from '../../core/constant/global';
import { consoleFilter } from '../../filters/consoleFilter';
import FakeContext from '../../patches/console/context';
import FakeMetaData from '../../patches/NavigatorUAData/getHighEntropyValues';
import Fake2GetParameter from '../../patches/WebGL2RenderingContext/getParameter';
import FakeGetParameter from '../../patches/WebGLRenderingContext/getParameter';
import CommonPatch from '../patch/commonPatch';
import ConsolePatch from '../patch/consolePatch';

import { CommonBuild } from './commonBuild';

/**
 *
 * @param metaData Record of metadata key-value pairs
 */
export function WorkerBuild(metaData: Record<string, string>): void {
  globallyStorage.setMetaData(metaData);
  CommonBuild();
  stackFilterStorage.add(consoleFilter);
  ConsolePatch.applyPatch(globalThis.console);
  consoleMethods[consoleMethods.indexOf('dirxml')] = 'dirXml';
  CommonPatch.applyPatch(FakeContext, globalThis.console, 'context');
  CommonPatch.applyPatch(FakeGetParameter, globalThis.WebGLRenderingContext.prototype, 'getParameter');
  CommonPatch.applyPatch(Fake2GetParameter, globalThis.WebGL2RenderingContext.prototype, 'getParameter');
  CommonPatch.applyPatch(FakeMetaData, globalThis.NavigatorUAData.prototype, 'getHighEntropyValues');
}
