import type { System } from "./System.js";
import type { WorldView } from "./WorldView.js";
import type { Middleware } from "./pipe.js";

export class Dispatcher {
  #systems: System[] = [];

  addSystem(system: System | Middleware<void, unknown>) {
    this.#systems.push(system as System);
    return this;
  }

  run(world: WorldView) {
    this.#systems.forEach((system) => system(world));
  }
}
