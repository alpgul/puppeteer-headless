export const NOT_FOUND = -1;
export const BIGGER_THEN_ONE = 1;
export const TASKBAR_HEIGHT = 32;
export const FILTER_PATCH_NAME = 'filterPatch';
export const SCREEN_SCALE = 1.25;
export const SLEEP_TIME = 5000;
export const PROCESS_TIMEOUT = 15_000;
export const SCREEN_SIZE = { height: 1080, width: 1920 };
export enum Removal {
  SINGLE_ITEM_REMOVAL = 1,
  THREE_ITEM_REMOVAL = 3,
  TWO_ITEM_REMOVAL = 2,
}
export const consoleMethods = ['log', 'error', 'info', 'warn', 'trace', 'dir', 'debug', 'dirxml', 'table'];
export const errorTypes = [
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'RangeError',
  'EvalError',
  'URIError',
  'AggregateError',
];
export enum ArrayItem {
  FIRST_ITEM,
  SECOND_ITEM,
}
export enum PatchTypes {
  GET,
  SET,
  VALUE,
}
