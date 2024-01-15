import { WorldView } from "./WorldView.js";

/**
 * A function which is used as a system.
 *
 * @param world The world this system is to act on.
 */
export type SystemFunction = (this: void, world: WorldView) => void;

/**
 * A class of whose instances are used as systems.
 */
export abstract class System {
  displayName?: string;

  /**
   * Runs the system on the provided world
   */
  abstract run(world: WorldView): void;
}
