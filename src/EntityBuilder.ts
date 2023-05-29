import { Component } from "./Component.js";
import type { World } from "./World.js";

export class EntityBuilder {
  constructor(public entity: number, private world: World) {}

  addComponent<T extends Component>(component: T) {
    this.world.addComponent(this.entity, component);
    return this;
  }
}
