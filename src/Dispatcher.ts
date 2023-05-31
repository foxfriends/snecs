import type { System } from "./System.js";
import type { WorldView } from "./WorldView.js";

export class Dispatcher {
  #systems: System[] = [];

  addSystem(system: System) {
    this.#systems.push(system);
    return this;
  }

  run(world: WorldView) {
    this.#systems.forEach((system) => system(world));
  }
}
