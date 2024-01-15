import { System } from "./System";
import { Tracer } from "./Tracer";
import type { WorldView } from "./WorldView";

export type Next<B> = (context: B) => void;
export type MiddlewareFunction<A, B> = (
  this: void,
  world: WorldView,
  next: Next<B>,
  context: A,
) => void;

type MiddlewareLike<A, B> = MiddlewareFunction<A, B> | MiddlewareSystem<A, B>;

export abstract class MiddlewareSystem<A, B> extends System {
  abstract runAsMiddleware(world: WorldView, next: Next<B>, context: A): void;
}

export class PipedSystem<A, B> extends MiddlewareSystem<A, B> {
  constructor(public chain: MiddlewareLike<unknown, unknown>[]) {
    super();
  }

  /**
   * Runs this composed system on the world.
   */
  run(world: WorldView) {
    // This function should only be called when A is undefined, so...
    this.runAsMiddleware(world, () => {}, undefined as A);
  }

  /**
   * Runs this composed system as a middleware. A middleware receives some context,
   * passed from the previous middleware, and may trigger the next middleware by
   * calling the `next` function with some new context.
   *
   * The first middleware in a chain receives no context. The last middleware in
   * a chain should not call `next`.
   */
  runAsMiddleware(world: WorldView, next: Next<B>, context: A) {
    const start = Array.from(this.chain)
      .reverse()
      .reduce((next: Next<unknown>, system: MiddlewareLike<unknown, unknown>) => {
        return (context: unknown) => {
          const name =
            system instanceof System ? system.displayName ?? system.constructor.name : system.name;
          const tracer = world.getResource(Tracer);
          const child = tracer?.child(name);
          if (child) world.setResource(child);
          try {
            return typeof system === "function"
              ? system(world, next, context)
              : system.runAsMiddleware(world, next, context);
          } finally {
            child?.done();
            if (tracer) world.setResource(tracer);
          }
        };
      }, next as Next<unknown>);
    start(context);
  }

  /**
   * Sets the display name of this system, used in some debug representations.
   */
  displayAs(name: string) {
    this.displayName = name;
    return this;
  }
}

/**
 * Composes multiple middlewares-style systems into a single system, where each middleware
 * may optionally trigger the rest of the chain any number of times, on some input parameters.
 *
 * If you need this feature, you will know. Most of the time, you do not.
 */
export function pipe<A, B, C, D, E>(
  a: MiddlewareLike<A, B>,
  b: MiddlewareLike<B, C>,
  c: MiddlewareLike<C, D>,
  d: MiddlewareLike<D, E>,
): PipedSystem<A, E>;
export function pipe<A, B, C, D>(
  a: MiddlewareLike<A, B>,
  b: MiddlewareLike<B, C>,
  c: MiddlewareLike<C, D>,
): PipedSystem<A, D>;
export function pipe<A, B, C>(a: MiddlewareLike<A, B>, b: MiddlewareLike<B, C>): PipedSystem<A, C>;
export function pipe(...chain: MiddlewareLike<unknown, unknown>[]) {
  return new PipedSystem(chain);
}
