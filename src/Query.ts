import type { ComponentConstructor } from "./Component.js";
import type { Entity } from "./Entity.js";
import type { EntityBuilder } from "./EntityBuilder.js";
import type { WorldView } from "./WorldView.js";

export const ENTITY = Symbol("Query:ENTITY");
export const ENTITY_BUILDER = Symbol("Query:ENTITY_BUILDER");

export function NOT<C>(query: C): {
  not: true;
  query: C;
} {
  return { not: true, query };
}

export function OPTIONAL<C>(query: C): {
  optional: true;
  query: C;
} {
  return { optional: true, query };
}

export function DERIVED<Q extends Query>(...query: Q) {
  return <R>(
    combiner: (query: QueryResult<Q>, world: WorldView) => R,
  ): {
    derived: true;
    query: Q;
    combiner: (query: QueryResult<Q>, world: WorldView) => R;
  } => ({
    derived: true,
    query,
    combiner,
  });
}

export type InfallibleQueryElement =
  | typeof ENTITY
  | typeof ENTITY_BUILDER
  | { optional: true; query: unknown }
  | {
      derived: true;
      query: InfallibleQuery;
      combiner: (query: QueryResult<unknown>, world: WorldView) => Exclude<unknown, undefined>;
    };

export type QueryElement =
  | ComponentConstructor<unknown>
  | InfallibleQueryElement
  | {
      derived: true;
      query: Query;
      combiner: (query: QueryResult<unknown>, world: WorldView) => unknown;
    }
  | { not: true; query: unknown };
export type QueryElementResult<Q> = Q extends ComponentConstructor<infer C>
  ? C
  : Q extends {
      derived: true;
      query: Query;
      combiner: (query: QueryResult<unknown>, world: WorldView) => infer R;
    }
  ? Exclude<R, undefined>
  : Q extends { optional: true; query: infer Q2 }
  ? QueryElementResult<Q2> | undefined
  : Q extends typeof ENTITY
  ? Entity
  : Q extends typeof ENTITY_BUILDER
  ? EntityBuilder
  : never;

export type Query = readonly QueryElement[];
export type InfallibleQuery = readonly InfallibleQueryElement[];
export type QueryResult<Q> = Q extends [infer QE, ...infer R]
  ? QE extends { not: true }
    ? QueryResult<R>
    : [QueryElementResult<QE>, ...QueryResult<R>]
  : Q extends []
  ? []
  : never;
