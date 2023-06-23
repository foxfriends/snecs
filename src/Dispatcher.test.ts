import test from "ava";
import { spy } from "sinon";
import { Dispatcher } from "./Dispatcher";
import { World } from "./World";
import { WorldView } from "./WorldView";

test("runs all systems in order", (t) => {
  const spy1 = spy();
  const spy2 = spy();
  const world = new World();
  const dispatcher = new Dispatcher().addSystem(spy1).addSystem(spy2).run(world);
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
