import type { DiagramWire } from "../types";
import { WIRE_COLORS } from "../generateDiagram";

type Props = {
  wire: DiagramWire;
};

export function WirePath({ wire }: Props) {
  const d = wire.points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return <path d={d} stroke={WIRE_COLORS[wire.conductor]} strokeWidth={3} fill="none" />;
}
