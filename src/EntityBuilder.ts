import type { Component, ComponentConstructor } from "./Component.js";
import type { WorldView } from "./WorldView.js";

/**
 * Provides a convenient interface to work with the components of an entity.
 */
export class EntityBuilder {
  /**
   * @param entity The entity to manage
   * @param world The world in which this entity exists
   */
  constructor(public entity: number, private world: WorldView) {}

  /**
   * Adds a component to this entity. If the entity already has a component of
   * this type, it will be replaced and tbe previous value discarded.
   *
   * @returns {this} the EntityBuilder instance for convenient chaining.
   */
  addComponent<T extends Component>(component: T) {
    this.world.addComponent(this.entity, component);
    return this;
  }

  /**
   * Retreives the component instance of a given type associated with this entity.
   * Returns undefined if there is none set.
   */
  getComponent<T extends Component>(component: T["constructor"]) {
    return this.world.getComponent(this.entity, component as ComponentConstructor<T>);
  }

  /**
   * Removes the component instance of a given type from this entity
   *
   * @returns {this} the EntityBuilder instance for convenient chaining.
   */
  removeComponent<T extends Component>(component: T["constructor"]) {
    this.world.removeComponent(this.entity, component as ComponentConstructor<T>);
    return this;
  }
}
