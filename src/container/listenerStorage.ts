import { NOT_FOUND, Removal } from '../core/constant/global';
class ListenerStorage {
  private static instance: ListenerStorage | undefined;
  private readonly globalOnMessageArr: EventListener[];
  private readonly listenerMap: WeakMap<
    EventListenerOrEventListenerObject,
    { counter: number; wrappedListener: EventListenerOrEventListenerObject }
  >;

  private constructor() {
    this.listenerMap = new WeakMap();
    this.globalOnMessageArr = [];
  }

  public static getInstance(): ListenerStorage {
    ListenerStorage.instance ??= new ListenerStorage();
    return ListenerStorage.instance;
  }
  deleteListenerMap(callback: EventListenerOrEventListenerObject): void {
    this.listenerMap.delete(callback);
  }
  dispatchGlobalOnMessage(that_: Window, event: MessageEvent): void {
    for (const function_ of this.globalOnMessageArr) {
      function_.apply(that_, [event]);
    }
  }
  getListenerMap(callback: EventListenerOrEventListenerObject):
    | {
        counter: number;
        wrappedListener: EventListenerOrEventListenerObject;
      }
    | undefined {
    return this.listenerMap.get(callback);
  }
  onMessageAdd(callback: EventListener): void {
    this.globalOnMessageArr.push(callback);
  }
  onMessageRemove(callback: EventListener): void {
    const index = this.globalOnMessageArr.indexOf(callback);
    if (index !== NOT_FOUND) {
      this.globalOnMessageArr.splice(index, Removal.SINGLE_ITEM_REMOVAL);
    }
  }
  setListenerMap(
    callback: EventListenerOrEventListenerObject,
    wrappedListener: EventListenerOrEventListenerObject,
  ): void {
    this.listenerMap.set(callback, { counter: 1, wrappedListener });
  }
}

export const listenerStorage = ListenerStorage.getInstance();
