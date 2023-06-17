export interface ResourceClass extends Function {
  readonly serialize?: true;

  rehydrate?(data: unknown): Resource;
}

export interface Resource {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

export interface ResourceConstructor<R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): R;
}
