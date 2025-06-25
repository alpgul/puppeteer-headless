export type FilterFunction = (stack: Error, stackObject: NodeJS.CallSite[]) => [Error, NodeJS.CallSite[]];
