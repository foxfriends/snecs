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

  run(world: WorldView) {
    // This function should only be called when A is undefined, so...
    this.runAsMiddleware(world, () => {}, undefined as A);
  }

  runAsMiddleware(world: WorldView, next: Next<B>, context: A) {
    const start = Array.from(this.chain)
      .reverse()
      .reduce((next: Next<unknown>, system: MiddlewareLike<unknown, unknown>) => {
        return (context: unknown) => {
          const name = system instanceof System ? system.constructor.name : system.name;
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

  displayAs(name: string) {
    this.displayName = name;
    return this;
  }
}

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
