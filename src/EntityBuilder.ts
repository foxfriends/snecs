import type { Component, ComponentConstructor } from "./Component.js";
import type { WorldView } from "./WorldView.js";

export class EntityBuilder {
  constructor(public entity: number, private world: WorldView) {}

  addComponent<T extends Component>(component: T) {
    this.world.addComponent(this.entity, component);
    return this;
  }

  getComponent<T extends Component>(component: T["constructor"]) {
    return this.world.getComponent(this.entity, component as ComponentConstructor<T>);
  }

  removeComponent<T extends Component>(component: T["constructor"]) {
    return this.world.removeComponent(this.entity, component as ComponentConstructor<T>);
  }
}
