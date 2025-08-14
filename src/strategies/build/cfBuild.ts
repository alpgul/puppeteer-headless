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
import ScreenX from '../../patches/MouseEvent/screenX';
import ScreenY from '../../patches/MouseEvent/screenY';
import FakeAvailHeight from '../../patches/screen/availHeight';
import FakeType from '../../patches/screenOrientation/type';
import { registerMouseSim } from '../../services/registerGlobalStorage';
import { logger } from '../../utils/logs';
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
  CommonPatch.applyPatch(ScreenX, globalThis.MouseEvent.prototype, 'screenX');
  CommonPatch.applyPatch(ScreenY, globalThis.MouseEvent.prototype, 'screenY');
  CommonPatch.applyPatch(FakeType, globalThis.ScreenOrientation.prototype, 'type');
  CommonPatch.applyPatch(AddEventListener, globalThis.EventTarget.prototype, 'addEventListener');
  CommonPatch.applyPatch(RemoveEventListener, globalThis.EventTarget.prototype, 'removeEventListener');
  CommonPatch.applyPatch(FakeAttachShadow, globalThis.Element.prototype, 'attachShadow');
  if (typeof globalThis.DocumentPictureInPicture !== 'undefined') {
    CommonPatch.applyPatch(FakeRequestWindow, globalThis.DocumentPictureInPicture.prototype, 'requestWindow');
  }
  SharedWorkerPatch.applyPatch();

  WindowHandler.initObserverNode();
  registerMouseSim();
  logger.debug('CF Build Successful!');
}
