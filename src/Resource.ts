export interface ResourceClass extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  readonly serialize?: true;
  rehydrate?(this: void, data: unknown): Resource;
  dehydrate?(this: void, data: InstanceType<this>): unknown;
}

export interface Resource {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

export interface ResourceConstructor<R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): R;
}
