import type { Entity } from "./Entity.js";

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
