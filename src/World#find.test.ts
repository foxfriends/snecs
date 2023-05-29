import test from "ava";
import { World } from "./World.js";
import { DERIVED, ENTITY, NOT, OPTIONAL } from "./Query.js";
import { ComponentConstructor } from "./Component.js";

class A {}
class B {}
class C {}

function make(components: ComponentConstructor<unknown>[] = [A, B, C]) {
  return components.reduce((w, c) => w.registerComponent(c), new World());
}

test("queries all entities matching components, returning those components", (t) => {
  const world = make();
  const aba = new A();
  const caa = new A();
  world.buildEntity().addComponent(aba).addComponent(new B());
  world.buildEntity().addComponent(new B()).addComponent(new C());
  world.buildEntity().addComponent(new C()).addComponent(caa);

  t.deepEqual([...world.find(A)], [[aba], [caa]]);
});

test("queries all entities with all matching components", (t) => {
  const world = make();
  world.buildEntity().addComponent(new A()).addComponent(new B());
  world.buildEntity().addComponent(new B()).addComponent(new C());
  const cac = new C();
  const caa = new A();
  world.buildEntity().addComponent(cac).addComponent(caa);

  t.deepEqual([...world.find(A, C)], [[caa, cac]]);
});

test("queries for the entity ID with ENTITY", (t) => {
  const world = make();
  const aba = new A();
  const caa = new A();
  const ab = world.buildEntity().addComponent(aba).addComponent(new B()).entity;
  world.buildEntity().addComponent(new B()).addComponent(new C());
  const ca = world.buildEntity().addComponent(new C()).addComponent(caa).entity;

  t.deepEqual(
    [...world.find(ENTITY, A)],
    [
      [ab, aba],
      [ca, caa],
    ],
  );
});

test("queries for entities without a component with NOT", (t) => {
  const world = make();
  world.buildEntity().addComponent(new A()).addComponent(new B());
  const bc = world
    .buildEntity()
    .addComponent(new B())
    .addComponent(new C()).entity;
  world.buildEntity().addComponent(new C()).addComponent(new A());
  t.deepEqual([...world.find(ENTITY, NOT(A))], [[bc]]);
});

test("queries for entities, including missing components with OPTIONAL", (t) => {
  const world = make();
  const aba = new A();
  const ab = world.buildEntity().addComponent(aba).addComponent(new B()).entity;
  const bc = world
    .buildEntity()
    .addComponent(new B())
    .addComponent(new C()).entity;
  world.buildEntity().addComponent(new C()).addComponent(new A());

  const results = [...world.find(ENTITY, B, OPTIONAL(A))];
  t.is(results.length, 2);
  t.is(results[0][0], ab);
  t.is(results[0][2], aba);
  t.is(results[1][0], bc);
  t.is(results[1][2], undefined);
});

test("supports DERIVED for compartmentalizing common queries", (t) => {
  const world = make();
  const AB = DERIVED(A, B)(([a, b]) => [a, b]);
  world.buildEntity().addComponent(new A()).addComponent(new B());
  world.buildEntity().addComponent(new B()).addComponent(new C());
  world.buildEntity().addComponent(new C()).addComponent(new A());

  t.deepEqual([...world.find(AB)], [[[new A(), new B()]]]);
});
