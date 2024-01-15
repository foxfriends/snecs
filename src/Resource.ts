/** A class of whose instances are intended to be used as resources. */
export interface ResourceClass extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): any;
  /**
   * The `rehydrate` method is used to instantiate an instance of a Resource class from
   * a previously dehydrated instance when loading a `World` from `WorldSnapshot`.
   *
   * If this function returns `undefined`, the resources will not be added to the entity
   * when rehydrating. Useful for resources which have been removed from the game.
   *
   * @param data The previously dehydrated data.
   * @param resourceClass The final class that is being rehydrated. May be used to instantiate instances.
   */
  rehydrate?(this: void, data: unknown, resourceClass: ResourceClass): Resource | undefined;
  /**
   * When saving a `World` to a `WorldSnapshot`, the `dehydrate` method is used to serialize
   * each resource to JSON.
   *
   * If this function returns `undefined`, the resource will not be included in the snapshot.
   *
   * @param data The resource instance being serialized.
   * @param purpose The purpose that was passed to the snapshot.
   */
  dehydrate?(this: void, data: InstanceType<this>, purpose?: unknown): unknown | undefined;
}

/**
 * A Component stores a piece of data that is associated with the world
 * and made available to all systems.
 *
 * Any class may be used as a resource.
 */
export interface Resource {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

/** A constructor function that instantiates a Resource. */
export interface ResourceConstructor<R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): R;
}

/** Resource mixin for classes which can be trivially serialized and deserialized as JSON. */
export class JsonSerializableResource {
  static rehydrate(data: unknown, resourceClass: ResourceClass): Resource | undefined {
    return Object.assign(Object.create(resourceClass.prototype as object), data) as Resource;
  }

  static dehydrate(data: unknown, _purpose?: unknown): unknown {
    return data;
  }
}
