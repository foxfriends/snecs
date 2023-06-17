import {
  type Component,
  type ComponentConstructor,
  ComponentStorage,
  ComponentClass,
} from "./Component.js";
import type { Entity } from "./Entity.js";
import { ENTITY, Query, QueryElement, QueryResult } from "./Query.js";
import type { System } from "./System.js";
import type { Resource, ResourceClass, ResourceConstructor } from "./Resource.js";
import { EntityBuilder } from "./EntityBuilder.js";
import { QueryResults } from "./QueryResults.js";
import type { WorldView } from "./WorldView.js";

export class UnknownComponentError extends Error {}

export class UnknownResourceError extends Error {}

export type WorldSnapshot = {
  resources: Record<string, unknown>;
  entities: Record<Entity, Record<string, unknown>>;
};

export class World implements WorldView {
  #entities: (Entity | undefined)[] = [];
  #systems: System[] = [];

  #components: Map<ComponentClass, ComponentStorage<unknown>> = new Map();

  #resources: Map<ResourceClass, unknown> = new Map();

  registerComponent<C extends Component>(component: C["constructor"]) {
    this.#components.set(component, new ComponentStorage<C>());
    return this;
  }

  setResource<T extends Resource>(resource: T) {
    this.#resources.set(resource.constructor, resource);
    return this;
  }

  registerResource<T>(resource: ResourceConstructor<T>) {
    this.#resources.set(resource, undefined);
    return this;
  }

  removeResource<T extends Resource>(resource: T["constructor"]) {
    this.#resources.delete(resource);
  }

  getResource<T>(resource: ResourceConstructor<T>): T | undefined {
    return this.#resources.get(resource) as T | undefined;
  }

  requireResource<T>(resource: ResourceConstructor<T>): T {
    const value = this.#resources.get(resource);
    if (value === undefined) {
      throw new TypeError(`Required resource ${resource.name} is not set`);
    }
    return value as T;
  }

  entities(): Entity[] {
    return this.#entities.filter((n): n is number => n !== undefined);
  }

  createEntity(): Entity {
    const entity = Math.max(...this.entities(), 0) + 1;
    this.#entities[entity] = entity;
    return entity;
  }

  buildEntity(): EntityBuilder {
    return new EntityBuilder(this.createEntity(), this);
  }

  destroyEntity(entity: Entity) {
    for (const storage of this.#components.values()) {
      storage.delete(entity);
    }
    delete this.#entities[entity];
  }

  addComponent<T extends Component>(entity: Entity, component: T) {
    const storage = this.#components.get(component.constructor);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${component.constructor.name}`,
      );
    }
    storage.set(entity, component);
  }

  getComponent<T>(entity: Entity, component: ComponentConstructor<T>): T | undefined {
    const storage = this.#components.get(component);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${component.name}`,
      );
    }
    return storage.get(entity) as T;
  }

  removeComponent<T>(entity: Entity, component: ComponentConstructor<T>) {
    const storage = this.#components.get(component);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${component.name}`,
      );
    }
    storage.delete(entity);
  }

  private getStorage<T>(componentClass: ComponentConstructor<T>): ComponentStorage<T> {
    const storage = this.#components.get(componentClass);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${componentClass.name}`,
      );
    }
    return storage as ComponentStorage<T>;
  }

  query<Q extends Query>(entity: Entity, ...query: Q): QueryResult<Q> | undefined {
    const result = [];
    for (const filter of query) {
      // It is invalid to not register first, let's just crash here.
      if (filter === ENTITY) {
        result.push(entity);
        continue;
      }

      if ("not" in filter) {
        const component = this.query(entity, filter.query as QueryElement);
        if (component) return undefined;
        continue;
      }

      if ("optional" in filter) {
        const component = this.query(entity, filter.query as QueryElement);
        result.push(component?.[0]);
        continue;
      }

      if ("derived" in filter) {
        const queryResult = this.query(entity, ...filter.query);
        if (!queryResult) return undefined;
        const derivedValue = filter.combiner(queryResult, this);
        if (derivedValue === undefined) return undefined;
        result.push(derivedValue);
        continue;
      }

      const storage = this.getStorage(filter);
      const component = storage.get(entity);
      if (!component) return undefined;
      result.push(component);
    }
    return result as QueryResult<Q>;
  }

  find<Q extends Query>(...query: Q): QueryResults<Q> {
    const world = this; // eslint-disable-line @typescript-eslint/no-this-alias

    return new QueryResults(this, function* () {
      for (const entity of world.#entities) {
        if (entity === undefined) continue;
        const result = world.query(entity, ...query);
        if (result) yield [entity, result];
      }
    });
  }

  with(entities: Entity[]): QueryResults<[typeof ENTITY]> {
    return new QueryResults(this, function* () {
      for (const entity of entities) {
        yield [entity, [entity]];
      }
    });
  }

  snapshot(): WorldSnapshot {
    const snapshot: WorldSnapshot = {
      resources: {},
      entities: {},
    };

    for (const entity of this.#entities) {
      if (entity !== undefined) {
        snapshot.entities[entity] = {};
      }
    }

    for (const [componentClass, storage] of this.#components) {
      if (componentClass.skipSerialization) continue;

      for (const [entity, component] of storage) {
        const components = snapshot.entities[entity] ?? {};
        components[componentClass.name] = structuredClone(component);
        snapshot.entities[entity] = components;
      }
    }

    for (const [resourceClass, resource] of this.#resources) {
      if (!resourceClass.serialize) continue;
      snapshot.resources[resourceClass.name] = structuredClone(resource);
    }

    return snapshot;
  }

  restore(snapshot: WorldSnapshot) {
    // HACK: This is a very scary function... we might have to do
    // something more explicit down the line...

    // Restore the resources. NOTE: they didn't get reset first.
    for (const [resourceName, resource] of Object.entries(snapshot.resources)) {
      const resourceClass = [...this.#resources.keys()].find(
        (resourceClass) => resourceClass.name === resourceName,
      );
      if (!resourceClass) {
        throw new UnknownResourceError(`Resource ${resourceName} not known`);
      }
      const rehydrated = resourceClass.rehydrate
        ? resourceClass.rehydrate(resource)
        : (Object.assign(Object.create(resourceClass.prototype as object), resource) as Resource);
      if (!rehydrated) continue;
      this.#resources.set(resourceClass, rehydrated);
    }

    // Reset the components/entities.
    this.#entities = [];
    for (const key of this.#components.keys()) {
      this.#components.set(key, new ComponentStorage());
    }

    // Restore the components.
    for (const [entityKey, components] of Object.entries(snapshot.entities)) {
      const entity = +entityKey;
      for (const [componentName, component] of Object.entries(components)) {
        this.#entities[entity] = entity;
        const componentClass = [...this.#components.keys()].find(
          (componentClass) => componentClass.name === componentName,
        );
        if (!componentClass) {
          throw new UnknownComponentError(`Component ${componentName} not registered`);
        }

        const rehydrated = componentClass.rehydrate
          ? componentClass.rehydrate(component)
          : (Object.assign(
              Object.create(componentClass.prototype as object),
              component,
            ) as Component);
        if (!rehydrated) continue;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#components.get(rehydrated.constructor)!.set(entity, rehydrated);
      }
    }
  }
}
