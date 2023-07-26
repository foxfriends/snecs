import { WorldView } from "./WorldView.js";

export type SystemFunction = (this: void, world: WorldView) => void;

export abstract class System {
  displayName?: string;
  abstract run(world: WorldView): void;
}
