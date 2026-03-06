export type DiagramMode = "exam" | "field";

export type DeviceKind =
  | "power"
  | "joint"
  | "switch_single"
  | "switch_3way"
  | "switch_4way"
  | "light"
  | "outlet"
  | "outlet_e"
  | "fan"
  | "earth";

export type InputDevice = {
  id: string;
  kind: DeviceKind;
  name: string;
  controlId?: number;
  position?: number;
};

export type Point = {
  x: number;
  y: number;
};

export type DiagramDevice = {
  id: string;
  kind: DeviceKind;
  label: string;
  x: number;
  y: number;
  meta?: Record<string, unknown>;
};

export type ConductorType = "L" | "N" | "R" | "T1" | "T2" | "E";

export type DiagramWire = {
  id: string;
  conductor: ConductorType;
  points: Point[];
};

export type DiagramJoint = {
  id: string;
  x: number;
  y: number;
  sleeveInfo?: string[];
};

export type CircuitGroup = {
  controlId: number;
  controlLabel: string;
  templateId: "single_switch_1light" | "three_way_1light";
  devices: InputDevice[];
};

export type GeneratedDiagram = {
  mode: DiagramMode;
  groups: CircuitGroup[];
  devices: DiagramDevice[];
  wires: DiagramWire[];
  joints: DiagramJoint[];
  warnings: string[];
};

export type SleeveJudgeInput = {
  wire16Count: number;
  wire20Count: number;
  wire26Count: number;
};

export type SleeveJudgeResult = {
  error: boolean;
  sleeveSize?: "small" | "medium" | "large";
  mark?: "○" | "小" | "中" | "大";
  display?: string;
  reason?: string;
  message?: string;
};
