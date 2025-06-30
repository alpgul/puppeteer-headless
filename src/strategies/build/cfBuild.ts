import { stackFilterStorage } from '../../container/stackFilterStorage';
import { consoleMethods } from '../../core/constant/global';
import { consoleFilter } from '../../filters/consoleFilter';
import { listenerFilter } from '../../filters/listenerFilter';
import { mouseSimulationFilter } from '../../filters/mouseSimulationFilter';
import { onMessageFilter } from '../../filters/onMessageFilter';
import WindowHandler from '../../handlers/window';
import FakeContext from '../../patches/console/context';
import FakeRequestWindow from '../../patches/DocumentPictureInPicture/requestWindow';
import AddEventListener from '../../patches/eventTarget/addEventListener';
import RemoveEventListener from '../../patches/eventTarget/removeEventListener';
import FakeAttachShadow from '../../patches/HTMLElement/attachShadow';
import FakeOnClickEL from '../../patches/HTMLElement/onClick';
import FakeAvailHeight from '../../patches/screen/availHeight';
import FakeType from '../../patches/screenOrientation/type';
import Fake2GetParameter from '../../patches/WebGL2RenderingContext/getParameter';
import FakeGetParameter from '../../patches/WebGLRenderingContext/getParameter';
import FakeOnClick from '../../patches/window/onClick';
import CommonPatch from '../patch/commonPatch';
import ConsolePatch from '../patch/consolePatch';
import SharedWorkerPatch from '../patch/sharedWorkerPatch';

import { CommonBuild } from './commonBuild';

/**
 *
 */
export function cfBuild(): void {
  CommonBuild();
  WindowHandler.initOnMessageHandler();
  stackFilterStorage.add(consoleFilter);
  stackFilterStorage.add(listenerFilter);
  stackFilterStorage.add(onMessageFilter);
  stackFilterStorage.add(mouseSimulationFilter);
  ConsolePatch.applyPatch(globalThis.console);
  consoleMethods[consoleMethods.indexOf('dirxml')] = 'dirXml';
  CommonPatch.applyPatch(FakeContext, globalThis.console, 'context');
  CommonPatch.applyPatch(FakeAvailHeight, globalThis.Screen.prototype, 'availHeight');
  CommonPatch.applyPatch(FakeType, globalThis.ScreenOrientation.prototype, 'type');
  CommonPatch.applyPatch(FakeOnClickEL, globalThis.HTMLElement.prototype, 'onclick');
  CommonPatch.applyPatch(FakeOnClick, globalThis, 'onclick');
  CommonPatch.applyPatch(AddEventListener, globalThis.EventTarget.prototype, 'addEventListener');
  CommonPatch.applyPatch(RemoveEventListener, globalThis.EventTarget.prototype, 'removeEventListener');
  CommonPatch.applyPatch(FakeAttachShadow, globalThis.Element.prototype, 'attachShadow');
  CommonPatch.applyPatch(FakeGetParameter, globalThis.WebGLRenderingContext.prototype, 'getParameter');
  CommonPatch.applyPatch(Fake2GetParameter, globalThis.WebGL2RenderingContext.prototype, 'getParameter');
  if(typeof globalThis.DocumentPictureInPicture !== 'undefined'){
    CommonPatch.applyPatch(FakeRequestWindow, globalThis.DocumentPictureInPicture.prototype, 'requestWindow');
  }
  SharedWorkerPatch.applyPatch();

  WindowHandler.initObserverNode();
}
