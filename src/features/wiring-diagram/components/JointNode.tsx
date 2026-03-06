import type { DiagramJoint } from "../types";

type Props = {
  joint: DiagramJoint;
};

export function JointNode({ joint }: Props) {
  return (
    <g>
      <circle cx={joint.x} cy={joint.y} r={5} fill="#111827" />
      {joint.sleeveInfo?.length ? (
        <text x={joint.x + 8} y={joint.y - 8} fontSize={10} fill="#334155">
          {joint.sleeveInfo.join(" / ")}
        </text>
      ) : null}
    </g>
  );
}
