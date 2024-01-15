import { Entity } from "./Entity.js";
import type { QueryResult, Query } from "./Query.js";
import type { WorldView } from "./WorldView.js";

/**
 * An iterator over the results of a query, allowing for the query to be lazily composed
 * before being iterated.
 */
export class QueryResults<Q> implements Iterable<QueryResult<Q>> {
  #source: () => Iterable<[Entity, QueryResult<Q>]>;
  #world: WorldView;

  constructor(world: WorldView, source: () => Iterable<[Entity, QueryResult<Q>]>) {
    this.#source = source;
    this.#world = world;
  }

  /**
   * Filter the entities yielded by this query. Entities for which the predicate
   * returns false are skipped.
   */
  filter(predicate: (item: QueryResult<Q>) => boolean): QueryResults<Q> {
    const source = this.#source;
    return new QueryResults(this.#world, function* () {
      for (const [entity, item] of source()) {
        if (predicate(item)) yield [entity, item];
      }
    });
  }

  /**
   * Concatenates two `QueryResults` into one, yielding all elements of the first,
   * followed by all elements of the second.
   *
   * Duplciate elements yielded by both queries will be yielded more than once, be
   * careful that the queries are disjoint if duplicates are not expected.
   */
  chain<Q2 extends Query>(second: QueryResults<Q2>): QueryResults<Q | Q2> {
    const source = this.#source;
    return new QueryResults<Q | Q2>(this.#world, function* () {
      yield* source();
      yield* second.#source();
    });
  }

  /**
   * Executes this query, returning the first element or `undefined` if
   * this query finds no elements. The rest of the elements are ignored.
   */
  first(): QueryResult<Q> | undefined {
    const next = this.#source()[Symbol.iterator]().next();
    return !next.done ? next.value?.[1] : undefined;
  }

  /**
   * Counts how many elements are yielded by this query, discarding the elements
   * themselves.
   *
   * This is the same as `.collect().length` but potentially more efficient, at
   * the tradeoff that the elements are not usable.
   */
  count(): number {
    let n = 0;
    for (const _ of this.#source()) n += 1;
    return n;
  }

  /**
   * For each element in the current set of results, apply a new query. Elements
   * for which the new query is not successful are removed. Successfully queried
   * elements are returned as the new results.
   */
  select<Q2 extends Query>(...query: Q2): QueryResults<Q2> {
    const source = this.#source;
    const world = this.#world;
    return new QueryResults(this.#world, function* () {
      for (const [entity] of source()) {
        const replacement = world.query(entity, ...query);
        if (replacement === undefined) continue;
        yield [entity, replacement];
      }
    });
  }

  *[Symbol.iterator]() {
    for (const [, item] of this.#source()) {
      yield item;
    }
  }

  /**
   * Eagerly collect the results of this query into a standard array.
   */
  collect() {
    return Array.from(this);
  }
}
