import { System, SystemFunction } from "./System.js";
import { Tracer } from "./Tracer.js";
import type { WorldView } from "./WorldView.js";

type SystemLike = SystemFunction | System;

/**
 * A Dispatcher composes systems such that they can be run on a `World`.
 */
export class Dispatcher extends System {
  /**
   * Creates a dispatcher from a predetermined list of systems.
   */
  static of(...systems: SystemLike[]) {
    return systems.reduce(
      (dispatcher: Dispatcher, system) => dispatcher.addSystem(system),
      new Dispatcher(),
    );
  }

  #systems: SystemLike[] = [];
  #diagnostics: Map<SystemLike, bigint> = new Map();

  /**
   * Add a system to this dispatcher. When this dispatcher is run, systems are executed in
   * the order they were originally added.
   *
   * @param system The system to add.
   *
   * @returns {this} the Dispatcher instance for easy chaining.
   */
  addSystem(system: SystemLike) {
    this.#systems.push(system);
    return this;
  }

  /**
   * Runs the systems contained in this dispatcher on the entities, components, and
   * resources contained within the World.
   *
   * @param world The world to run this dispatcher on
   */
  run(world: WorldView) {
    this.#systems.forEach((system) => {
      const name =
        system instanceof System ? system.displayName ?? system.constructor.name : system.name;
      const tracer = world.getResource(Tracer);
      const child = tracer?.child(name);
      if (child) world.setResource(child);
      try {
        if (system instanceof System) {
          system.run(world);
        } else {
          system(world);
        }
      } finally {
        child?.done();
        if (tracer) world.setResource(tracer);
      }
    });
  }

  /**
   * Sets the display name of this dispatcher, used in some debug representations.
   */
  displayAs(name: string) {
    this.displayName = name;
    return this;
  }
}
