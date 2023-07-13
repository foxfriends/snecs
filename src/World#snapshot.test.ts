import test from "ava";
import { World } from "./World.js";
import { ComponentConstructor } from "./Component.js";

class A {}
class B {}
class C {}

function make(components: ComponentConstructor<unknown>[] = [A, B, C]) {
  return components.reduce((w, c) => w.registerComponent(c), new World());
}

test("includes all the entities", (t) => {
  const world = make();
  world.buildEntity().addComponent(new A()).addComponent(new B());
  world.buildEntity().addComponent(new B()).addComponent(new C());
  world.buildEntity().addComponent(new C()).addComponent(new A());
  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {
      1: { A: {}, B: {} },
      2: { B: {}, C: {} },
      3: { C: {}, A: {} },
    },
  });
});

test("includes all the serializable resources", (t) => {
  class Serializable {
    static readonly serialize = true;
  }

  const world = make().setResource(new Serializable());
  t.deepEqual(world.snapshot(), {
    resources: {
      Serializable: {},
    },
    entities: {},
  });
});

test("serializes resources according to their defined dehydrate function", (t) => {
  class Serializable {
    static readonly serialize = true;
    static dehydrate(data: Serializable) {
      return { ok: true, data };
    }
  }

  const world = make().setResource(new Serializable());
  t.deepEqual(world.snapshot(), {
    resources: {
      Serializable: { ok: true, data: {} },
    },
    entities: {},
  });
});

test("skips non-serializable resources", (t) => {
  class Serializable {
    static readonly serialize = false;
  }

  const world = make().setResource(new Serializable());
  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {},
  });
});

test("skips non-serializable components", (t) => {
  class NonSerializable {
    static readonly skipSerialization = true;
  }

  const world = make().registerComponent(NonSerializable);
  world.buildEntity().addComponent(new NonSerializable()).addComponent(new A());
  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {
      1: { A: {} },
    },
  });
});

test("serializes components according to their defined dehydrate function", (t) => {
  class Serializable {
    static dehydrate(component: Serializable) {
      return { ok: true, component };
    }
  }

  const world = make().registerComponent(Serializable);
  world.buildEntity().addComponent(new Serializable());
  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {
      1: { Serializable: { ok: true, component: {} } },
    },
  });
});

test("includes empty entities", (t) => {
  const world = make();
  world.createEntity();
  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {
      1: {},
    },
  });
});

test("skips destroyed entities", (t) => {
  const world = make();
  const entity = world.createEntity();
  world.createEntity();
  world.destroyEntity(entity);

  t.deepEqual(world.snapshot(), {
    resources: {},
    entities: {
      2: {},
    },
  });
});
