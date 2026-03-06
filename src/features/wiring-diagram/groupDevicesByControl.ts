import { getControlLabelDetail } from "./controlLabel";
import type { CircuitGroup, DiagramMode, InputDevice } from "./types";

export type GroupDevicesResult = {
  groups: CircuitGroup[];
  warnings: string[];
};

export function groupDevicesByControl(devices: InputDevice[], mode: DiagramMode): CircuitGroup[] {
  return groupDevicesByControlWithWarnings(devices, mode).groups;
}

export function groupDevicesByControlWithWarnings(devices: InputDevice[], mode: DiagramMode): GroupDevicesResult {
  const byControl = new Map<number, InputDevice[]>();
  const warnings: string[] = [];

  for (const device of devices) {
    if (typeof device.controlId !== "number") continue;
    const list = byControl.get(device.controlId) ?? [];
    list.push(device);
    byControl.set(device.controlId, list);
  }

  const groups: CircuitGroup[] = [];
  for (const [controlId, groupDevices] of [...byControl.entries()].sort((a, b) => a[0] - b[0])) {
    const control = getControlLabelDetail(controlId, mode);
    if (control.warning) warnings.push(control.warning);

    const switchSingleCount = groupDevices.filter((d) => d.kind === "switch_single").length;
    const switch3wayCount = groupDevices.filter((d) => d.kind === "switch_3way").length;
    const lightCount = groupDevices.filter((d) => d.kind === "light").length;

    if (switchSingleCount === 1 && switch3wayCount === 0 && lightCount === 1) {
      groups.push({
        controlId,
        controlLabel: control.label,
        templateId: "single_switch_1light",
        devices: groupDevices,
      });
      continue;
    }

    if (switchSingleCount === 0 && switch3wayCount === 2 && lightCount === 1) {
      groups.push({
        controlId,
        controlLabel: control.label,
        templateId: "three_way_1light",
        devices: groupDevices,
      });
      continue;
    }

    warnings.push(
      `control=${control.label} は未対応構成です (single=${switchSingleCount}, threeWay=${switch3wayCount}, light=${lightCount})`
    );
  }

  return { groups, warnings };
}
