import type { Entity } from "./Entity.js";

export interface ComponentClass extends Function {
  readonly skipSerialization?: true;
}

export interface Component {
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor: Function;
}

export interface ComponentConstructor<C> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any): C;
}

export class ComponentStorage<T> {
  #storage: Map<Entity, T> = new Map();

  get(entity: Entity): T | undefined {
    return this.#storage.get(entity);
  }

  set(entity: Entity, component: T) {
    this.#storage.set(entity, component);
    return this;
  }

  delete(entity: Entity) {
    this.#storage.delete(entity);
    return this;
  }

  has(entity: Entity): boolean {
    return this.#storage.has(entity);
  }

  *[Symbol.iterator](): Iterator<[Entity, T]> {
    yield* this.#storage[Symbol.iterator]();
  }
}
