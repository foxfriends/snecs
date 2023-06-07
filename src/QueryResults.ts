import { Entity } from "./Entity.js";
import type { QueryResult, Query } from "./Query.js";
import type { WorldView } from "./WorldView.js";

export class QueryResults<Q> implements Iterable<QueryResult<Q>> {
  #source: () => Iterable<[Entity, QueryResult<Q>]>;
  #world: WorldView;

  constructor(world: WorldView, source: () => Iterable<[Entity, QueryResult<Q>]>) {
    this.#source = source;
    this.#world = world;
  }

  filter(predicate: (item: QueryResult<Q>) => boolean): QueryResults<Q> {
    const source = this.#source;
    return new QueryResults(this.#world, function* () {
      for (const [entity, item] of source()) {
        if (predicate(item)) yield [entity, item];
      }
    });
  }

  first(): QueryResult<Q> | undefined {
    const next = this.#source()[Symbol.iterator]().next();
    return !next.done ? next.value?.[1] : undefined;
  }

  count(): number {
    let n = 0;
    for (const _ of this.#source()) n += 1;
    return n;
  }

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
}
