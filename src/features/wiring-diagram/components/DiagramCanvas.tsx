import type { GeneratedDiagram } from "../types";
import { DeviceNode } from "./DeviceNode";
import { JointNode } from "./JointNode";
import { WirePath } from "./WirePath";

type Props = {
  diagram: GeneratedDiagram;
};

export function DiagramCanvas({ diagram }: Props) {
  const height = Math.max(260, diagram.groups.length * 220 + 60);
  const hasData = diagram.devices.length > 0 || diagram.wires.length > 0;

  return (
    <svg width="100%" height={height} viewBox={`0 0 840 ${height}`}>
      <rect x={0} y={0} width={840} height={height} fill="#f8fafc" stroke="#cbd5e1" />
      {!hasData ? (
        <text x={420} y={height / 2} textAnchor="middle" fontSize={18} fill="#64748b">
          複線図データなし
        </text>
      ) : null}
      {diagram.wires.map((wire) => (
        <WirePath key={wire.id} wire={wire} />
      ))}
      {diagram.joints.map((joint) => (
        <JointNode key={joint.id} joint={joint} />
      ))}
      {diagram.devices.map((device) => (
        <DeviceNode key={device.id} device={device} />
      ))}
    </svg>
  );
}
