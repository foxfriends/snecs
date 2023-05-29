import type { System } from "./System.js";
import type { World } from "./World.js";

export class Dispatcher {
  #systems: System[] = [];

  addSystem(system: System) {
    this.#systems.push(system);
    return this;
  }

  run(world: World) {
    this.#systems.forEach((system) => system(world));
  }
}
