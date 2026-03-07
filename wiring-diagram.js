import {
  buildDevicesFromSelection,
  buildRequiredAndNotes,
  generateDiagram,
  groupDevicesByControl,
  judgeSleeve,
  renderDiagram,
} from "./js/diagram/index.js";
import {
  createCircuitsFromGroups,
  createConnectionPointsFromCircuits,
  createCircuitGraphFromCircuits,
  createDiagramLayoutsFromGraphs,
  createWirePathsFromLayouts,
  judgeSleevesFromConnectionPoints,
} from "./js/engine/circuit-engine.js";
import { createMaterialsFromCircuits } from "./js/engine/material-engine.js";
import { initPlayground } from "./js/ui/index.js";

window.buildDevicesFromSelection = buildDevicesFromSelection;
window.buildRequiredAndNotes = buildRequiredAndNotes;
window.generateDiagram = generateDiagram;
window.groupDevicesByControl = groupDevicesByControl;
window.judgeSleeve = judgeSleeve;
window.renderDiagram = renderDiagram;

function getCircuitSummaryLabel(circuit) {
  return `回路${circuit.id} / ${circuit.type}`;
}

function findCircuitForGroup(circuits, group) {
  if (!Array.isArray(circuits) || !group) return null;
  return (
    circuits.find((circuit) =>
      (circuit.groups || []).some(
        (item) => item === group || (item.controlId === group.controlId && item.label === group.label && item.purpose === group.purpose)
      )
    ) || null
  );
}

function parseGroupsFromDom() {
  const listEl = document.getElementById("group-list");
  if (!listEl) return { groups: [], activeGroup: null };

  const buttons = Array.from(listEl.querySelectorAll(".group-item-btn"));
  const groups = buttons.map((btn) => {
    const text = (btn.textContent || "").trim();
    const parts = text.split("|").map((s) => s.trim());
    return {
      controlId: parts[0] || "",
      label: parts[1] || "",
      purpose: parts[2] || "unknown",
    };
  });
  const activeIndex = buttons.findIndex((btn) => btn.classList.contains("active"));
  const activeGroup = activeIndex >= 0 ? groups[activeIndex] : null;
  return { groups, activeGroup };
}

function renderCircuitList(sceneModel) {
  const panel = document.getElementById("circuit-list-result");
  if (!panel) return;

  let groups = [];
  let activeGroup = null;
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
    activeGroup =
      typeof sceneModel.activeGroupIndex === "number" && sceneModel.activeGroupIndex >= 0
        ? sceneModel.groups[sceneModel.activeGroupIndex] || null
        : null;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
    activeGroup = parsed.activeGroup;
  }

  const circuits = createCircuitsFromGroups(groups);
  panel.innerHTML = "";
  if (!circuits.length) {
    panel.textContent = "回路情報なし";
    return;
  }

  const activeCircuit = findCircuitForGroup(circuits, activeGroup);
  circuits.forEach((circuit) => {
    const card = document.createElement("article");
    card.className = "circuit-item";
    if (activeCircuit === circuit) card.classList.add("active");

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = getCircuitSummaryLabel(circuit);
    card.appendChild(title);

    const list = document.createElement("ul");
    list.className = "circuit-group-list";
    (circuit.groups || []).forEach((group) => {
      const row = document.createElement("li");
      row.textContent = `${group.controlId || "-"} / ${group.label || "-"} / ${group.purpose || "unknown"}`;
      if (activeGroup && group === activeGroup) row.classList.add("active");
      list.appendChild(row);
    });
    card.appendChild(list);
    panel.appendChild(card);
  });
}

function getMaterialSummaryLabel(material) {
  return `${material.name} / ${material.type} / ${material.quantity}`;
}

function createMaterialsForCircuit(circuit) {
  return createMaterialsFromCircuits([circuit]);
}

function getCircuitMaterialSummaryLabel(material) {
  const parts = [material.name];
  if (material.type) parts.push(material.type);
  if (typeof material.quantity !== "undefined" && material.quantity !== null && material.quantity !== "") {
    parts.push(String(material.quantity));
  }
  return parts.join(" / ");
}

function renderMaterialList(sceneModel) {
  const panel = document.getElementById("material-list-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  const circuits = createCircuitsFromGroups(groups);
  const materials = createMaterialsFromCircuits(circuits);

  panel.innerHTML = "";
  if (!materials.length) {
    panel.textContent = "材料なし";
    return;
  }

  const list = document.createElement("ul");
  list.className = "material-list";
  materials.forEach((material) => {
    const row = document.createElement("li");
    row.className = "material-item";
    row.textContent = getMaterialSummaryLabel(material);
    list.appendChild(row);
  });
  panel.appendChild(list);
}

function renderCircuitMaterialList(sceneModel) {
  const panel = document.getElementById("circuit-material-list-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  const circuits = createCircuitsFromGroups(groups);
  panel.innerHTML = "";
  if (!circuits.length) {
    panel.textContent = "回路なし";
    return;
  }

  circuits.forEach((circuit) => {
    const card = document.createElement("article");
    card.className = "circuit-material-item";

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = getCircuitSummaryLabel(circuit);
    card.appendChild(title);

    const materials = createMaterialsForCircuit(circuit);
    if (!materials.length) {
      const empty = document.createElement("div");
      empty.className = "circuit-material-empty";
      empty.textContent = "材料なし";
      card.appendChild(empty);
      panel.appendChild(card);
      return;
    }

    const list = document.createElement("ul");
    list.className = "material-list";
    materials.forEach((material) => {
      const row = document.createElement("li");
      row.className = "material-item";
      row.textContent = getCircuitMaterialSummaryLabel(material);
      list.appendChild(row);
    });
    card.appendChild(list);
    panel.appendChild(card);
  });
}

function renderSleeveJudgeList(sceneModel) {
  const panel = document.getElementById("sleeve-judge-list-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  panel.innerHTML = "";
  if (!groups.length) {
    panel.textContent = "回路なし";
    return;
  }

  const circuits = createCircuitsFromGroups(groups);
  const connectionPoints = createConnectionPointsFromCircuits(circuits);
  if (!connectionPoints.length) {
    panel.textContent = "接続点なし";
    return;
  }

  const judgedList = judgeSleevesFromConnectionPoints(connectionPoints);
  if (!judgedList.length) {
    panel.textContent = "判定なし";
    return;
  }

  judgedList.forEach((judged) => {
    const card = document.createElement("article");
    card.className = "sleeve-judge-item";

    const lines = [
      `回路${judged.circuitId || "-"} / ${judged.purpose || "unknown"}`,
      `接続点 ${judged.connectionPointId || "-"}`,
      `本数: ${typeof judged.wireCount === "number" ? judged.wireCount : "-"}`,
      `推奨: ${judged.recommendedConnector || "-"}`,
    ];
    if (judged.sleeveSize) {
      lines.push(`サイズ: ${judged.sleeveSize}`);
    }
    if (judged.reason) {
      lines.push(`理由: ${judged.reason}`);
    }

    card.textContent = lines.join("\n");
    panel.appendChild(card);
  });
}

function detectGroupType(group) {
  const devices = Array.isArray(group?.devices) ? group.devices : [];
  const light = Number((devices.find((item) => item?.type === "light") || {}).quantity || 0);
  const outlet = Number((devices.find((item) => item?.type === "outlet") || {}).quantity || 0);
  if (light > 0 && outlet > 0) return "mixed";
  if (light > 0) return "light";
  if (outlet > 0) return "outlet";
  if (group?.purpose === "fan") return "fan";
  if (group?.purpose === "ac_outlet") return "outlet";
  return "unknown";
}

function renderParseDebugResult(sceneModel) {
  const panel = document.getElementById("parse-debug-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  panel.innerHTML = "";
  if (!groups.length) {
    panel.textContent = "groupsなし";
    return;
  }

  groups.forEach((group, index) => {
    const card = document.createElement("article");
    card.className = "parse-debug-item";

    const assistFeatures = Array.isArray(group?.assistFeatures) ? group.assistFeatures.filter(Boolean) : [];
    const warnings = Array.isArray(group?.warnings) ? group.warnings.filter(Boolean) : [];
    if (typeof group?.warning === "string" && group.warning) warnings.push(group.warning);

    const lines = [
      `Group ${group?.label || String.fromCharCode(65 + (index % 26))}`,
      `label: ${group?.label || "-"}`,
      `type: ${detectGroupType(group)}`,
      `purpose: ${group?.purpose || "unknown"}`,
      `control: ${group?.controlId || "-"} / ${group?.switchType || "none"}`,
      `assist: ${assistFeatures.length ? assistFeatures.join(" / ") : "none"}`,
      `warning: ${warnings.length ? warnings.join(" / ") : "none"}`,
    ];

    card.textContent = lines.join("\n");
    panel.appendChild(card);
  });
}

function renderLayoutDebug(sceneModel) {
  const panel = document.getElementById("layout-debug-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  panel.innerHTML = "";
  if (!groups.length) {
    panel.textContent = "回路なし";
    return;
  }

  const circuits = createCircuitsFromGroups(groups);
  const graphs = createCircuitGraphFromCircuits(circuits);
  if (!graphs.length) {
    panel.textContent = "graphなし";
    return;
  }

  const layouts = createDiagramLayoutsFromGraphs(graphs);
  if (!layouts.length) {
    panel.textContent = "layoutなし";
    return;
  }

  layouts.forEach((layout) => {
    const card = document.createElement("article");
    card.className = "layout-debug-item";

    const lines = [`回路${layout?.circuitId || "-"} layout`, "", "nodes"];
    (layout?.nodes || []).forEach((node) => {
      lines.push(`${node.id} (${node.x},${node.y})`);
    });
    lines.push("", "edges");
    (layout?.edges || []).forEach((edge) => {
      lines.push(`${edge.from} -> ${edge.to} (${edge.role || "-"})`);
    });

    card.textContent = lines.join("\n");
    panel.appendChild(card);
  });
}

function renderWirePathDebug(sceneModel) {
  const panel = document.getElementById("wire-path-debug-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  panel.innerHTML = "";
  if (!groups.length) {
    panel.textContent = "回路なし";
    return;
  }

  const circuits = createCircuitsFromGroups(groups);
  const graphs = createCircuitGraphFromCircuits(circuits);
  const layouts = createDiagramLayoutsFromGraphs(graphs);
  if (!layouts.length) {
    panel.textContent = "layoutなし";
    return;
  }

  const wirePaths = createWirePathsFromLayouts(layouts);
  const hasWire = wirePaths.some((item) => Array.isArray(item?.wires) && item.wires.length > 0);
  if (!hasWire) {
    panel.textContent = "wireなし";
    return;
  }

  const NS = "http://www.w3.org/2000/svg";
  wirePaths.forEach((wirePath) => {
    const layout = layouts.find((item) => item?.circuitId === wirePath?.circuitId);
    const card = document.createElement("article");
    card.className = "wire-path-debug-item";

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = `回路${wirePath?.circuitId ?? "-"} wire path`;
    card.appendChild(title);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "600");
    svg.setAttribute("height", "300");

    (wirePath?.wires || []).forEach((wire) => {
      const points = (wire?.path || [])
        .filter((point) => typeof point?.x === "number" && typeof point?.y === "number")
        .map((point) => `${point.x},${point.y}`)
        .join(" ");
      if (!points) return;

      const polyline = document.createElementNS(NS, "polyline");
      polyline.setAttribute("points", points);
      polyline.setAttribute("stroke", "#f5c842");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("fill", "none");
      svg.appendChild(polyline);
    });

    (layout?.nodes || []).forEach((node) => {
      if (typeof node?.x !== "number" || typeof node?.y !== "number") return;
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "#ffffff");
      svg.appendChild(circle);
    });

    card.appendChild(svg);
    panel.appendChild(card);
  });
}

function setupCircuitListAutoRender() {
  const target = document.getElementById("group-list");
  renderCircuitList();
  renderMaterialList();
  renderCircuitMaterialList();
  renderSleeveJudgeList();
  renderParseDebugResult();
  renderLayoutDebug();
  renderWirePathDebug();
  if (!target) return;
  const observer = new MutationObserver(() => {
    renderCircuitList();
    renderMaterialList();
    renderCircuitMaterialList();
    renderSleeveJudgeList();
    renderParseDebugResult();
    renderLayoutDebug();
    renderWirePathDebug();
  });
  observer.observe(target, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}

window.renderCircuitList = renderCircuitList;
window.renderMaterialList = renderMaterialList;
window.renderCircuitMaterialList = renderCircuitMaterialList;
window.renderSleeveJudgeList = renderSleeveJudgeList;
window.renderParseDebugResult = renderParseDebugResult;
window.renderLayoutDebug = renderLayoutDebug;
window.renderWirePathDebug = renderWirePathDebug;

initPlayground();
setupCircuitListAutoRender();
