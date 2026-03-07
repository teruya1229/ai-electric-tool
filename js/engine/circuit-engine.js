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

function getGroupQuantity(group, type) {
  const list = Array.isArray(group?.devices) ? group.devices : [];
  const hit = list.find((item) => item?.type === type);
  return Number(hit?.quantity || 0);
}

function createWire(role, color) {
  return { role, color };
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

export function createConnectionPointsFromCircuit(circuit) {
  if (!circuit || !Array.isArray(circuit.groups) || !circuit.groups.length) return [];

  const points = [];
  let sequence = 1;

  const pushPoint = (partial) => {
    const wires = Array.isArray(partial.wires) ? partial.wires : [];
    points.push({
      id: `cp-${circuit.id}-${sequence}`,
      circuitId: circuit.id,
      purpose: partial.purpose || "unknown",
      deviceId: typeof partial.deviceId === "undefined" ? null : partial.deviceId,
      deviceType: partial.deviceType || "unknown",
      wireCount: wires.length,
      wires,
      sourceType: partial.sourceType || "device",
    });
    sequence += 1;
  };

  circuit.groups.forEach((group, groupIndex) => {
    const purpose = group?.purpose || circuit.type || "unknown";
    const switchType = group?.switchType === "threeway" ? "threeway" : "single";
    const lightCount = getGroupQuantity(group, "light");
    const outletCount = getGroupQuantity(group, "outlet");
    const hasLoads = lightCount > 0 || outletCount > 0;
    if (!hasLoads) return;

    const junctionWires = [createWire("line", "black"), createWire("neutral", "white")];
    if (lightCount > 0) {
      junctionWires.push(createWire("switch_return", "red"));
      if (switchType === "threeway") {
        junctionWires.push(createWire("traveler_1", "blue"));
        junctionWires.push(createWire("traveler_2", "yellow"));
      }
    }
    if (outletCount > 0) {
      junctionWires.push(createWire("line_load", "black"));
      junctionWires.push(createWire("neutral_load", "white"));
    }
    if (circuit.type === "ac" || purpose === "ac_outlet") {
      junctionWires.push(createWire("earth", "green"));
    }

    pushPoint({
      purpose,
      deviceId: null,
      deviceType: "junction",
      wires: junctionWires,
      sourceType: "junction",
    });

    for (let i = 0; i < lightCount; i += 1) {
      pushPoint({
        purpose,
        deviceId: `${group?.controlId || `group-${groupIndex + 1}`}-light-${i + 1}`,
        deviceType: "light",
        wires: [createWire("switch_return", "red"), createWire("neutral", "white")],
        sourceType: "device",
      });
    }

    for (let i = 0; i < outletCount; i += 1) {
      const outletWires = [createWire("line", "black"), createWire("neutral", "white")];
      if (circuit.type === "ac" || purpose === "ac_outlet") {
        outletWires.push(createWire("earth", "green"));
      }
      pushPoint({
        purpose,
        deviceId: `${group?.controlId || `group-${groupIndex + 1}`}-outlet-${i + 1}`,
        deviceType: circuit.type === "ac" || purpose === "ac_outlet" ? "ac_outlet" : "outlet",
        wires: outletWires,
        sourceType: "device",
      });
    }
  });

  return points;
}

export function createConnectionPointsFromCircuits(circuits) {
  if (!Array.isArray(circuits) || !circuits.length) return [];
  const points = [];
  circuits.forEach((circuit) => {
    points.push(...createConnectionPointsFromCircuit(circuit));
  });
  return points;
}

function buildConnectionPointReason(baseReason, wires, sourceType) {
  const notes = [];
  if (sourceType === "device") notes.push("器具側接続");
  if (Array.isArray(wires) && wires.some((wire) => wire?.role === "earth")) notes.push("接地線含む");
  if (Array.isArray(wires) && wires.some((wire) => wire?.role === "traveler_1" || wire?.role === "traveler_2")) {
    notes.push("3路系配線を含む");
  }
  if (!notes.length) return baseReason;
  return `${baseReason}（${notes.join(" / ")}）`;
}

export function judgeConnectionPointSleeve(connectionPoint) {
  if (!connectionPoint || typeof connectionPoint !== "object") return null;

  const wireCount = Number(connectionPoint.wireCount || 0);
  const wires = Array.isArray(connectionPoint.wires) ? connectionPoint.wires : [];
  const sourceType = connectionPoint.sourceType || "unknown";

  const result = {
    connectionPointId: connectionPoint.id || null,
    circuitId: typeof connectionPoint.circuitId === "number" ? connectionPoint.circuitId : null,
    purpose: connectionPoint.purpose || "unknown",
    sourceType,
    wireCount,
    recommendedConnector: "none",
    sleeveSize: null,
    reason: "",
    isTarget: false,
  };

  if (sourceType === "device") {
    result.recommendedConnector = "direct-or-device";
    result.reason = buildConnectionPointReason("器具接続または直結想定", wires, sourceType);
    return result;
  }

  if (wireCount <= 1) {
    result.recommendedConnector = "none";
    result.reason = buildConnectionPointReason("接続本数が不足のため対象外", wires, sourceType);
    return result;
  }

  if (wireCount === 2) {
    result.recommendedConnector = "direct-or-device";
    result.reason = buildConnectionPointReason("器具接続または直結想定", wires, sourceType);
    return result;
  }

  if (wireCount === 3) {
    result.isTarget = true;
    result.recommendedConnector = "ring-sleeve";
    result.sleeveSize = "small";
    result.reason = buildConnectionPointReason("3本接続のため小スリーブ候補", wires, sourceType);
    return result;
  }

  if (wireCount === 4) {
    result.isTarget = true;
    result.recommendedConnector = "ring-sleeve";
    result.sleeveSize = "medium";
    result.reason = buildConnectionPointReason("4本接続のため中スリーブ候補", wires, sourceType);
    return result;
  }

  result.isTarget = true;
  result.recommendedConnector = "check-required";
  result.sleeveSize = null;
  result.reason = buildConnectionPointReason("本数超過または要確認", wires, sourceType);
  return result;
}

export function judgeSleevesFromConnectionPoints(connectionPoints) {
  if (!Array.isArray(connectionPoints) || !connectionPoints.length) return [];
  const results = [];
  connectionPoints.forEach((point) => {
    const judged = judgeConnectionPointSleeve(point);
    if (judged) results.push(judged);
  });
  return results;
}
