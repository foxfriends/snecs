import test from "ava";
import { World } from "./World.js";
import { ENTITY, OPTIONAL } from "./Query.js";
import { ComponentConstructor } from "./Component.js";

class A {
  constructor(public a = 5) {}
}
class B {}
class C {}

function make(components: ComponentConstructor<unknown>[] = [A, B, C]) {
  return components.reduce((w, c) => w.registerComponent(c), new World());
}

test("revives all entities with their components", (t) => {
  const world = make();
  world.restore({
    resources: {},
    entities: {
      1: { A: { a: 3 } },
      2: { A: { a: 4 } },
    },
  });
  t.deepEqual(world.getComponent(1, A), new A(3));
  t.deepEqual(world.getComponent(2, A), new A(4));
});

test("throws away any existing entities", (t) => {
  const world = make();
  world.buildEntity().addComponent(new A(1));
  world.buildEntity().addComponent(new A(2));
  world.restore({
    resources: {},
    entities: {
      1: { A: { a: 3 } },
    },
  });
  t.deepEqual([...world.find(ENTITY, A)], [[1, new A(3)]]);
});

test("revives all resources with their values", (t) => {
  class Resource {
    static readonly serializable = true;
    constructor(public state = 5) {}
  }

  const world = make().setResource(new Resource());
  world.restore({
    resources: {
      Resource: { state: 4 },
    },
    entities: {},
  });
  t.deepEqual(world.getResource(Resource), new Resource(4));
});

test("correctly handles skipped entity IDs", (t) => {
  const world = make();
  world.restore({
    resources: {},
    entities: {
      1: { A: { a: 3 }, B: {} },
      4: { A: { a: 4 } },
    },
  });
  t.deepEqual([...world.find(ENTITY)], [[1], [4]]);
});

class Special {
  static rehydrate(data: unknown) {
    if (data && typeof data === "object" && "a" in data && typeof data.a === "number") {
      return new Special(data.a);
    }
  }

  constructor(public b: number) {}
}

test("restores components with specialized rehydrate functions", (t) => {
  const world = make().registerComponent(Special);
  world.restore({
    resources: {},
    entities: {
      1: { Special: { a: 1 } },
    },
  });
  t.deepEqual([...world.find(ENTITY, Special)], [[1, new Special(1)]]);
});

test("skips components rejected by the rehydrator", (t) => {
  const world = make().registerComponent(Special);
  world.restore({
    resources: {},
    entities: {
      1: { Special: { b: 1 } },
    },
  });
  t.deepEqual([...world.find(ENTITY, OPTIONAL(Special))], [[1, undefined]]);
});
