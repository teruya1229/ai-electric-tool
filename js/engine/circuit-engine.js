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

export function createCircuitGraphFromCircuit(circuit) {
  const graph = {
    circuitId: typeof circuit?.id === "number" ? circuit.id : null,
    nodes: [],
    edges: [],
  };
  if (!circuit || !Array.isArray(circuit.groups) || !circuit.groups.length) return graph;

  const circuitId = graph.circuitId;
  const powerNodeId = `power-${circuitId || "x"}`;
  graph.nodes.push({
    id: powerNodeId,
    type: "source",
    circuitId,
  });

  circuit.groups.forEach((group, groupIndex) => {
    const switchType = group?.switchType === "threeway" ? "threeway" : "single";
    const switchNodeId = `switch-${circuitId || "x"}-${groupIndex + 1}`;

    graph.nodes.push({
      id: switchNodeId,
      type: "device",
      deviceType: "switch",
      switchType,
      purpose: group?.purpose || "unknown",
      controlId: group?.controlId || null,
      circuitId,
    });
    graph.edges.push({
      from: powerNodeId,
      to: switchNodeId,
      role: "line",
    });

    if (switchType === "threeway") {
      const subSwitchNodeId = `switch-${circuitId || "x"}-${groupIndex + 1}-sub`;
      graph.nodes.push({
        id: subSwitchNodeId,
        type: "device",
        deviceType: "switch",
        switchType: "threeway",
        purpose: group?.purpose || "unknown",
        controlId: group?.controlId || null,
        circuitId,
      });
      graph.edges.push({
        from: switchNodeId,
        to: subSwitchNodeId,
        role: "traveler_1",
      });
      graph.edges.push({
        from: switchNodeId,
        to: subSwitchNodeId,
        role: "traveler_2",
      });
    }

    const lightCount = getGroupQuantity(group, "light");
    for (let i = 0; i < lightCount; i += 1) {
      const lightNodeId = `light-${circuitId || "x"}-${groupIndex + 1}-${i + 1}`;
      graph.nodes.push({
        id: lightNodeId,
        type: "device",
        deviceType: "light",
        purpose: group?.purpose || "light",
        controlId: group?.controlId || null,
        circuitId,
      });
      graph.edges.push({
        from: switchNodeId,
        to: lightNodeId,
        role: "switch_return",
      });
      graph.edges.push({
        from: powerNodeId,
        to: lightNodeId,
        role: "neutral",
      });
    }

    const outletCount = getGroupQuantity(group, "outlet");
    for (let i = 0; i < outletCount; i += 1) {
      const outletNodeId = `outlet-${circuitId || "x"}-${groupIndex + 1}-${i + 1}`;
      graph.nodes.push({
        id: outletNodeId,
        type: "device",
        deviceType: circuit?.type === "ac" || group?.purpose === "ac_outlet" ? "ac_outlet" : "outlet",
        purpose: group?.purpose || "outlet",
        controlId: group?.controlId || null,
        circuitId,
      });
      graph.edges.push({
        from: powerNodeId,
        to: outletNodeId,
        role: "line_load",
      });
      graph.edges.push({
        from: powerNodeId,
        to: outletNodeId,
        role: "neutral",
      });
    }
  });

  return graph;
}

export function createCircuitGraphFromCircuits(circuits) {
  if (!Array.isArray(circuits) || !circuits.length) return [];
  const graphs = [];
  circuits.forEach((circuit) => {
    graphs.push(createCircuitGraphFromCircuit(circuit));
  });
  return graphs;
}

export function createDiagramLayoutFromGraph(graph) {
  if (!graph || typeof graph !== "object") {
    return {
      circuitId: null,
      nodes: [],
      edges: [],
      meta: { layoutType: "empty" },
    };
  }

  const sourceNodes = (graph.nodes || []).filter((node) => node?.type === "source");
  const switchNodes = (graph.nodes || []).filter((node) => node?.deviceType === "switch");
  const lightNodes = (graph.nodes || []).filter((node) => node?.deviceType === "light");
  const outletNodes = (graph.nodes || []).filter((node) => node?.deviceType === "outlet" || node?.deviceType === "ac_outlet");
  const extraNodes = (graph.nodes || []).filter(
    (node) =>
      node &&
      node.type !== "source" &&
      node.deviceType !== "switch" &&
      node.deviceType !== "light" &&
      node.deviceType !== "outlet" &&
      node.deviceType !== "ac_outlet"
  );

  const positionedNodes = [];

  sourceNodes.forEach((node, idx) => {
    positionedNodes.push({
      ...node,
      deviceType: node.deviceType || "source",
      x: 40,
      y: 60 + idx * 80,
    });
  });

  switchNodes.forEach((node, idx) => {
    positionedNodes.push({
      ...node,
      x: 160 + idx * 90,
      y: 60,
    });
  });

  lightNodes.forEach((node, idx) => {
    positionedNodes.push({
      ...node,
      x: 300 + idx * 140,
      y: 60,
    });
  });

  outletNodes.forEach((node, idx) => {
    positionedNodes.push({
      ...node,
      x: 300 + idx * 140,
      y: 160,
    });
  });

  extraNodes.forEach((node, idx) => {
    positionedNodes.push({
      ...node,
      x: 300 + idx * 140,
      y: 260,
    });
  });

  return {
    circuitId: typeof graph.circuitId === "number" ? graph.circuitId : null,
    nodes: positionedNodes,
    edges: Array.isArray(graph.edges) ? [...graph.edges] : [],
    meta: {
      layoutType: positionedNodes.length ? "horizontal-flow" : "empty",
    },
  };
}

export function createDiagramLayoutsFromGraphs(graphs) {
  if (!Array.isArray(graphs) || !graphs.length) return [];
  const layouts = [];
  graphs.forEach((graph) => {
    layouts.push(createDiagramLayoutFromGraph(graph));
  });
  return layouts;
}

function createPathPoints(fromNode, toNode) {
  const fromX = Number(fromNode?.x || 0);
  const fromY = Number(fromNode?.y || 0);
  const toX = Number(toNode?.x || 0);
  const toY = Number(toNode?.y || 0);

  if (fromX === toX) {
    const midY = Math.round((fromY + toY) / 2);
    return [
      { x: fromX, y: fromY },
      { x: fromX, y: midY },
      { x: toX, y: toY },
    ];
  }

  if (fromY === toY) {
    const midX = Math.round((fromX + toX) / 2);
    return [
      { x: fromX, y: fromY },
      { x: midX, y: fromY },
      { x: toX, y: toY },
    ];
  }

  const midX = Math.round((fromX + toX) / 2);
  return [
    { x: fromX, y: fromY },
    { x: midX, y: fromY },
    { x: midX, y: toY },
    { x: toX, y: toY },
  ];
}

export function createWirePathsFromLayout(layout) {
  const result = {
    circuitId: typeof layout?.circuitId === "number" ? layout.circuitId : null,
    wires: [],
  };
  if (!layout || !Array.isArray(layout.nodes) || !Array.isArray(layout.edges)) return result;

  const nodeMap = new Map();
  layout.nodes.forEach((node) => {
    if (node?.id) nodeMap.set(node.id, node);
  });

  layout.edges.forEach((edge) => {
    const fromNode = nodeMap.get(edge?.from);
    const toNode = nodeMap.get(edge?.to);
    if (!fromNode || !toNode) return;

    result.wires.push({
      from: edge.from,
      to: edge.to,
      role: edge.role || "unknown",
      path: createPathPoints(fromNode, toNode),
    });
  });

  return result;
}

export function createWirePathsFromLayouts(layouts) {
  if (!Array.isArray(layouts) || !layouts.length) return [];
  const results = [];
  layouts.forEach((layout) => {
    results.push(createWirePathsFromLayout(layout));
  });
  return results;
}
