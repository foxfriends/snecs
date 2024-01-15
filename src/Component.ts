/** A class of whose instances are intended to be used as components. */
export interface ComponentClass extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  /**
   * The `rehydrate` method is used to instantiate an instance of a Component class from
   * a previously dehydrated instance when loading a `World` from `WorldSnapshot`.
   *
   * If this function returns `undefined`, the component will not be added to the entity
   * when rehydrating. Useful for components which have been removed from the game.
   *
   * @param data The previously dehydrated data.
   * @param componentClass The final class that is being rehydrated. May be used to instantiate instances.
   */
  rehydrate?(this: void, data: unknown, componentClass: ComponentClass): Component | undefined;
  /**
   * When saving a `World` to a `WorldSnapshot`, the `dehydrate` method is used to serialize
   * each component to JSON.
   *
   * If this function returns `undefined`, the component will not be included in the snapshot.
   *
   * @param data The component instance being serialized.
   * @param purpose The purpose that was passed to the snapshot.
   */
  dehydrate?(this: void, data: InstanceType<this>, purpose?: unknown): unknown | undefined;
}

/**
 * A Component stores a small piece of data in association with an Entity.
 * Each entity may have 0 or 1 instances of any Component.
 *
 * Any class may be used as a component.
 */
export interface Component {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

/** A constructor function that instantiates a Component. */
export interface ComponentConstructor<C> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): C;
}

/** Component mixin for classes which can be trivially serialized and deserialized as JSON. */
export class JsonSerializableComponent {
  static rehydrate(data: unknown, componentClass: ComponentClass): Component | undefined {
    return Object.assign(Object.create(componentClass.prototype as object), data) as Component;
  }

  static dehydrate(data: unknown, _purpose?: unknown): unknown {
    return data;
  }
}
