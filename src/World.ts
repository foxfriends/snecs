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

/** An unknown component was accessed in the world */
export class UnknownComponentError extends Error {}

/** An unknown resource was accessed in the world */
export class UnknownResourceError extends Error {}

/**
 * The structure of a snapshot of a world, which can be used to
 * save and restore the state of a world beyond the lifetime of
 * the program.
 */
export type WorldSnapshot = {
  resources: Record<string, unknown>;
  entities: Record<Entity, Record<string, unknown>>;
};

/**
 * The World implements the EC of ECS, and acts as a container for all entities,
 * components, and resources. On its own, the world is just a static pile of data.
 *
 * Systems act on the world, communicating by modifying the components and resources.
 */
export class World implements WorldView {
  #entities: (Entity | undefined)[] = [];
  #systems: System[] = [];
  #components: Map<ComponentClass, ComponentStorage<unknown>> = new Map();
  #resources: Map<ResourceClass, unknown> = new Map();

  /**
   * Sets a resource for this world. This will replace any existing resource
   * of the same type.
   *
   * Resources set this way will automatically be registered.
   */
  setResource<T extends Resource>(resource: T) {
    this.#resources.set(resource.constructor as ResourceClass, resource);
    return this;
  }

  /**
   * Registers a resource type for this world, without actually creating a
   * resource of that type. Resources must be registered in order for them
   * to be restored from a snapshot.
   */
  registerResource<T>(resource: ResourceConstructor<T>) {
    if (!this.#resources.has(resource)) {
      this.#resources.set(resource, undefined);
    }
    return this;
  }

  /**
   * Removes a resource from the world. The resource type remains registered.
   */
  removeResource<T>(resource: ResourceConstructor<T>) {
    this.#resources.set(resource, undefined);
  }

  /**
   * Gets the resource from the world by its resource type.
   *
   * Returns `undefined` if the resource is not set or not registered.
   */
  getResource<T>(resource: ResourceConstructor<T>): T | undefined {
    return this.#resources.get(resource) as T | undefined;
  }

  /**
   * Gets the resource from the world by its resource type.
   *
   * @throws {TypeError} if the resource is not set.
   */
  requireResource<T>(resource: ResourceConstructor<T>): T {
    const value = this.#resources.get(resource);
    if (value === undefined) {
      throw new TypeError(`Required resource ${resource.name} is not set`);
    }
    return value as T;
  }

  /**
   * The list of entities currently existing in this world.
   */
  entities(): Entity[] {
    return this.#entities.filter((n): n is number => n !== undefined);
  }

  /**
   * Creates a new entity in this world. The created entity has no
   * components.
   */
  createEntity(): Entity {
    const entity = Math.max(...this.entities(), 0) + 1;
    this.#entities[entity] = entity;
    return entity;
  }

  /**
   * Creates a new entity in this world. The created entity has no
   * components.
   *
   * Returns an `EntityBuilder` by which components can be conveniently
   * added to the entity.
   */
  buildEntity(): EntityBuilder {
    return new EntityBuilder(this.createEntity(), this);
  }

  /**
   * Removes an entity and all its components from the world
   *
   * Note that this does not (cannot) recognize references to entities within
   * other components. If there are components that refer to this entity by ID,
   * it is recommended to explicitly delete those references yourself before
   * destroying the entity.
   */
  destroyEntity(entity: Entity) {
    for (const storage of this.#components.values()) {
      storage.delete(entity);
    }
    delete this.#entities[entity];
  }

  /**
   * Registers a new component type with this world.
   *
   * Components may not be used unless registered. Any attempt to use an unregistered
   * component will result in errors being thrown.
   */
  registerComponent<C extends Component>(component: C["constructor"]) {
    if (!this.#components.has(component as ComponentClass)) {
      this.#components.set(component as ComponentClass, new ComponentStorage<C>());
    }
    return this;
  }

  /**
   * Adds a component for an entity.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  addComponent<T extends Component>(entity: Entity, component: T) {
    const storage = this.#components.get(component.constructor as ComponentClass);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${component.constructor.name}`,
      );
    }
    storage.set(entity, component);
  }

  /**
   * Removes components of the given type from all entities.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  clearComponent<T>(component: ComponentConstructor<T>) {
    const storage = this.#components.get(component);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted to clear non-registered component ${component.name}`,
      );
    }
    storage.clear();
  }

  /**
   * Retrieves the component of the given type from an entity.
   *
   * Returns `undefined` if the entity does not have this component.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  getComponent<T>(entity: Entity, component: ComponentConstructor<T>): T | undefined {
    const storage = this.#components.get(component);
    if (!storage) {
      throw new UnknownComponentError(
        `Attempted use of non-registered component ${component.name}`,
      );
    }
    return storage.get(entity) as T;
  }

  /**
   * Retrieves the component of the given type from an entity.
   *
   * @throws {TypeError} if the entity does not have this component
   * @throws {UnknownComponentError} if the component type is not registered
   */
  requireComponent<T>(entity: Entity, component: ComponentConstructor<T>): T {
    const found = this.getComponent(entity, component);
    if (found === undefined) {
      throw new TypeError(`Required component ${component.name} is not found for entity ${entity}`);
    }
    return found;
  }

  /**
   * Removes the component of the given type from an entity.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
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

  /**
   * Look up a query for an entity, as a bundle.
   *
   * Returns the entire located bundle, or undefined if any of the pieces of the
   * query were not found.
   *
   * If some pieces of the bundle are expected to be optional, use the `OPTIONAL`
   * modifier.
   *
   * @throws {UnknownComponentError} if any component queried is not registered.
   */
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

  /**
   * Finds all entities which satisfy a given query, returning them as a `QueryResults`
   * iterator. The `QueryResults` provides additional methods for further filtering or
   * transformation of the returned entities.
   *
   * @throws {UnknownComponentError} if any component queried is not registered.
   */
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

  /**
   * Constructs a `QueryResults` iterator pre-seeded with a specific list
   * of entities.
   */
  with(entities: Entity[]): QueryResults<[typeof ENTITY]> {
    return new QueryResults(this, function* () {
      for (const entity of entities) {
        yield [entity, [entity]];
      }
    });
  }

  /**
   * Takes a snapshot of this world as a JSON-serializable object.
   *
   * The snapshot contains all resources and components as serialized by the
   * resource or component class's static `dehydrate` method.
   *
   * Resources or components without a `dehydrate` method defined, or for which
   * the `dehydrate` method returns `undefined` are excluded from the snapshot.
   */
  snapshot(purpose?: unknown): WorldSnapshot {
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
        const dehydrated = componentClass.dehydrate?.(component, purpose);
        if (!dehydrated) continue;
        const components = snapshot.entities[entity] ?? {};
        components[componentClass.name] = structuredClone(dehydrated);
        snapshot.entities[entity] = components;
      }
    }

    for (const [resourceClass, resource] of this.#resources) {
      const dehydrated = resourceClass.dehydrate?.(resource, purpose);
      if (!dehydrated) continue;
      snapshot.resources[resourceClass.name] = structuredClone(dehydrated);
    }

    return snapshot;
  }

  /**
   * Restores a previously created snapshot into this world.
   *
   * The resources contained within the snapshot are rehydrated according to the
   * `rehydrate` methods of the registered resource classes by the same names.
   * Resource classes without a `rehydrate` method or for which the `rehydrate` method
   * returns `undefined` are skipped. The restored resource are merged with the other
   * resources that already exist in this world.
   *
   * The entities and components contained within the snapshot are rehydrated according
   * to the `rehydrate` methods of the registered component classes by the same names.
   * Component classes without a `rehydrate` method or for which the `rehydrate` method
   * returns `undefined` are skipped. Any entities existing in the world prior to
   * restoring are removed before the snapshot is restored.
   *
   * @throws {UnknownResourceError} if a named resource in the snapshot is not registered
   * @throws {UnknownComponentError} if a named component in the snapshot is not registered
   */
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
