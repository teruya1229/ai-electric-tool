import type { InputDevice } from "./types";

export const sampleSingle: InputDevice[] = [
  { id: "power", kind: "power", name: "電源" },
  { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
  { id: "light1", kind: "light", name: "R1", controlId: 1 },
];

export const sampleThreeWay: InputDevice[] = [
  { id: "power", kind: "power", name: "電源" },
  { id: "sw1", kind: "switch_3way", name: "SW1", controlId: 1, position: 1 },
  { id: "sw2", kind: "switch_3way", name: "SW2", controlId: 1, position: 2 },
  { id: "light1", kind: "light", name: "R1", controlId: 1 },
];
