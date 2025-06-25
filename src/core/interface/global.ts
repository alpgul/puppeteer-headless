import type { PatchTypes } from '../constant/global';
import type { AttachShadowConstructor } from '../type/attachShadow';

import type { originalFunction } from './../type/function';
export interface Patch {
  OriginalFunction?: AttachShadowConstructor | originalFunction;
  OriginalGetFunction?: originalFunction<[]>;
  OriginalSetFunction?: originalFunction;
  Type: PatchTypes;
}
