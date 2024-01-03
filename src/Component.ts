export interface ComponentClass extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  rehydrate?(this: void, data: unknown, componentClass: ComponentClass): Component | undefined;
  dehydrate?(this: void, data: InstanceType<this>): unknown | undefined;
}

export interface Component {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

export interface ComponentConstructor<C> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): C;
}

export class JsonSerializableComponent {
  static rehydrate(data: unknown, componentClass: ComponentClass): Component | undefined {
    return Object.assign(Object.create(componentClass.prototype as object), data) as Component;
  }

  static dehydrate(data: unknown): unknown {
    return data;
  }
}
