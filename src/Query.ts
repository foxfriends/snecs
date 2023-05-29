import type { ComponentConstructor } from "./Component.js";
import type { Entity } from "./Entity.js";
import type { WorldView } from "./WorldView.js";

export const ENTITY = Symbol("Query:ENTITY");

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
    combiner: (query: QueryResult<Q>, world: WorldView) => R | undefined,
  ): {
    derived: true;
    query: Q;
    combiner: (query: QueryResult<Q>, world: WorldView) => R | undefined;
  } => ({
    derived: true,
    query,
    combiner,
  });
}

export type QueryElement =
  | ComponentConstructor<unknown>
  | typeof ENTITY
  | { optional: true; query: ComponentConstructor<unknown> }
  | {
      derived: true;
      query: Query;
      combiner: (query: QueryResult<unknown>, world: WorldView) => unknown;
    }
  | { not: true; query: ComponentConstructor<unknown> };
export type QueryElementResult<Q> = Q extends ComponentConstructor<infer C>
  ? C
  : Q extends {
      derived: true;
      query: Query;
      combiner: (
        query: QueryResult<unknown>,
        world: WorldView,
      ) => infer R | undefined;
    }
  ? R
  : Q extends { optional: true; query: infer Q2 }
  ? QueryElementResult<Q2> | undefined
  : Q extends typeof ENTITY
  ? Entity
  : never;

export type Query = readonly QueryElement[];
export type QueryResult<Q> = Q extends [infer QE, ...infer R]
  ? QE extends { not: true }
    ? QueryResult<R>
    : [QueryElementResult<QE>, ...QueryResult<R>]
  : Q extends []
  ? []
  : never;
