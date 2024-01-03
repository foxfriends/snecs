import test from "ava";
import { World } from "./World.js";
import { ENTITY, OPTIONAL } from "./Query.js";
import { ComponentConstructor, JsonSerializableComponent } from "./Component.js";
import { JsonSerializableResource } from "./Resource.js";

class A extends JsonSerializableComponent {
  constructor(public a = 5) {
    super();
  }
}
class B extends JsonSerializableComponent {}
class C extends JsonSerializableComponent {}

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
  class Resource extends JsonSerializableResource {
    constructor(public state = 5) {
      super();
    }
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

class SpecialComponent extends JsonSerializableComponent {
  static rehydrate(data: unknown) {
    if (data && typeof data === "object" && "a" in data && typeof data.a === "number") {
      return new SpecialComponent(data.a);
    }
  }

  constructor(public b: number) {
    super();
  }
}

test("restores components with specialized rehydrate functions", (t) => {
  const world = make().registerComponent(SpecialComponent);
  world.restore({
    resources: {},
    entities: {
      1: { SpecialComponent: { a: 1 } },
    },
  });
  t.deepEqual([...world.find(ENTITY, SpecialComponent)], [[1, new SpecialComponent(1)]]);
});

test("skips components rejected by the rehydrator", (t) => {
  const world = make().registerComponent(SpecialComponent);
  world.restore({
    resources: {},
    entities: {
      1: { SpecialComponent: { b: 1 } },
    },
  });
  t.deepEqual([...world.find(ENTITY, OPTIONAL(SpecialComponent))], [[1, undefined]]);
});

class SpecialResource extends JsonSerializableResource {
  static rehydrate(data: unknown): SpecialResource | undefined {
    if (data && typeof data === "object" && "a" in data && typeof data.a === "number") {
      return new SpecialResource(data.a);
    }
  }

  constructor(public b: number) {
    super();
  }
}

test("restores resources with specialized rehydrate functions", (t) => {
  const world = make().registerResource(SpecialResource);
  world.restore({
    resources: {
      SpecialResource: { a: 1 },
    },
    entities: {},
  });
  t.deepEqual(world.requireResource(SpecialResource), new SpecialResource(1));
});

test("skips resources rejected by the rehydrator", (t) => {
  const world = make().registerResource(SpecialResource);
  world.restore({
    resources: { SpecialResource: { b: 1 } },
    entities: {},
  });
  t.deepEqual(world.getResource(SpecialResource), undefined);
});
