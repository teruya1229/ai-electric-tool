function addMaterial(map, name, type, quantity) {
  const qty = Number(quantity || 0);
  if (qty <= 0) return;
  const key = `${type}:${name}`;
  const current = map.get(key);
  if (current) {
    current.quantity += qty;
    return;
  }
  map.set(key, { name, type, quantity: qty });
}

export function createMaterialsFromCircuits(circuits) {
  const list = Array.isArray(circuits) ? circuits : [];
  const materialsMap = new Map();

  list.forEach((circuit) => {
    const groups = Array.isArray(circuit?.groups) ? circuit.groups : [];

    if (circuit?.type === "lighting") {
      const lightingCount = groups.length;
      const threewayCount = groups.filter((group) => group?.switchType === "threeway").length;
      const singleCount = Math.max(0, lightingCount - threewayCount);

      addMaterial(materialsMap, "VVF1.6-2C", "cable", lightingCount);
      addMaterial(materialsMap, "VVF1.6-3C", "cable", threewayCount);
      addMaterial(materialsMap, "スイッチ(片切)", "device", singleCount);
      addMaterial(materialsMap, "スイッチ(3路)", "device", threewayCount);
      return;
    }

    if (circuit?.type === "outlet") {
      const outletCount = groups.length;
      addMaterial(materialsMap, "VVF1.6-2C", "cable", outletCount);
      addMaterial(materialsMap, "コンセント", "device", outletCount);
      return;
    }

    if (circuit?.type === "ac") {
      const acCount = groups.length;
      addMaterial(materialsMap, "VVF2.0-2C", "cable", acCount);
      addMaterial(materialsMap, "エアコンコンセント", "device", acCount);
    }
  });

  return Array.from(materialsMap.values());
}
