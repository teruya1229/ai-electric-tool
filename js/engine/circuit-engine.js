function resolveCircuitTypeFromPurpose(purpose) {
  if (purpose === "light") return "lighting";
  if (purpose === "fan") return "lighting";
  if (purpose === "ac_outlet") return "ac";
  if (purpose === "outlet") return "outlet";
  if (purpose === "kitchen_outlet") return "outlet";
  if (purpose === "washroom") return "outlet";
  if (purpose === "outdoor") return "outlet";
  return "outlet";
}

export function createCircuitsFromGroups(groups) {
  const sourceGroups = Array.isArray(groups) ? groups : [];
  const bucket = {
    lighting: [],
    outlet: [],
    ac: [],
  };

  sourceGroups.forEach((group) => {
    const circuitType = resolveCircuitTypeFromPurpose(group?.purpose || "unknown");
    bucket[circuitType].push(group);
  });

  const circuits = [];
  let id = 1;

  if (bucket.lighting.length) {
    circuits.push({
      id,
      type: "lighting",
      groups: bucket.lighting,
    });
    id += 1;
  }

  if (bucket.outlet.length) {
    circuits.push({
      id,
      type: "outlet",
      groups: bucket.outlet,
    });
    id += 1;
  }

  if (bucket.ac.length) {
    circuits.push({
      id,
      type: "ac",
      groups: bucket.ac,
    });
  }

  return circuits;
}
