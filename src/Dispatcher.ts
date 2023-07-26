import { System, SystemFunction } from "./System.js";
import { Tracer } from "./Tracer.js";
import type { WorldView } from "./WorldView.js";

type SystemLike = SystemFunction | System;

export class Dispatcher extends System {
  static of(...systems: SystemLike[]) {
    return systems.reduce(
      (dispatcher: Dispatcher, system) => dispatcher.addSystem(system),
      new Dispatcher(),
    );
  }

  #systems: SystemLike[] = [];
  #diagnostics: Map<SystemLike, bigint> = new Map();

  addSystem(system: SystemLike) {
    this.#systems.push(system);
    return this;
  }

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

  displayAs(name: string) {
    this.displayName = name;
    return this;
  }
}
