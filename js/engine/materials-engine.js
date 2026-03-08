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

function countLoads(loads) {
  const result = {
    switch: 0,
    light: 0,
    outlet: 0,
  };
  (Array.isArray(loads) ? loads : []).forEach((item) => {
    const key = String(item || "").trim().toLowerCase();
    if (key === "switch") result.switch += 1;
    if (key === "light") result.light += 1;
    if (key === "outlet") result.outlet += 1;
  });
  return result;
}

function isThreewaySwitch(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw.includes("3路") || raw.includes("三路") || raw === "threeway" || raw === "3way";
}

export function createMaterialsFromCircuits(circuits) {
  const list = Array.isArray(circuits) ? circuits : [];
  const materialsMap = new Map();

  list.forEach((circuit) => {
    const loadCount = countLoads(circuit?.loads);
    const lightQty = Math.max(0, Number(circuit?.lights || loadCount.light));
    const outletQty = Math.max(0, Number(circuit?.outlets || loadCount.outlet));
    const switchQty = Math.max(0, Number(circuit?.switches || loadCount.switch));
    const threeway = isThreewaySwitch(circuit?.switch);

    if (lightQty > 0) {
      addMaterial(materialsMap, "VVF1.6-2C", "wire", lightQty);
      addMaterial(materialsMap, "照明", "device", lightQty);
    }

    if (switchQty > 0) {
      addMaterial(materialsMap, "VVF1.6-3C", "wire", switchQty * (threeway ? 2 : 1));
      addMaterial(materialsMap, threeway ? "スイッチ(3路)" : "スイッチ(片切)", "device", switchQty);
    }

    if (outletQty > 0) {
      addMaterial(materialsMap, "VVF2.0-2C", "wire", outletQty);
      addMaterial(materialsMap, "コンセント", "device", outletQty);
    }
  });

  return Array.from(materialsMap.values());
}
