import test from "ava";
import { spy } from "sinon";
import { Dispatcher } from "./Dispatcher";
import { World } from "./World";
import { WorldView } from "./WorldView";

test("runs all systems in order", (t) => {
  const spy1 = spy();
  const spy2 = spy();
  new Dispatcher().addSystem(spy1).addSystem(spy2).run(new World());
  t.assert(spy1.calledBefore(spy2));
});

test("calls each system with a view of the world", (t) => {
  t.plan(1);

  class TestSentinel {}
  const value = new TestSentinel();
  const world = new World().setResource(value);
  new Dispatcher()
    .addSystem((world: WorldView) => {
      const sentinel = world.getResource(TestSentinel);
      t.is(sentinel, value);
    })
    .run(world);
});

test("can be added to another dispatcher as a system", (t) => {
  const spy1 = spy();
  const subDispatcher = new Dispatcher().addSystem(spy1);
  new Dispatcher().addSystem(subDispatcher.asSystem()).run(new World());
  t.assert(spy1.calledOnce);
});

test("can be prepopulated with systems using of", (t) => {
  const spy1 = spy();
  const spy2 = spy();
  Dispatcher.of(spy1, spy2).run(new World());
  t.assert(spy1.calledBefore(spy2));
});
