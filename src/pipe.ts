import type { WorldView } from "./WorldView";

export type Next<B> = (context: B) => void;
export type Middleware<A, B> = (this: void, world: WorldView, next: Next<B>, context: A) => void;

export function pipe<A, B, C, D, E>(
  a: Middleware<A, B>,
  b: Middleware<B, C>,
  c: Middleware<C, D>,
  d: Middleware<D, E>,
): Middleware<A, E>;
export function pipe<A, B, C, D>(
  a: Middleware<A, B>,
  b: Middleware<B, C>,
  c: Middleware<C, D>,
): Middleware<A, D>;
export function pipe<A, B, C>(a: Middleware<A, B>, b: Middleware<B, C>): Middleware<A, C>;
export function pipe(...chain: Middleware<unknown, unknown>[]) {
  return (world: WorldView, next: Next<unknown> = () => {}, context: unknown = undefined) => {
    const start = Array.from(chain)
      .reverse()
      .reduce((next: Next<unknown>, system: Middleware<unknown, unknown>) => {
        return (context: unknown) => system(world, next, context);
      }, next);
    start(context);
  };
}
