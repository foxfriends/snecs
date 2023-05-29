import { WorldView } from "./WorldView.js";

export type System = (this: void, world: WorldView) => void;
