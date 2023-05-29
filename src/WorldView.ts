import type { Component, ComponentConstructor } from "./Component.js";
import type { Entity } from "./Entity.js";
import type { ENTITY, Query, QueryResult } from "./Query.js";
import type { QueryResults } from "./QueryResults.js";
import type { Resource, ResourceConstructor } from "./Resource.js";

export interface WorldView {
  entities(): readonly Entity[];
  createEntity(): Entity;
  destroyEntity(entity: Entity): void;

  with(entities: Entity[]): QueryResults<[typeof ENTITY]>;
  find<Q extends Query>(...query: Q): QueryResults<Q>;
  query<Q extends Query>(
    entity: Entity,
    ...query: Q
  ): QueryResult<Q> | undefined;

  getComponent<T>(
    entity: Entity,
    component: ComponentConstructor<T>,
  ): T | undefined;
  addComponent<T extends Component>(entity: Entity, component: T): void;
  removeComponent<T>(entity: Entity, component: ComponentConstructor<T>): void;

  setResource<T extends Resource>(resource: T): void;
  getResource<T>(resource: ResourceConstructor<T>): T | undefined;
  requireResource<T>(resource: ResourceConstructor<T>): T;
}
