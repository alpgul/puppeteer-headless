import { NOT_FOUND, Removal } from '../core/constant/global';
import type { FilterFunction } from '../core/type/filter';
class StackFilterStorage {
  private static instance: StackFilterStorage | undefined;
  private filters: FilterFunction[] = [];

  private constructor() {
    // Singleton pattern - private constructor
  }

  public static getInstance(): StackFilterStorage {
    StackFilterStorage.instance ??= new StackFilterStorage();
    return StackFilterStorage.instance;
  }

  public add(filter: FilterFunction): void {
    this.filters.push(filter);
  }

  public remove(filter: FilterFunction): void {
    const index = this.filters.indexOf(filter);
    if (index !== NOT_FOUND) {
      this.filters.splice(index, Removal.SINGLE_ITEM_REMOVAL);
    }
  }

  public getFilters(): FilterFunction[] {
    return this.filters;
  }

  public apply(error: Error, stackObject: NodeJS.CallSite[]): [Error, NodeJS.CallSite[]] {
    for (const filter of this.filters) {
      if (typeof filter === 'function' && error.stack !== undefined) {
        [error, stackObject] = filter(error, stackObject);
      }
    }
    return [error, stackObject];
  }
  public clear(): void {
    this.filters = [];
  }
}

export const stackFilterStorage = StackFilterStorage.getInstance();
