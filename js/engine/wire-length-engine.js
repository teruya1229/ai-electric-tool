function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function calcSegmentLength(segment) {
  const x1 = toNumber(segment?.x1);
  const y1 = toNumber(segment?.y1);
  const x2 = toNumber(segment?.x2);
  const y2 = toNumber(segment?.y2);
  if (x1 === null || y1 === null || x2 === null || y2 === null) return 0;
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateWireLength(wirePaths) {
  const list = Array.isArray(wirePaths) ? wirePaths : [];
  const totalLength = list.reduce((sum, segment) => sum + calcSegmentLength(segment), 0);
  return { totalLength };
}
