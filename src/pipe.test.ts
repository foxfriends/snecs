import test from "ava";
import { spy } from "sinon";
import { Next, pipe } from "./pipe";
import { World } from "./World";
import { Dispatcher, System } from ".";

test("connects systems in first-to-last order", (t) => {
  const spy1 = spy();
  const spy2 = spy();
  const spy3 = spy();
  const system = pipe(
    (_world, next: Next<void>, _context) => {
      spy1();
      next();
    },
    (_world, next: Next<void>, _context) => {
      spy2();
      next();
    },
    (_world, next: Next<void>, _context) => {
      spy3();
      next();
    },
  ) as System;

  system(new World());

  t.assert(spy1.calledBefore(spy2));
  t.assert(spy2.calledBefore(spy3));
});

test("passes the context along to the next in chain", (t) => {
  t.plan(1);
  const system = pipe(
    (_world, next: Next<number>, _context) => next(3),
    (_world, _next, context) => t.is(context, 3),
  ) as System;
  system(new World());
});

test("does not call the next in chain if `next` is not called", (t) => {
  const spy1 = spy();
  const system = pipe((_world, _next, _context) => {}, spy1) as System;
  system(new World());
  t.assert(spy1.notCalled);
});

test("allows calling the rest of the chain multiple times, with different context", (t) => {
  const spy1 = spy();
  const system = pipe(
    (_world, next: Next<number>, _context) => {
      next(3);
      next(4);
    },
    (_world, _next, context) => void spy1(context),
  ) as System;
  system(new World());
  t.assert(spy1.calledWith(3));
  t.assert(spy1.calledWith(4));
});

test("works as a system in the dispatcher", (t) => {
  t.plan(1);
  class Expected {
    constructor(public expected: number) {}
  }
  const system = pipe(
    (_world, next, _context) => {
      next(3);
    },
    (world, _next, context) => {
      const { expected } = world.requireResource(Expected);
      t.is(context, expected);
    },
  );
  new Dispatcher().addSystem(system).run(new World().setResource(new Expected(3)));
});
