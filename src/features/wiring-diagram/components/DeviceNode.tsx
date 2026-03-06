import type { DiagramDevice } from "../types";

type Props = {
  device: DiagramDevice;
};

export function DeviceNode({ device }: Props) {
  const width = device.kind === "power" ? 64 : 96;
  const height = device.kind === "light" ? 44 : 36;
  const x = device.x - width / 2;
  const y = device.y - height / 2;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill="#ffffff" stroke="#334155" strokeWidth={2} />
      <text x={device.x} y={device.y + 5} textAnchor="middle" fontSize={12} fill="#0f172a">
        {device.label}
      </text>
      {device.kind === "switch_3way" && (
        <text x={device.x} y={device.y + 20} textAnchor="middle" fontSize={11} fill="#475569">
          0 / 1 / 3
        </text>
      )}
    </g>
  );
}
