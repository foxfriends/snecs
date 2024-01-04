export interface ResourceClass extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  rehydrate?(this: void, data: unknown, resourceClass: ResourceClass): Resource | undefined;
  dehydrate?(this: void, data: InstanceType<this>, purpose?: unknown): unknown | undefined;
}

export interface Resource {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

export interface ResourceConstructor<R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): R;
}

export class JsonSerializableResource {
  static rehydrate(data: unknown, resourceClass: ResourceClass): Resource | undefined {
    return Object.assign(Object.create(resourceClass.prototype as object), data) as Resource;
  }

  static dehydrate(data: unknown, _purpose?: unknown): unknown {
    return data;
  }
}
