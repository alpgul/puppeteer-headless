import { stackFilterStorage } from '../../container/stackFilterStorage';
import { CommonFunctionFilter } from '../../filters/commonFunctionFilter';
import WindowHandler from '../../handlers/window';
import FakeToString from '../../patches/function/toString';
import CommonPatch from '../patch/commonPatch';
import ErrorPatch from '../patch/errorPatch';
import { logger } from '../../utils/logs';
/**
 * Initializes common build functionality including storage handling, filters, and patches
 */
export function CommonBuild(): void {
  logger.init(globalThis.console);
  WindowHandler.initStorageHandler();
  stackFilterStorage.add(CommonFunctionFilter);
  ErrorPatch.applyPatch(globalThis.Error);
  CommonPatch.applyPatch(FakeToString, globalThis.Function.prototype, 'toString');
}
