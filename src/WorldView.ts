import type { Component, ComponentConstructor } from "./Component.js";
import type { Entity } from "./Entity.js";
import type { ENTITY, InfallibleQuery, Query, QueryResult } from "./Query.js";
import type { QueryResults } from "./QueryResults.js";
import type { Resource, ResourceConstructor } from "./Resource.js";

/**
 * A view into the world, which is available to systems.
 */
export interface WorldView {
  /**
   * The list of entities currently existing in this world.
   */
  entities(): readonly Entity[];

  /**
   * Creates a new entity in this world. The created entity has no
   * components.
   */
  createEntity(): Entity;

  /**
   * Removes an entity and all its components from the world
   */
  destroyEntity(entity: Entity): void;

  /**
   * Constructs a `QueryResults` iterator pre-seeded with a specific list
   * of entities.
   */
  with(entities: Entity[]): QueryResults<[typeof ENTITY]>;

  /**
   * Finds all entities which satisfy a given query, returning them as a `QueryResults`
   * iterator. The `QueryResults` provides additional methods for further filtering or
   * transformation of the returned entities.
   *
   * @throws {UnknownComponentError} if any component queried is not registered.
   */
  find<Q extends Query>(...query: Q): QueryResults<Q>;

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

  /**
   * Retrieves the component of the given type from an entity.
   *
   * Returns `undefined` if the entity does not have this component.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  getComponent<T>(entity: Entity, component: ComponentConstructor<T>): T | undefined;
  /**
   * Retrieves the component of the given type from an entity.
   *
   * @throws {TypeError} if the entity does not have this component
   * @throws {UnknownComponentError} if the component type is not registered
   */
  requireComponent<T>(entity: Entity, component: ComponentConstructor<T>): T;
  /**
   * Adds a component for an entity.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  addComponent<T extends Component>(entity: Entity, component: T): void;
  /**
   * Removes the component of the given type from an entity.
   *
   * @throws {UnknownComponentError} if the component type is not registered
   */
  removeComponent<T>(entity: Entity, component: ComponentConstructor<T>): void;

  /**
   * Sets a resource for this world. This will replace any existing resource
   * of the same type.
   *
   * Resources set this way will automatically be registered.
   */
  setResource<T extends Resource>(resource: T): void;

  /**
   * Gets the resource from the world by its resource type.
   *
   * Returns `undefined` if the resource is not set or not registered.
   */
  getResource<T>(resource: ResourceConstructor<T>): T | undefined;

  /**
   * Gets the resource from the world by its resource type.
   *
   * @throws {TypeError} if the resource is not set.
   */
  requireResource<T>(resource: ResourceConstructor<T>): T;

  /**
   * Removes a resource from the world. The resource type remains registered.
   */
  removeResource<T>(resource: ResourceConstructor<T>): void;
}
