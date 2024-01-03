import { type Component, type ComponentConstructor, ComponentClass } from "./Component.js";
import { ComponentStorage } from "./ComponentStorage.js";
import type { Entity } from "./Entity.js";
import {
  ENTITY,
  ENTITY_BUILDER,
  type InfallibleQuery,
  type Query,
  type QueryElement,
  type QueryResult,
} from "./Query.js";
import type { System } from "./System.js";
import type { Resource, ResourceClass, ResourceConstructor } from "./Resource.js";
import type { WorldView } from "./WorldView.js";
import { EntityBuilder } from "./EntityBuilder.js";
import { QueryResults } from "./QueryResults.js";

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

  setResource<T extends Resource>(resource: T) {
    this.#resources.set(resource.constructor as ResourceClass, resource);
    return this;
  }

  registerResource<T>(resource: ResourceConstructor<T>) {
    if (!this.#resources.has(resource)) {
      this.#resources.set(resource, undefined);
    }
    return this;
  }

  removeResource<T>(resource: ResourceConstructor<T>) {
    this.#resources.set(resource, undefined);
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

  registerComponent<C extends Component>(component: C["constructor"]) {
    if (!this.#components.has(component as ComponentClass)) {
      this.#components.set(component as ComponentClass, new ComponentStorage<C>());
    }
    return this;
  }

  addComponent<T extends Component>(entity: Entity, component: T) {
    const storage = this.#components.get(component.constructor as ComponentClass);
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

  requireComponent<T>(entity: Entity, component: ComponentConstructor<T>): T {
    const found = this.getComponent(entity, component);
    if (found === undefined) {
      throw new TypeError(`Required component ${component.name} is not found for entity ${entity}`);
    }
    return found;
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

  query<Q extends InfallibleQuery>(entity: Entity, ...query: Q): QueryResult<Q>;
  query<Q extends Query>(entity: Entity, ...query: Q): QueryResult<Q> | undefined;
  query<Q extends Query>(entity: Entity, ...query: Q): QueryResult<Q> | undefined {
    const result = [];
    for (const filter of query) {
      // It is invalid to not register first, let's just crash here.
      if (filter === ENTITY) {
        result.push(entity);
        continue;
      }

      if (filter === ENTITY_BUILDER) {
        result.push(new EntityBuilder(entity, this));
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
      for (const [entity, component] of storage) {
        const dehydrated = componentClass.dehydrate?.(component);
        if (!dehydrated) continue;
        const components = snapshot.entities[entity] ?? {};
        components[componentClass.name] = structuredClone(dehydrated);
        snapshot.entities[entity] = components;
      }
    }

    for (const [resourceClass, resource] of this.#resources) {
      const dehydrated = resourceClass.dehydrate?.(resource);
      if (!dehydrated) continue;
      snapshot.resources[resourceClass.name] = structuredClone(dehydrated);
    }

    return snapshot;
  }

  restore(snapshot: WorldSnapshot) {
    // HACK: This is a very scary function... we might have to do
    // something more explicit down the line...

    // Restore the resources.
    //
    // NOTE: they don't get reset first. Restored resources are merged with
    // existing ones.
    for (const [resourceName, resource] of Object.entries(snapshot.resources)) {
      const resourceClass = [...this.#resources.keys()].find(
        (resourceClass) => resourceClass.name === resourceName,
      );
      if (!resourceClass) {
        throw new UnknownResourceError(`Resource ${resourceName} not known`);
      }
      const rehydrated = resourceClass.rehydrate?.(resource, resourceClass);
      if (!rehydrated) continue;
      this.#resources.set(resourceClass, rehydrated);
    }

    // Reset the components/entities.
    //
    // The components do get reset when loaded from snapshot, as the component IDs
    // would otherwise conflict with existing entities.
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
        const rehydrated = componentClass.rehydrate?.(component, componentClass);
        if (!rehydrated) continue;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#components.get(rehydrated.constructor as ComponentClass)!.set(entity, rehydrated);
      }
    }
  }
}
