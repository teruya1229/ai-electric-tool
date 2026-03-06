import { groupDevicesByControlWithWarnings } from "./groupDevicesByControl";
import { judgeSleeve } from "./judgeSleeve";
import type {
  ConductorType,
  DiagramDevice,
  DiagramJoint,
  DiagramMode,
  DiagramWire,
  GeneratedDiagram,
  InputDevice,
} from "./types";

export const WIRE_COLORS: Record<ConductorType, string> = {
  L: "#111111",
  N: "#1d4ed8",
  R: "#dc2626",
  T1: "#0ea5e9",
  T2: "#1e40af",
  E: "#16a34a",
};

const BUS_X_START = 60;
const BUS_X_END = 780;
const GROUP_HEIGHT = 220;
const BASE_Y = 40;

export function generateDiagram(devices: InputDevice[], mode: DiagramMode): GeneratedDiagram {
  const warnings: string[] = [];
  const diagramDevices: DiagramDevice[] = [];
  const wires: DiagramWire[] = [];
  const joints: DiagramJoint[] = [];

  if (!devices.some((d) => d.kind === "power")) {
    warnings.push("powerが見つかりません。仮の始点で描画します。");
  }

  const grouped = groupDevicesByControlWithWarnings(devices, mode);
  warnings.push(...grouped.warnings);

  let lightSerial = 1;

  grouped.groups.forEach((group, index) => {
    const offsetY = BASE_Y + index * GROUP_HEIGHT;
    const yL = offsetY + 20;
    const yN = offsetY + 150;
    const powerX = 90;
    const powerY = offsetY + 85;

    diagramDevices.push({ id: `power-${index}`, kind: "power", label: "電源", x: powerX, y: powerY });

    wires.push({
      id: `bus-l-${group.controlId}`,
      conductor: "L",
      points: [{ x: BUS_X_START, y: yL }, { x: BUS_X_END, y: yL }],
    });
    wires.push({
      id: `bus-n-${group.controlId}`,
      conductor: "N",
      points: [{ x: BUS_X_START, y: yN }, { x: BUS_X_END, y: yN }],
    });
    wires.push({
      id: `power-l-${group.controlId}`,
      conductor: "L",
      points: [{ x: powerX, y: powerY - 12 }, { x: powerX, y: yL }],
    });
    wires.push({
      id: `power-n-${group.controlId}`,
      conductor: "N",
      points: [{ x: powerX, y: powerY + 12 }, { x: powerX, y: yN }],
    });

    if (group.templateId === "single_switch_1light") {
      const swX = 320;
      const swY = offsetY + 120;
      const lightX = 620;
      const lightY = offsetY + 90;

      diagramDevices.push({ id: `sw-${group.controlId}`, kind: "switch_single", label: `SW（${group.controlLabel}）`, x: swX, y: swY });
      diagramDevices.push({ id: `light-${group.controlId}`, kind: "light", label: `R${lightSerial}（${group.controlLabel}）`, x: lightX, y: lightY });
      lightSerial += 1;

      wires.push({
        id: `l-sw-${group.controlId}`,
        conductor: "L",
        points: [{ x: swX, y: yL }, { x: swX, y: swY - 18 }],
      });
      wires.push({
        id: `r-light-${group.controlId}`,
        conductor: "R",
        points: [
          { x: swX, y: swY + 18 },
          { x: swX + 100, y: swY + 18 },
          { x: swX + 100, y: lightY },
          { x: lightX - 24, y: lightY },
        ],
      });
      wires.push({
        id: `n-light-${group.controlId}`,
        conductor: "N",
        points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }],
      });

      joints.push(makeJoint(`joint-l-${group.controlId}`, swX, yL, 2, 0, 0));
      joints.push(makeJoint(`joint-n-${group.controlId}`, lightX, yN, 2, 0, 0));
      return;
    }

    const sws = group.devices
      .filter((d) => d.kind === "switch_3way")
      .sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    if (sws.length !== 2) {
      warnings.push(`control=${group.controlLabel} の3路スイッチ数が不正です。`);
      return;
    }

    const sw1X = 280;
    const sw2X = 500;
    const swY = offsetY + 105;
    const lightX = 700;
    const lightY = offsetY + 85;

    diagramDevices.push({
      id: `sw1-${group.controlId}`,
      kind: "switch_3way",
      label: `SW（${group.controlLabel}）`,
      x: sw1X,
      y: swY,
      meta: { terminals: [0, 1, 3], position: sws[0].position ?? 1 },
    });
    diagramDevices.push({
      id: `sw2-${group.controlId}`,
      kind: "switch_3way",
      label: `SW（${group.controlLabel}）`,
      x: sw2X,
      y: swY,
      meta: { terminals: [0, 1, 3], position: sws[1].position ?? 2 },
    });
    diagramDevices.push({ id: `light-${group.controlId}`, kind: "light", label: `R${lightSerial}（${group.controlLabel}）`, x: lightX, y: lightY });
    lightSerial += 1;

    wires.push({ id: `l-sw1-${group.controlId}`, conductor: "L", points: [{ x: sw1X, y: yL }, { x: sw1X, y: swY - 24 }] });
    wires.push({ id: `t1-${group.controlId}`, conductor: "T1", points: [{ x: sw1X + 24, y: swY - 12 }, { x: sw2X - 24, y: swY - 12 }] });
    wires.push({ id: `t2-${group.controlId}`, conductor: "T2", points: [{ x: sw1X + 24, y: swY + 12 }, { x: sw2X - 24, y: swY + 12 }] });
    wires.push({
      id: `r-light-${group.controlId}`,
      conductor: "R",
      points: [{ x: sw2X, y: swY - 24 }, { x: sw2X + 90, y: swY - 24 }, { x: sw2X + 90, y: lightY }, { x: lightX - 24, y: lightY }],
    });
    wires.push({ id: `n-light-${group.controlId}`, conductor: "N", points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }] });

    joints.push(makeJoint(`joint-l-${group.controlId}`, sw1X, yL, 2, 0, 0));
    joints.push(makeJoint(`joint-n-${group.controlId}`, lightX, yN, 2, 0, 0));
  });

  return {
    mode,
    groups: grouped.groups,
    devices: diagramDevices,
    wires,
    joints,
    warnings,
  };
}

function makeJoint(id: string, x: number, y: number, wire16Count: number, wire20Count: number, wire26Count: number): DiagramJoint {
  const judged = judgeSleeve({ wire16Count, wire20Count, wire26Count });
  return {
    id,
    x,
    y,
    sleeveInfo: judged.error
      ? ["判定不可", judged.reason ?? "定義外"]
      : [`${judged.display ?? ""}`, judged.reason ?? ""].filter(Boolean),
  };
}
