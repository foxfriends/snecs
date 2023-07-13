import test from "ava";
import { World } from "./World.js";
import { ENTITY, OPTIONAL } from ".";
import { DERIVED, ENTITY_BUILDER } from "./Query";

test("can query a component", (t) => {
  class Component {}
  const world = new World().registerComponent(Component);
  const entity = world.buildEntity().addComponent(new Component()).entity;
  t.deepEqual(world.query(entity, Component), [new Component()]);
});

test("fails the query if any component is missing", (t) => {
  class Component {}
  class Component2 {}
  const world = new World().registerComponent(Component).registerComponent(Component2);
  const entity = world.buildEntity().addComponent(new Component()).entity;
  t.deepEqual(world.query(entity, Component, Component2), undefined);
});

test("can query for ENTITY", (t) => {
  const world = new World();
  const entity = world.createEntity();
  t.deepEqual(world.query(entity, ENTITY), [entity]);
});

test("can query for ENTITY_BUILDER", (t) => {
  const world = new World();
  const builder = world.buildEntity();
  t.deepEqual(world.query(builder.entity, ENTITY_BUILDER), [builder]);
});

test("can query for DERIVED", (t) => {
  class Component {
    constructor(public value: number) {}
  }
  const world = new World().registerComponent(Component);
  const queryable = DERIVED(Component)(([comp]) => comp.value + 1);
  const entity = world.buildEntity().addComponent(new Component(3)).entity;
  t.deepEqual(world.query(entity, queryable), [4]);
});

test("can query for DERIVED that rejects after finding components", (t) => {
  class Component {
    constructor(public value: number) {}
  }
  const world = new World().registerComponent(Component);
  const queryable = DERIVED(Component)(([comp]) => (comp.value === 3 ? undefined : comp.value));
  const entity = world.buildEntity().addComponent(new Component(3)).entity;
  const query = world.query(entity, queryable);
  t.deepEqual(query, undefined);
});

test("type-checker correctly detects that infallible queries are infallible", (t) => {
  class Component {}
  const world = new World().registerComponent(Component);
  const entity = world.createEntity();
  const derived = DERIVED(ENTITY)(([e]) => e);
  const query = world.query(entity, OPTIONAL(Component), ENTITY, derived);
  // Not really a good way to check compile time stuff, except to note
  // that this function does compile as intended.
  t.assert(query.length === 3);
});
