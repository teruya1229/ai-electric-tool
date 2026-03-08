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

let aiDiagramPreviewMode = "exam_style";
let aiDiagramDeveloperMode = false;
let aiDiagramRenderState = {
  circuits: "-",
  layouts: "-",
  message: "",
};
let connectionPointsEditorSceneModel = null;

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

function getSelectedCircuitFromList() {
  const panel = document.getElementById("circuit-list-result");
  if (!panel) return { hasSelection: false, selectedCircuitId: null, selectedIndex: -1 };

  const cards = Array.from(panel.querySelectorAll(".circuit-item"));
  const selectedIndex = cards.findIndex((card) => card.classList.contains("active"));
  if (selectedIndex < 0) return { hasSelection: false, selectedCircuitId: null, selectedIndex: -1 };

  const selectedCard = cards[selectedIndex];
  const titleEl = selectedCard.querySelector(".circuit-item-title");
  const titleText = (titleEl?.textContent || "").trim();
  const matched = titleText.match(/回路\s*(\d+)/);
  const selectedCircuitId = matched ? Number(matched[1]) : null;
  return {
    hasSelection: true,
    selectedCircuitId: Number.isFinite(selectedCircuitId) ? selectedCircuitId : null,
    selectedIndex,
  };
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

function renderAiDiagramPreview(sceneModel) {
  const panel = document.getElementById("ai-diagram-preview-result");
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
  layouts.forEach((layout) => {
    const wirePath = wirePaths.find((item) => item?.circuitId === layout?.circuitId);
    const card = document.createElement("article");
    card.className = "ai-diagram-preview-item";

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = `回路${layout?.circuitId ?? "-"} AI preview`;
    card.appendChild(title);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "700");
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
      circle.setAttribute("r", "5");
      circle.setAttribute("fill", "#ffffff");
      svg.appendChild(circle);

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(node.x + 8));
      text.setAttribute("y", String(node.y - 8));
      text.setAttribute("font-size", "11");
      text.setAttribute("fill", "#cccccc");
      text.textContent = String(node?.id || "-");
      svg.appendChild(text);
    });

    card.appendChild(svg);
    panel.appendChild(card);
  });
}

function renderAiDiagramEnhanced(sceneModel) {
  const panel = document.getElementById("ai-diagram-preview-result");
  if (!panel) return;

  Array.from(panel.querySelectorAll(".ai-diagram-enhanced-item")).forEach((item) => item.remove());

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }
  if (!groups.length) return;

  const circuits = createCircuitsFromGroups(groups);
  const graphs = createCircuitGraphFromCircuits(circuits);
  const layouts = createDiagramLayoutsFromGraphs(graphs);
  if (!layouts.length) return;

  const wirePaths = createWirePathsFromLayouts(layouts);
  const hasWire = wirePaths.some((item) => Array.isArray(item?.wires) && item.wires.length > 0);
  if (!hasWire) return;

  const NS = "http://www.w3.org/2000/svg";
  const roleColors = {
    line: "#f5c842",
    neutral: "#4aa3ff",
    switch_return: "#ff6b6b",
    traveler_1: "#9b59b6",
    traveler_2: "#9b59b6",
  };

  layouts.forEach((layout) => {
    const wirePath = wirePaths.find((item) => item?.circuitId === layout?.circuitId);
    const card = document.createElement("article");
    card.className = "ai-diagram-enhanced-item";

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = `回路${layout?.circuitId ?? "-"} AI enhanced`;
    card.appendChild(title);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", "700");
    svg.setAttribute("height", "320");

    (wirePath?.wires || []).forEach((wire) => {
      const points = (wire?.path || [])
        .filter((point) => typeof point?.x === "number" && typeof point?.y === "number")
        .map((point) => `${point.x},${point.y}`)
        .join(" ");
      if (!points) return;

      const polyline = document.createElementNS(NS, "polyline");
      polyline.setAttribute("points", points);
      polyline.setAttribute("stroke", roleColors[wire?.role] || "#f5c842");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("fill", "none");
      svg.appendChild(polyline);
    });

    (layout?.nodes || []).forEach((node) => {
      if (typeof node?.x !== "number" || typeof node?.y !== "number") return;

      const x = node.x;
      const y = node.y;
      const nodeKind =
        node?.type === "source"
          ? "source"
          : node?.deviceType === "switch"
            ? "switch"
            : node?.deviceType === "light"
              ? "light"
              : node?.deviceType === "outlet" || node?.deviceType === "ac_outlet"
                ? "outlet"
                : "light";

      if (nodeKind === "source") {
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", String(x - 7));
        rect.setAttribute("y", String(y - 7));
        rect.setAttribute("width", "14");
        rect.setAttribute("height", "14");
        rect.setAttribute("fill", "#2c2c2c");
        svg.appendChild(rect);
      } else if (nodeKind === "switch") {
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", String(x - 7));
        rect.setAttribute("y", String(y - 7));
        rect.setAttribute("width", "14");
        rect.setAttribute("height", "14");
        rect.setAttribute("fill", "#3a3a3a");
        svg.appendChild(rect);
      } else if (nodeKind === "outlet") {
        const polygon = document.createElementNS(NS, "polygon");
        polygon.setAttribute("points", `${x},${y - 8} ${x + 8},${y} ${x},${y + 8} ${x - 8},${y}`);
        polygon.setAttribute("fill", "#444");
        svg.appendChild(polygon);
      } else {
        const circle = document.createElementNS(NS, "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", "6");
        circle.setAttribute("fill", "#444");
        svg.appendChild(circle);
      }

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(x + 8));
      text.setAttribute("y", String(y - 8));
      text.setAttribute("font-size", "11");
      text.setAttribute("fill", "#cccccc");
      text.textContent = String(node?.id || "-");
      svg.appendChild(text);
    });

    card.appendChild(svg);
    panel.appendChild(card);
  });
}

function renderAiDiagramExamStyle(sceneModel) {
  const panel = document.getElementById("ai-diagram-preview-result");
  if (!panel) return;

  Array.from(panel.querySelectorAll(".ai-diagram-exam-style-item")).forEach((item) => item.remove());

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }
  if (!groups.length) return;

  const circuits = createCircuitsFromGroups(groups);
  const graphs = createCircuitGraphFromCircuits(circuits);
  const layouts = createDiagramLayoutsFromGraphs(graphs);
  if (!layouts.length) return;

  const wirePaths = createWirePathsFromLayouts(layouts);
  const hasWire = wirePaths.some((item) => Array.isArray(item?.wires) && item.wires.length > 0);
  if (!hasWire) return;
  const connectionPoints =
    (sceneModel && Array.isArray(sceneModel.connectionPoints) && sceneModel.connectionPoints) ||
    createConnectionPointsFromCircuits(circuits);
  const allSleeveResults =
    (sceneModel && Array.isArray(sceneModel.sleeveResults) && sceneModel.sleeveResults) ||
    (sceneModel && Array.isArray(sceneModel.sleeves) && sceneModel.sleeves) ||
    (sceneModel && Array.isArray(sceneModel.sleeveResult) && sceneModel.sleeveResult) ||
    judgeSleevesFromConnectionPoints(connectionPoints);

  const NS = "http://www.w3.org/2000/svg";
  const panelWidth = Number(panel?.clientWidth || 0);
  const viewportWidth = typeof window !== "undefined" ? Number(window.innerWidth || 0) : 0;
  const mobileBasis = panelWidth > 0 ? Math.min(panelWidth, viewportWidth || panelWidth) : viewportWidth;
  const isMobileMode = mobileBasis > 0 && mobileBasis <= 520;
  const roleColors = {
    line: "#f5c842",
    line_load: "#f5c842",
    neutral: "#4aa3ff",
    switch_return: "#ff6b6b",
    traveler_1: "#9b59b6",
    traveler_2: "#9b59b6",
  };
  const selectedCircuit = getSelectedCircuitFromList();
  const renderLayoutIndexes = layouts.map((_, index) => index);
  if (selectedCircuit.hasSelection) {
    let selectedLayoutIndex = -1;
    if (selectedCircuit.selectedCircuitId !== null) {
      selectedLayoutIndex = renderLayoutIndexes.find((index) => {
        const layout = layouts[index];
        const wirePath = wirePaths.find((item) => item?.circuitId === layout?.circuitId) || wirePaths[index] || null;
        const graph =
          graphs.find((item) => item?.circuitId === layout?.circuitId) ||
          graphs.find((item) => item?.circuitId === wirePath?.circuitId) ||
          graphs[index] ||
          null;
        const circuit =
          circuits.find((item) => item?.id === layout?.circuitId) ||
          circuits.find((item) => item?.id === graph?.circuitId) ||
          circuits.find((item) => item?.id === wirePath?.circuitId) ||
          circuits[index] ||
          null;
        return [circuit?.id, layout?.circuitId, graph?.circuitId, wirePath?.circuitId].some(
          (value) => Number.isFinite(Number(value)) && Number(value) === selectedCircuit.selectedCircuitId
        );
      });
    }
    if (
      selectedLayoutIndex < 0 &&
      selectedCircuit.selectedIndex >= 0 &&
      selectedCircuit.selectedIndex < renderLayoutIndexes.length
    ) {
      selectedLayoutIndex = selectedCircuit.selectedIndex;
    }
    if (selectedLayoutIndex > 0) {
      renderLayoutIndexes.splice(selectedLayoutIndex, 1);
      renderLayoutIndexes.unshift(selectedLayoutIndex);
    }
  }

  renderLayoutIndexes.forEach((layoutIndex) => {
    const layout = layouts[layoutIndex];
    const wirePath = wirePaths.find((item) => item?.circuitId === layout?.circuitId) || wirePaths[layoutIndex] || null;
    const graph =
      graphs.find((item) => item?.circuitId === layout?.circuitId) ||
      graphs.find((item) => item?.circuitId === wirePath?.circuitId) ||
      graphs[layoutIndex] ||
      null;
    const circuit =
      circuits.find((item) => item?.id === layout?.circuitId) ||
      circuits.find((item) => item?.id === graph?.circuitId) ||
      circuits.find((item) => item?.id === wirePath?.circuitId) ||
      circuits[layoutIndex] ||
      null;
    const card = document.createElement("article");
    card.className = "ai-diagram-exam-style-item";
    const isSelectedCircuitById =
      selectedCircuit.hasSelection &&
      selectedCircuit.selectedCircuitId !== null &&
      [circuit?.id, layout?.circuitId, graph?.circuitId, wirePath?.circuitId].some(
        (value) => Number.isFinite(Number(value)) && Number(value) === selectedCircuit.selectedCircuitId
      );
    const isSelectedCircuitByIndex = selectedCircuit.hasSelection && selectedCircuit.selectedIndex === layoutIndex;
    const isSelectedCircuit = selectedCircuit.hasSelection ? isSelectedCircuitById || isSelectedCircuitByIndex : true;
    if (selectedCircuit.hasSelection) {
      card.style.opacity = isSelectedCircuit ? "1" : "0.42";
      card.style.border = isSelectedCircuit ? "1px solid #8fb3e0" : "1px solid transparent";
      card.style.borderRadius = "8px";
      card.style.padding = "4px";
    }
    if (isMobileMode) {
      card.style.marginBottom = "12px";
    }

    const title = document.createElement("div");
    title.className = "circuit-item-title";
    title.textContent = `回路${layout?.circuitId ?? "-"} AI exam_style`;
    if (selectedCircuit.hasSelection) {
      title.style.color = isSelectedCircuit ? "#ffffff" : "#bbbbbb";
    }
    card.appendChild(title);

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 700 430");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("width", isMobileMode ? "100%" : "700");
    svg.setAttribute("height", "430");
    if (isMobileMode) {
      svg.setAttribute("style", "display:block;width:100%;height:auto;max-width:700px;");
    }

    const bg = document.createElementNS(NS, "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "700");
    bg.setAttribute("height", "430");
    bg.setAttribute("fill", "#1f1f1f");
    svg.appendChild(bg);

    const circuitLabel =
      circuit?.id ??
      graph?.id ??
      (typeof layout?.circuitId !== "undefined" && layout?.circuitId !== null ? layout.circuitId : `circuit-${layoutIndex + 1}`);
    const nodeCount = Array.isArray(layout?.nodes) ? layout.nodes.length : 0;
    const wireCount = Array.isArray(wirePath?.wires) ? wirePath.wires.length : 0;

    const headerTitle = document.createElementNS(NS, "text");
    headerTitle.setAttribute("x", "16");
    headerTitle.setAttribute("y", "20");
    headerTitle.setAttribute("font-size", "13");
    headerTitle.setAttribute("font-weight", "700");
    headerTitle.setAttribute("fill", "#ffffff");
    headerTitle.textContent = `回路: ${circuitLabel}`;
    svg.appendChild(headerTitle);

    const headerSub = document.createElementNS(NS, "text");
    headerSub.setAttribute("x", "16");
    headerSub.setAttribute("y", "35");
    headerSub.setAttribute("font-size", "10");
    headerSub.setAttribute("fill", "#bbbbbb");
    headerSub.textContent = `器具数: ${nodeCount}  配線数: ${wireCount}`;
    svg.appendChild(headerSub);

    const hasThreeway = (wirePath?.wires || []).some((wire) => wire?.role === "traveler_1" || wire?.role === "traveler_2");
    if (hasThreeway) {
      const threewayText = document.createElementNS(NS, "text");
      threewayText.setAttribute("x", "540");
      threewayText.setAttribute("y", "20");
      threewayText.setAttribute("font-size", "10");
      threewayText.setAttribute("fill", "#c792ea");
      threewayText.textContent = "3路配線あり";
      svg.appendChild(threewayText);
    }

    const circuitMaterials = circuit ? createMaterialsForCircuit(circuit) : [];
    const materialLines =
      circuitMaterials.length > 0
        ? circuitMaterials
            .slice(0, 5)
            .map((material) => `${material?.name || "-"} × ${typeof material?.quantity === "number" ? material.quantity : material?.quantity || "-"}`)
        : ["材料なし"];
    if (circuitMaterials.length > 5) {
      materialLines.push(`...他${circuitMaterials.length - 5}件`);
    }
    const materialBoxX = 470;
    const materialBoxY = 44;
    const materialBoxWidth = 210;
    const materialBoxHeight = 28 + materialLines.length * 14;

    if (!isMobileMode) {
      const materialBox = document.createElementNS(NS, "rect");
      materialBox.setAttribute("x", String(materialBoxX));
      materialBox.setAttribute("y", String(materialBoxY));
      materialBox.setAttribute("width", String(materialBoxWidth));
      materialBox.setAttribute("height", String(materialBoxHeight));
      materialBox.setAttribute("fill", "#262626");
      materialBox.setAttribute("stroke", "#555");
      materialBox.setAttribute("rx", "6");
      svg.appendChild(materialBox);

      const materialTitle = document.createElementNS(NS, "text");
      materialTitle.setAttribute("x", String(materialBoxX + 10));
      materialTitle.setAttribute("y", String(materialBoxY + 16));
      materialTitle.setAttribute("font-size", "11");
      materialTitle.setAttribute("fill", "#ffffff");
      materialTitle.textContent = "材料";
      svg.appendChild(materialTitle);

      materialLines.forEach((line, idx) => {
        const materialText = document.createElementNS(NS, "text");
        materialText.setAttribute("x", String(materialBoxX + 10));
        materialText.setAttribute("y", String(materialBoxY + 32 + idx * 14));
        materialText.setAttribute("font-size", "10");
        materialText.setAttribute("fill", "#d8d8d8");
        materialText.textContent = line;
        svg.appendChild(materialText);
      });
    }

    const resolvedCircuitId =
      layout?.circuitId ?? graph?.circuitId ?? wirePath?.circuitId ?? circuit?.id ?? null;
    let sleeveItems = Array.isArray(allSleeveResults)
      ? allSleeveResults.filter((item) => item?.circuitId === resolvedCircuitId)
      : [];
    if (!sleeveItems.length && Array.isArray(allSleeveResults) && allSleeveResults.length) {
      const groupedByCircuitId = [];
      const groupedMap = new Map();
      allSleeveResults.forEach((item) => {
        const key = item?.circuitId;
        if (typeof key === "undefined" || key === null) return;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, []);
          groupedByCircuitId.push(groupedMap.get(key));
        }
        groupedMap.get(key).push(item);
      });
      if (groupedByCircuitId[layoutIndex]) {
        sleeveItems = groupedByCircuitId[layoutIndex];
      }
    }
    let connectionPointItems = Array.isArray(connectionPoints)
      ? connectionPoints.filter((point) => point?.circuitId === resolvedCircuitId)
      : [];
    if (!connectionPointItems.length && Array.isArray(connectionPoints) && connectionPoints.length) {
      const groupedByCircuitId = [];
      const groupedMap = new Map();
      connectionPoints.forEach((point) => {
        const key = point?.circuitId;
        if (typeof key === "undefined" || key === null) return;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, []);
          groupedByCircuitId.push(groupedMap.get(key));
        }
        groupedMap.get(key).push(point);
      });
      if (groupedByCircuitId[layoutIndex]) {
        connectionPointItems = groupedByCircuitId[layoutIndex];
      }
    }

    const sleeveSummaryMap = new Map();
    sleeveItems.forEach((item) => {
      const label =
        item?.sleeveType ||
        item?.sleeveName ||
        item?.label ||
        item?.name ||
        item?.size ||
        item?.sleeveSize ||
        item?.recommendedConnector ||
        item?.result ||
        item?.judgement ||
        item?.judge ||
        "要確認";
      const rawQty = item?.quantity ?? item?.count ?? item?.qty ?? item?.total ?? item?.wireCount ?? 1;
      const qty = Number.isFinite(Number(rawQty)) ? Number(rawQty) : 1;
      const alertText = `${label} ${item?.reason || ""}`.toLowerCase();
      const isAlert = alertText.includes("要確認") || alertText.includes("未判定") || alertText.includes("unknown");
      if (!sleeveSummaryMap.has(label)) {
        sleeveSummaryMap.set(label, { qty: 0, isAlert: false });
      }
      const current = sleeveSummaryMap.get(label);
      current.qty += qty;
      if (isAlert) current.isAlert = true;
    });

    const sleeveLines = [];
    if (!sleeveSummaryMap.size) {
      sleeveLines.push({ text: "スリーブ情報なし", isAlert: false });
    } else {
      Array.from(sleeveSummaryMap.entries()).forEach(([label, info]) => {
        sleeveLines.push({ text: `${label} × ${info.qty}`, isAlert: info.isAlert });
      });
    }
    const visibleSleeveLines = sleeveLines.slice(0, 5);
    if (sleeveLines.length > 5) {
      visibleSleeveLines.push({ text: `...他${sleeveLines.length - 5}件`, isAlert: false });
    }

    const sleeveBoxX = 470;
    const sleeveBoxY = materialBoxY + materialBoxHeight + 8;
    const sleeveBoxWidth = 210;
    const sleeveBoxHeight = 28 + visibleSleeveLines.length * 14;

    if (!isMobileMode) {
      const sleeveBox = document.createElementNS(NS, "rect");
      sleeveBox.setAttribute("x", String(sleeveBoxX));
      sleeveBox.setAttribute("y", String(sleeveBoxY));
      sleeveBox.setAttribute("width", String(sleeveBoxWidth));
      sleeveBox.setAttribute("height", String(sleeveBoxHeight));
      sleeveBox.setAttribute("fill", "#262626");
      sleeveBox.setAttribute("stroke", "#555");
      sleeveBox.setAttribute("rx", "6");
      svg.appendChild(sleeveBox);

      const sleeveTitle = document.createElementNS(NS, "text");
      sleeveTitle.setAttribute("x", String(sleeveBoxX + 10));
      sleeveTitle.setAttribute("y", String(sleeveBoxY + 16));
      sleeveTitle.setAttribute("font-size", "11");
      sleeveTitle.setAttribute("fill", "#ffffff");
      sleeveTitle.textContent = "スリーブ判定";
      svg.appendChild(sleeveTitle);

      visibleSleeveLines.forEach((line, idx) => {
        const sleeveText = document.createElementNS(NS, "text");
        sleeveText.setAttribute("x", String(sleeveBoxX + 10));
        sleeveText.setAttribute("y", String(sleeveBoxY + 32 + idx * 14));
        sleeveText.setAttribute("font-size", "10");
        sleeveText.setAttribute("fill", line.isAlert ? "#ffb86b" : "#d8d8d8");
        sleeveText.textContent = line.text;
        svg.appendChild(sleeveText);
      });
    }

    const drawOffsetY = -8;
    const sleeveByConnectionPointId = new Map();
    (sleeveItems || []).forEach((item, idx) => {
      const key = item?.connectionPointId || `idx-${idx}`;
      sleeveByConnectionPointId.set(key, item);
    });
    const connectionPointWires = (wirePath?.wires || []).filter((wire) => Array.isArray(wire?.path) && wire.path.length > 0);
    const markerItems = (connectionPointItems || []).slice(0, isMobileMode ? 4 : 6);
    const usedNodeIds = new Set();
    markerItems.forEach((point, idx) => {
      let x = Number(point?.x);
      let y = Number(point?.y);
      const isDirectXY = Number.isFinite(x) && Number.isFinite(y);
      if (!isDirectXY) {
        const deviceType = point?.deviceType;
        let candidateNodes = [];
        if (deviceType === "light") {
          candidateNodes = (layout?.nodes || []).filter((node) => node?.deviceType === "light");
        } else if (deviceType === "outlet" || deviceType === "ac_outlet") {
          candidateNodes = (layout?.nodes || []).filter((node) => node?.deviceType === "outlet" || node?.deviceType === "ac_outlet");
        } else if (deviceType === "switch") {
          candidateNodes = (layout?.nodes || []).filter((node) => node?.deviceType === "switch");
        } else if (deviceType === "junction") {
          candidateNodes = (layout?.nodes || []).filter((node) => node?.type === "source" || node?.deviceType === "switch");
        }
        let nodeHit = candidateNodes.find((node) => !usedNodeIds.has(node?.id));
        if (!nodeHit && point?.deviceId) {
          nodeHit = (layout?.nodes || []).find((node) => typeof node?.id === "string" && String(node.id).includes(String(point.deviceId)));
        }
        if (nodeHit && Number.isFinite(Number(nodeHit?.x)) && Number.isFinite(Number(nodeHit?.y))) {
          x = Number(nodeHit.x) + 14;
          y = Number(nodeHit.y);
          if (nodeHit?.id) usedNodeIds.add(nodeHit.id);
        }
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        const roleList = Array.isArray(point?.wires) ? point.wires.map((wire) => wire?.role).filter(Boolean) : [];
        const wireHit =
          connectionPointWires.find((wire) => roleList.some((role) => role === wire?.role)) ||
          connectionPointWires[idx] ||
          null;
        const path = Array.isArray(wireHit?.path) ? wireHit.path : [];
        if (path.length) {
          const mid = path[Math.floor(path.length / 2)];
          if (Number.isFinite(Number(mid?.x)) && Number.isFinite(Number(mid?.y))) {
            x = Number(mid.x);
            y = Number(mid.y);
          }
        }
      }
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      y += drawOffsetY;
      x += (idx % 2) * 6;
      y += Math.floor(idx / 2) * 2;

      const cpIdText = point?.id ? String(point.id).replace(/^cp-/i, "CP-") : `CP${idx + 1}`;
      const cpIdShort = cpIdText.length > 8 ? cpIdText.slice(0, 8) : cpIdText;
      const sleeveRaw =
        sleeveByConnectionPointId.get(point?.id || "") ||
        sleeveByConnectionPointId.get(`idx-${idx}`) ||
        sleeveItems[idx] ||
        null;
      const sleeveRawLabel =
        sleeveRaw?.sleeveType ||
        sleeveRaw?.sleeveName ||
        sleeveRaw?.label ||
        sleeveRaw?.name ||
        sleeveRaw?.size ||
        sleeveRaw?.sleeveSize ||
        sleeveRaw?.recommendedConnector ||
        sleeveRaw?.result ||
        sleeveRaw?.judgement ||
        sleeveRaw?.judge ||
        "";
      const sleeveRawText = String(sleeveRawLabel || "").toLowerCase();
      let sleeveShort = "";
      if (sleeveRawText) {
        if (sleeveRawText.includes("small") || sleeveRawText.includes("小") || sleeveRawText === "s") sleeveShort = "小";
        else if (sleeveRawText.includes("medium") || sleeveRawText.includes("中") || sleeveRawText === "m") sleeveShort = "中";
        else if (sleeveRawText.includes("large") || sleeveRawText.includes("大") || sleeveRawText === "l") sleeveShort = "大";
        else if (sleeveRawText.includes("unknown") || sleeveRawText.includes("未判定") || sleeveRawText.includes("要確認")) sleeveShort = "要確認";
        else sleeveShort = String(sleeveRawLabel).slice(0, 6);
      }
      const isAlertShort = sleeveShort === "要確認";

      const marker = document.createElementNS(NS, "circle");
      marker.setAttribute("cx", String(x));
      marker.setAttribute("cy", String(y));
      marker.setAttribute("r", "4");
      marker.setAttribute("fill", "#ffe082");
      marker.setAttribute("stroke", "#333");
      svg.appendChild(marker);

      const cpText = document.createElementNS(NS, "text");
      cpText.setAttribute("x", String(x + 6));
      cpText.setAttribute("y", String(y - 2));
      cpText.setAttribute("font-size", "9");
      cpText.setAttribute("fill", "#fff2b3");
      cpText.textContent = cpIdShort;
      if (!isMobileMode || idx % 2 === 0) {
        svg.appendChild(cpText);
      }

      if (sleeveShort) {
        const sleeveText = document.createElementNS(NS, "text");
        sleeveText.setAttribute("x", String(x + 6));
        sleeveText.setAttribute("y", String(y + 9));
        sleeveText.setAttribute("font-size", "9");
        sleeveText.setAttribute("fill", isAlertShort ? "#ffb86b" : "#ffd966");
        sleeveText.textContent = sleeveShort;
        if (!isMobileMode || idx < 2) {
          svg.appendChild(sleeveText);
        }
      }
    });

    let lineNoteCount = 0;
    const lineNoteLabels = {
      line: "L",
      line_load: "L",
      neutral: "N",
      switch_return: "返り",
      traveler_1: "3路",
      traveler_2: "3路",
    };
    const lineNoteUsed = new Set();

    (wirePath?.wires || []).forEach((wire) => {
      const yOffset = wire?.role === "traveler_1" ? -3 : wire?.role === "traveler_2" ? 3 : 0;
      const points = (wire?.path || [])
        .filter((point) => typeof point?.x === "number" && typeof point?.y === "number")
        .map((point) => `${point.x},${point.y + yOffset + drawOffsetY}`)
        .join(" ");
      if (!points) return;

      const polyline = document.createElementNS(NS, "polyline");
      polyline.setAttribute("points", points);
      polyline.setAttribute("stroke", roleColors[wire?.role] || "#f5c842");
      polyline.setAttribute("stroke-width", "2");
      polyline.setAttribute("fill", "none");
      polyline.setAttribute("stroke-linecap", "round");
      svg.appendChild(polyline);

      const shortLabel = lineNoteLabels[wire?.role];
      if (shortLabel && lineNoteCount < (isMobileMode ? 1 : 2) && !lineNoteUsed.has(shortLabel)) {
        const pointList = (wire?.path || []).filter((point) => typeof point?.x === "number" && typeof point?.y === "number");
        if (pointList.length) {
          const midPoint = pointList[Math.floor(pointList.length / 2)];
          const lineText = document.createElementNS(NS, "text");
          lineText.setAttribute("x", String(midPoint.x + 4));
          lineText.setAttribute("y", String(midPoint.y + yOffset + drawOffsetY - 4));
          lineText.setAttribute("font-size", "9");
          lineText.setAttribute("fill", roleColors[wire?.role] || "#dddddd");
          lineText.textContent = shortLabel;
          svg.appendChild(lineText);
          lineNoteCount += 1;
          lineNoteUsed.add(shortLabel);
        }
      }
    });

    (layout?.nodes || []).forEach((node) => {
      if (typeof node?.x !== "number" || typeof node?.y !== "number") return;

      const x = node.x;
      const y = node.y + drawOffsetY;
      const nodeKind =
        node?.type === "source"
          ? "source"
          : node?.deviceType === "switch"
            ? "switch"
            : node?.deviceType === "light"
              ? "light"
              : node?.deviceType === "outlet" || node?.deviceType === "ac_outlet"
                ? "outlet"
                : "light";

      if (nodeKind === "source") {
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", String(x - 18));
        rect.setAttribute("y", String(y - 8));
        rect.setAttribute("width", "36");
        rect.setAttribute("height", "16");
        rect.setAttribute("fill", "#2c2c2c");
        rect.setAttribute("stroke", "#999");
        svg.appendChild(rect);
      } else if (nodeKind === "switch") {
        const rect = document.createElementNS(NS, "rect");
        rect.setAttribute("x", String(x - 8));
        rect.setAttribute("y", String(y - 8));
        rect.setAttribute("width", "16");
        rect.setAttribute("height", "16");
        rect.setAttribute("fill", "#3a3a3a");
        rect.setAttribute("stroke", "#bfbfbf");
        svg.appendChild(rect);
      } else if (nodeKind === "outlet") {
        const polygon = document.createElementNS(NS, "polygon");
        polygon.setAttribute("points", `${x - 10},${y - 7} ${x + 10},${y - 7} ${x + 7},${y + 7} ${x - 7},${y + 7}`);
        polygon.setAttribute("fill", "#444");
        polygon.setAttribute("stroke", "#d8d8d8");
        svg.appendChild(polygon);
      } else {
        const circle = document.createElementNS(NS, "circle");
        circle.setAttribute("cx", String(x));
        circle.setAttribute("cy", String(y));
        circle.setAttribute("r", "7");
        circle.setAttribute("fill", "#444");
        circle.setAttribute("stroke", "#d8d8d8");
        svg.appendChild(circle);
      }

      const idText = document.createElementNS(NS, "text");
      idText.setAttribute("x", String(x + 10));
      idText.setAttribute("y", String(y - 10));
      idText.setAttribute("font-size", "11");
      idText.setAttribute("fill", "#f0f0f0");
      idText.textContent = String(node?.id || "-");
      svg.appendChild(idText);

      const typeText = document.createElementNS(NS, "text");
      typeText.setAttribute("x", String(x + 10));
      typeText.setAttribute("y", String(y + 3));
      typeText.setAttribute("font-size", "9");
      typeText.setAttribute("fill", "#aaaaaa");
      typeText.textContent = nodeKind;
      svg.appendChild(typeText);

      const deviceLabelMap = {
        source: "電源",
        switch: "SW",
        light: "照明",
        outlet: "コンセント",
      };
      const deviceLabel = deviceLabelMap[nodeKind];
      if (deviceLabel) {
        const deviceText = document.createElementNS(NS, "text");
        deviceText.setAttribute("x", String(x + 10));
        deviceText.setAttribute("y", String(y + 14));
        deviceText.setAttribute("font-size", "9");
        deviceText.setAttribute("fill", "#ffd966");
        deviceText.textContent = deviceLabel;
        svg.appendChild(deviceText);
      }
    });

    const legend = [
      { key: "line", color: "#f5c842", label: "line" },
      { key: "neutral", color: "#4aa3ff", label: "neutral" },
      { key: "switch_return", color: "#ff6b6b", label: "switch_return" },
      { key: "traveler", color: "#9b59b6", label: "traveler" },
    ];
    legend.forEach((item, idx) => {
      const baseX = 20 + idx * 165;
      const baseY = 408;

      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", String(baseX));
      line.setAttribute("y1", String(baseY));
      line.setAttribute("x2", String(baseX + 22));
      line.setAttribute("y2", String(baseY));
      line.setAttribute("stroke", item.color);
      line.setAttribute("stroke-width", "2");
      svg.appendChild(line);

      const text = document.createElementNS(NS, "text");
      text.setAttribute("x", String(baseX + 28));
      text.setAttribute("y", String(baseY + 4));
      text.setAttribute("font-size", "10");
      text.setAttribute("fill", "#dddddd");
      text.textContent = item.label;
      svg.appendChild(text);
    });

    card.appendChild(svg);
    if (isMobileMode) {
      const summary = document.createElement("div");
      summary.setAttribute(
        "style",
        "margin-top:6px;padding:8px 10px;background:#262626;border:1px solid #555;border-radius:6px;color:#d8d8d8;font-size:10px;line-height:1.45;"
      );
      if (selectedCircuit.hasSelection) {
        summary.style.borderColor = isSelectedCircuit ? "#8fb3e0" : "#555";
      }

      const headerRow = document.createElement("div");
      headerRow.setAttribute("style", "color:#ffffff;font-size:11px;margin-bottom:4px;");
      headerRow.textContent = `回路: ${circuitLabel} / 器具数: ${nodeCount} / 配線数: ${wireCount}${hasThreeway ? " / 3路配線あり" : ""}`;
      summary.appendChild(headerRow);

      const materialTitleRow = document.createElement("div");
      materialTitleRow.setAttribute("style", "color:#ffffff;font-size:11px;margin-top:4px;");
      materialTitleRow.textContent = "材料";
      summary.appendChild(materialTitleRow);
      materialLines.forEach((line) => {
        const row = document.createElement("div");
        row.textContent = line;
        summary.appendChild(row);
      });

      const sleeveTitleRow = document.createElement("div");
      sleeveTitleRow.setAttribute("style", "color:#ffffff;font-size:11px;margin-top:6px;");
      sleeveTitleRow.textContent = "スリーブ判定";
      summary.appendChild(sleeveTitleRow);
      visibleSleeveLines.forEach((line) => {
        const row = document.createElement("div");
        row.setAttribute("style", `color:${line.isAlert ? "#ffb86b" : "#d8d8d8"};`);
        row.textContent = line.text;
        summary.appendChild(row);
      });

      card.appendChild(summary);
    }
    panel.appendChild(card);
  });
}

function ensureAiDiagramModeSwitcher() {
  const panel = document.getElementById("ai-diagram-preview-result");
  if (!panel || !panel.parentElement) return;
  if (!aiDiagramDeveloperMode && aiDiagramPreviewMode !== "exam_style") {
    aiDiagramPreviewMode = "exam_style";
  }

  let switcher = document.getElementById("ai-diagram-mode-switcher");
  if (!switcher) {
    switcher = document.createElement("div");
    switcher.id = "ai-diagram-mode-switcher";
    switcher.setAttribute(
      "style",
      "display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 8px 0;"
    );
    panel.parentElement.insertBefore(switcher, panel);
  }
  switcher.innerHTML = "";

  const modeButtonsWrap = document.createElement("div");
  modeButtonsWrap.setAttribute("style", "display:flex;gap:6px;flex-wrap:wrap;align-items:center;");
  switcher.appendChild(modeButtonsWrap);

  const createModeButton = (modeKey, label) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.mode = modeKey;
    btn.textContent = label;
    btn.setAttribute(
      "style",
      "padding:4px 10px;border:1px solid #555;border-radius:6px;background:#2b2b2b;color:#ddd;cursor:pointer;font-size:12px;"
    );
    btn.addEventListener("click", () => {
      aiDiagramPreviewMode = modeKey;
      ensureAiDiagramModeSwitcher();
      renderAiDiagramByMode();
    });
    modeButtonsWrap.appendChild(btn);
    return btn;
  };

  const examBtn = createModeButton("exam_style", "試験式複線図");
  if (aiDiagramDeveloperMode) {
    createModeButton("preview", "Preview");
    createModeButton("enhanced", "Enhanced");
  }

  const developerBtn = document.createElement("button");
  developerBtn.type = "button";
  developerBtn.dataset.mode = "developer";
  developerBtn.textContent = "開発者表示";
  developerBtn.setAttribute(
    "style",
    "padding:3px 8px;border:1px solid #555;border-radius:6px;background:#222;color:#bbb;cursor:pointer;font-size:11px;"
  );
  developerBtn.addEventListener("click", () => {
    aiDiagramDeveloperMode = !aiDiagramDeveloperMode;
    if (!aiDiagramDeveloperMode && aiDiagramPreviewMode !== "exam_style") {
      aiDiagramPreviewMode = "exam_style";
    }
    ensureAiDiagramModeSwitcher();
    renderAiDiagramByMode();
  });
  modeButtonsWrap.appendChild(developerBtn);

  const buttons = Array.from(switcher.querySelectorAll("button[data-mode]"));
  buttons.forEach((btn) => {
    if (btn.dataset.mode === "developer") {
      btn.style.background = aiDiagramDeveloperMode ? "#3c3c3c" : "#222";
      btn.style.borderColor = aiDiagramDeveloperMode ? "#9aa0a6" : "#555";
      btn.style.color = aiDiagramDeveloperMode ? "#ffffff" : "#bbbbbb";
      return;
    }
    const active = btn.dataset.mode === aiDiagramPreviewMode;
    btn.style.background = active ? "#4a6fa1" : "#2b2b2b";
    btn.style.borderColor = active ? "#8fb3e0" : "#555";
    btn.style.color = active ? "#ffffff" : "#dddddd";
  });
  examBtn.style.fontWeight = "600";

  const helper = document.createElement("div");
  helper.setAttribute("style", "font-size:11px;color:#aeb4bb;margin-top:2px;");
  if (aiDiagramDeveloperMode) {
    helper.textContent = `開発者表示: mode=${aiDiagramPreviewMode} / circuits=${aiDiagramRenderState.circuits} / layouts=${aiDiagramRenderState.layouts}`;
  } else {
    helper.textContent = "試験式複線図を表示中";
  }
  switcher.appendChild(helper);
}

function renderAiDiagramByMode(sceneModel) {
  const panel = document.getElementById("ai-diagram-preview-result");
  if (!panel) return;

  let groups = [];
  if (sceneModel && Array.isArray(sceneModel.groups)) {
    groups = sceneModel.groups;
  } else {
    const parsed = parseGroupsFromDom();
    groups = parsed.groups;
  }

  let circuits = [];
  let layouts = [];
  if (groups.length) {
    circuits = createCircuitsFromGroups(groups);
    const graphs = createCircuitGraphFromCircuits(circuits);
    layouts = createDiagramLayoutsFromGraphs(graphs);
  }
  aiDiagramRenderState = {
    circuits: circuits.length,
    layouts: layouts.length,
    message: "",
  };

  ensureAiDiagramModeSwitcher();
  if (!groups.length || !circuits.length || !layouts.length) {
    panel.innerHTML = "";
    const empty = document.createElement("div");
    empty.setAttribute(
      "style",
      "padding:10px 12px;border:1px solid #555;border-radius:6px;background:#262626;color:#d8d8d8;line-height:1.5;"
    );
    const title = document.createElement("div");
    title.setAttribute("style", "font-size:12px;color:#ffffff;margin-bottom:2px;");
    title.textContent = "複線図を表示できません";
    const desc = document.createElement("div");
    desc.setAttribute("style", "font-size:11px;color:#bbbbbb;");
    desc.textContent = "回路情報が不足しています";
    empty.appendChild(title);
    empty.appendChild(desc);
    panel.appendChild(empty);
    aiDiagramRenderState.message = "empty";
    ensureAiDiagramModeSwitcher();
    return;
  }

  try {
    if (aiDiagramPreviewMode === "preview") {
      renderAiDiagramPreview(sceneModel);
    } else if (aiDiagramPreviewMode === "enhanced") {
      renderAiDiagramEnhanced(sceneModel);
    } else {
      renderAiDiagramExamStyle(sceneModel);
    }
  } catch (_error) {
    panel.innerHTML = "";
    const fallback = document.createElement("div");
    fallback.setAttribute(
      "style",
      "padding:10px 12px;border:1px solid #555;border-radius:6px;background:#262626;color:#d8d8d8;line-height:1.5;"
    );
    const title = document.createElement("div");
    title.setAttribute("style", "font-size:12px;color:#ffffff;margin-bottom:2px;");
    title.textContent = "複線図を表示できません";
    const desc = document.createElement("div");
    desc.setAttribute("style", "font-size:11px;color:#bbbbbb;");
    desc.textContent = "描画中に状態を復旧しました";
    fallback.appendChild(title);
    fallback.appendChild(desc);
    panel.appendChild(fallback);
    aiDiagramRenderState.message = "fallback";
  }

  ensureAiDiagramModeSwitcher();
}

function renderConnectionPointsEditor(sceneModel) {
  const panel = document.getElementById("connection-points-editor");
  if (!panel) return;

  let connectionPoints = [];
  if (sceneModel && Array.isArray(sceneModel.connectionPoints)) {
    connectionPointsEditorSceneModel = sceneModel;
    connectionPoints = sceneModel.connectionPoints;
  } else {
    let groups = [];
    if (sceneModel && Array.isArray(sceneModel.groups)) {
      groups = sceneModel.groups;
    } else {
      const parsed = parseGroupsFromDom();
      groups = parsed.groups;
    }
    const circuits = createCircuitsFromGroups(groups);
    connectionPoints = createConnectionPointsFromCircuits(circuits);
    connectionPointsEditorSceneModel = { connectionPoints };
  }

  panel.innerHTML = "";
  if (!Array.isArray(connectionPoints) || !connectionPoints.length) {
    panel.textContent = "接続点なし";
    return;
  }

  const toPointLabel = (point, index) => {
    const pointId = String(point?.id || "");
    const hit = pointId.match(/(\d+)(?!.*\d)/);
    return hit ? `CP${hit[1]}` : `CP${index + 1}`;
  };

  const toDeviceLabel = (item, fallbackIndex) => {
    if (typeof item === "string") return item;
    const type = item?.deviceType || item?.type || "";
    const id = String(item?.deviceId || item?.id || "");
    const indexHit = id.match(/(\d+)(?!.*\d)/);
    const suffix = indexHit ? indexHit[1] : String(fallbackIndex + 1);
    if (type === "switch") return `SW${suffix}`;
    if (type === "light") return `LIGHT${suffix}`;
    if (type === "outlet" || type === "ac_outlet") return `OUTLET${suffix}`;
    if (type === "junction") return `JUNCTION${suffix}`;
    if (id) return id.toUpperCase();
    return `DEVICE${suffix}`;
  };

  const detectConnectionPointType = (devices) => {
    const labels = Array.isArray(devices) ? devices.map((item, index) => toDeviceLabel(item, index).toUpperCase()) : [];
    if (labels.some((label) => label.includes("SW"))) return "switch_box";
    if (labels.some((label) => label.includes("OUTLET"))) return "outlet_box";
    return "junction";
  };

  const heightProfiles = renderConnectionPointHeights(sceneModel);
  const deviceHeightsByPoint = renderConnectionPointDeviceHeights(sceneModel);

  connectionPoints.forEach((point, index) => {
    const card = document.createElement("div");
    card.className = "cp-card";
    card.setAttribute("style", "padding:12px;margin-bottom:10px;border:1px solid #ddd;border-radius:8px;");

    const title = document.createElement("div");
    title.textContent = `接続点 ${toPointLabel(point, index)}`;
    card.appendChild(title);

    const sourceDevices = Array.isArray(point?.devices)
      ? point.devices
      : Array.isArray(point?.connectedDevices)
        ? point.connectedDevices
        : [point];
    const typeText = document.createElement("small");
    typeText.textContent = `type: ${detectConnectionPointType(sourceDevices)}`;
    card.appendChild(typeText);

    const height = heightProfiles[index] || getConnectionPointHeightProfile(point);
    const heightBlock = document.createElement("div");
    heightBlock.setAttribute("style", "font-size:12px;line-height:1.4;margin-top:4px;");
    const heightTitle = document.createElement("div");
    heightTitle.textContent = "高さ情報";
    const trunk = document.createElement("div");
    trunk.textContent = `trunkHeight: ${height.trunkHeight}mm`;
    const branch = document.createElement("div");
    branch.textContent = `branchDrop: ${height.branchDrop}mm`;
    heightBlock.appendChild(heightTitle);
    heightBlock.appendChild(trunk);
    heightBlock.appendChild(branch);
    card.appendChild(heightBlock);

    const list = document.createElement("ul");
    sourceDevices.forEach((device, deviceIndex) => {
      const li = document.createElement("li");
      const deviceLabel = toDeviceLabel(device, deviceIndex);
      li.textContent = deviceLabel;

      const deviceHeightWrap = document.createElement("div");
      const pointDeviceHeights = Array.isArray(deviceHeightsByPoint[index]) ? deviceHeightsByPoint[index] : [];
      const height = Number.isFinite(Number(pointDeviceHeights[deviceIndex]))
        ? Number(pointDeviceHeights[deviceIndex])
        : getDefaultDeviceHeight(deviceLabel);
      deviceHeightWrap.textContent = `高さ: ${height}mm`;
      deviceHeightWrap.appendChild(document.createTextNode(" "));

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "編集";
      editButton.addEventListener("click", () => {
        handleEditDeviceHeight(index, deviceIndex);
      });
      deviceHeightWrap.appendChild(editButton);

      li.appendChild(deviceHeightWrap);
      list.appendChild(li);
    });
    card.appendChild(list);

    const addButton = document.createElement("button");
    addButton.className = "cp-add-device";
    addButton.type = "button";
    addButton.textContent = "＋器具追加";
    addButton.addEventListener("click", () => {
      handleAddDeviceToConnectionPoint(index);
    });
    card.appendChild(addButton);

    panel.appendChild(card);
  });
}

function getConnectionPointHeightProfile(cp) {
  const trunkRaw = Number(cp?.trunkHeight);
  const branchRaw = Number(cp?.branchDrop);
  return {
    trunkHeight: Number.isFinite(trunkRaw) ? trunkRaw : 2400,
    branchDrop: Number.isFinite(branchRaw) ? branchRaw : 800,
  };
}

function getDefaultDeviceHeight(deviceName) {
  const name = String(deviceName || "").toUpperCase();
  if (name.includes("LIGHT")) return 2400;
  if (name.includes("SW")) return 1200;
  if (name.includes("OUTLET")) return 300;
  return 1200;
}

function renderConnectionPointHeights(sceneModel) {
  const points = sceneModel && Array.isArray(sceneModel.connectionPoints) ? sceneModel.connectionPoints : [];
  if (!Array.isArray(points) || !points.length) return [];
  return points.map((cp) => getConnectionPointHeightProfile(cp));
}

function renderConnectionPointDeviceHeights(sceneModel) {
  const points = sceneModel && Array.isArray(sceneModel.connectionPoints) ? sceneModel.connectionPoints : [];
  if (!Array.isArray(points) || !points.length) return [];
  return points.map((cp) => {
    const devices = Array.isArray(cp?.devices) ? cp.devices : [];
    const heightStore = cp && (Array.isArray(cp.deviceHeights) || typeof cp.deviceHeights === "object") ? cp.deviceHeights : [];
    return devices.map((device, index) => {
      const label =
        typeof device === "string"
          ? device
          : String(device?.deviceId || device?.id || device?.name || device?.type || device?.deviceType || `DEVICE${index + 1}`);
      const saved = Number(heightStore?.[index]);
      return Number.isFinite(saved) && saved > 0 ? saved : getDefaultDeviceHeight(label);
    });
  });
}

function getCircuitHeightProfile(sceneModel) {
  const profile = sceneModel && typeof sceneModel.circuitHeightProfile === "object" ? sceneModel.circuitHeightProfile : {};
  const panelRiseRaw = Number(profile?.panelRise);
  const slackRaw = Number(profile?.slack);
  return {
    panelRise: Number.isFinite(panelRiseRaw) && panelRiseRaw > 0 ? panelRiseRaw : 1500,
    slack: Number.isFinite(slackRaw) && slackRaw > 0 ? slackRaw : 300,
  };
}

function handleAddDeviceToConnectionPoint(cpIndex) {
  const model = connectionPointsEditorSceneModel;
  if (!model || !Array.isArray(model.connectionPoints)) return;
  const point = model.connectionPoints[cpIndex];
  if (!point) return;

  const input = prompt("器具名を入力してください");
  const deviceName = typeof input === "string" ? input.trim() : "";
  if (!deviceName) return;

  if (!Array.isArray(point.devices)) point.devices = [];
  point.devices.push(deviceName);
  renderConnectionPointsEditor(model);
}

function handleEditDeviceHeight(cpIndex, deviceIndex) {
  const model = connectionPointsEditorSceneModel;
  if (!model || !Array.isArray(model.connectionPoints)) return;
  const point = model.connectionPoints[cpIndex];
  if (!point) return;

  const devices = Array.isArray(point.devices) ? point.devices : [];
  const target = devices[deviceIndex];
  if (typeof target === "undefined") return;

  const label =
    typeof target === "string"
      ? target
      : String(target?.deviceId || target?.id || target?.name || target?.type || target?.deviceType || "");
  const fallbackHeight = getDefaultDeviceHeight(label);

  if (!Array.isArray(point.deviceHeights) && typeof point.deviceHeights !== "object") {
    point.deviceHeights = [];
  }
  const currentRaw = Number(point.deviceHeights?.[deviceIndex]);
  const current = Number.isFinite(currentRaw) && currentRaw > 0 ? currentRaw : fallbackHeight;
  const input = prompt("器具高さ(mm)を入力してください", String(current));
  const value = Number(typeof input === "string" ? input.trim() : "");
  if (!Number.isFinite(value) || value <= 0) return;

  point.deviceHeights[deviceIndex] = value;
  renderConnectionPointsEditor(model);
  renderConnectionPointRoute(model);
}

function handleEditPanelRise(sceneModel) {
  const model = sceneModel && typeof sceneModel === "object" ? sceneModel : connectionPointsEditorSceneModel;
  if (!model || typeof model !== "object") return;
  const profile = getCircuitHeightProfile(model);

  if (!model.circuitHeightProfile || typeof model.circuitHeightProfile !== "object") {
    model.circuitHeightProfile = {};
  }
  const input = prompt("分電盤立ち上げ高さ(mm)を入力してください", String(profile.panelRise));
  const value = Number(typeof input === "string" ? input.trim() : "");
  if (!Number.isFinite(value) || value <= 0) return;

  model.circuitHeightProfile.panelRise = value;
  renderConnectionPointsEditor(model);
  renderConnectionPointRoute(model);
}

function handleEditSlack(sceneModel) {
  const model = sceneModel && typeof sceneModel === "object" ? sceneModel : connectionPointsEditorSceneModel;
  if (!model || typeof model !== "object") return;
  const profile = getCircuitHeightProfile(model);

  if (!model.circuitHeightProfile || typeof model.circuitHeightProfile !== "object") {
    model.circuitHeightProfile = {};
  }
  const input = prompt("余長(mm)を入力してください", String(profile.slack));
  const value = Number(typeof input === "string" ? input.trim() : "");
  if (!Number.isFinite(value) || value <= 0) return;

  model.circuitHeightProfile.slack = value;
  renderConnectionPointsEditor(model);
  renderConnectionPointRoute(model);
}

function moveConnectionPoint(index, direction) {
  const model = connectionPointsEditorSceneModel;
  if (!model || !Array.isArray(model.connectionPoints)) return;
  const points = model.connectionPoints;
  if (!Number.isInteger(index) || index < 0 || index >= points.length) return;

  const targetIndex = direction === "up" ? index - 1 : direction === "down" ? index + 1 : -1;
  if (targetIndex < 0 || targetIndex >= points.length) return;

  const temp = points[index];
  points[index] = points[targetIndex];
  points[targetIndex] = temp;

  renderConnectionPointRoute(model);
  renderConnectionPointsEditor(model);
}

function renderConnectionPointBranches(sceneModel) {
  const connectionPoints = sceneModel && Array.isArray(sceneModel.connectionPoints) ? sceneModel.connectionPoints : [];
  return connectionPoints.map((point) => {
    const list = document.createElement("ul");
    list.className = "cp-branches";

    const devices = Array.isArray(point?.devices) ? point.devices : [];
    if (!devices.length) {
      const li = document.createElement("li");
      li.textContent = "枝なし";
      list.appendChild(li);
      return list;
    }

    devices.forEach((device, index) => {
      const li = document.createElement("li");
      const label =
        typeof device === "string"
          ? device
          : String(device?.deviceId || device?.id || device?.name || device?.type || "UNKNOWN");
      const prefix = index === devices.length - 1 ? "└ " : "├ ";
      li.textContent = `${prefix}${label}`;
      list.appendChild(li);
    });
    return list;
  });
}

function estimateConnectionPointWireLength(sceneModel) {
  const connectionPoints = sceneModel && Array.isArray(sceneModel.connectionPoints) ? sceneModel.connectionPoints : [];
  if (!Array.isArray(connectionPoints) || connectionPoints.length < 2) {
    return { trunkSegments: [], branchSegments: [] };
  }
  const circuitHeight = getCircuitHeightProfile(sceneModel);

  const toCpLabel = (point, fallbackIndex) => {
    const pointId = String(point?.id || "");
    const hit = pointId.match(/(\d+)(?!.*\d)/);
    return hit ? `CP${hit[1]}` : `CP${fallbackIndex + 1}`;
  };
  const toDeviceLabel = (device, fallbackIndex) => {
    if (typeof device === "string") return device;
    const raw = String(device?.deviceId || device?.id || device?.name || device?.type || device?.deviceType || "");
    return raw || `DEVICE${fallbackIndex + 1}`;
  };

  const trunkSegments = [];
  const branchSegments = [];
  const panelHorizontalRaw = Number(connectionPoints[0]?.horizontalSpanFromPanel);
  const panelHorizontal = Number.isFinite(panelHorizontalRaw) && panelHorizontalRaw > 0 ? panelHorizontalRaw : 2000;
  const panelCircuitId =
    typeof connectionPoints[0]?.circuitId === "number"
      ? connectionPoints[0].circuitId
      : null;
  trunkSegments.push({
    fromIndex: -1,
    toIndex: 0,
    fromLabel: "分電盤",
    toLabel: toCpLabel(connectionPoints[0], 0),
    lengthMm: panelHorizontal + circuitHeight.panelRise,
    circuitId: panelCircuitId,
  });

  connectionPoints.forEach((point, index) => {
    const current = getConnectionPointHeightProfile(point);
    const cpLabel = toCpLabel(point, index);
    const circuitId = typeof point?.circuitId === "number" ? point.circuitId : null;
    const devices = Array.isArray(point?.devices) ? point.devices : [];
    const heightStore = point && (Array.isArray(point.deviceHeights) || typeof point.deviceHeights === "object") ? point.deviceHeights : [];
    devices.forEach((device, deviceIndex) => {
      const deviceLabel = toDeviceLabel(device, deviceIndex);
      const saved = Number(heightStore?.[deviceIndex]);
      const deviceHeight = Number.isFinite(saved) && saved > 0 ? saved : getDefaultDeviceHeight(deviceLabel);
      const lengthMm = Math.max(0, current.trunkHeight - deviceHeight) + circuitHeight.slack;
      branchSegments.push({
        cpIndex: index,
        cpLabel,
        deviceLabel,
        lengthMm,
        circuitId,
      });
    });

    if (index >= connectionPoints.length - 1) return;
    const next = getConnectionPointHeightProfile(connectionPoints[index + 1]);
    const horizontalRaw = Number(point?.horizontalSpanToNext);
    const horizontalSpan = Number.isFinite(horizontalRaw) && horizontalRaw > 0 ? horizontalRaw : 2000;
    const lengthMm = horizontalSpan + Math.abs(current.trunkHeight - next.trunkHeight);
    trunkSegments.push({
      fromIndex: index,
      toIndex: index + 1,
      fromLabel: cpLabel,
      toLabel: toCpLabel(connectionPoints[index + 1], index + 1),
      lengthMm,
      circuitId,
    });
  });
  return { trunkSegments, branchSegments };
}

function aggregateCableLengthsByMaterial(sceneModel) {
  let model = sceneModel;
  if (!model || typeof model !== "object") {
    if (connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object") {
      model = connectionPointsEditorSceneModel;
    } else {
      model = {};
    }
  }

  const estimate = estimateConnectionPointWireLength(model);
  const trunkSegments = Array.isArray(estimate?.trunkSegments) ? estimate.trunkSegments : [];
  const branchSegments = Array.isArray(estimate?.branchSegments) ? estimate.branchSegments : [];
  const allSegments = [
    ...trunkSegments.map((segment) => ({ ...segment, kind: "trunk" })),
    ...branchSegments.map((segment) => ({ ...segment, kind: "branch" })),
  ];
  if (!allSegments.length) return [];

  let circuits = Array.isArray(model?.circuits) ? model.circuits : [];
  if (!circuits.length) {
    const groups = Array.isArray(model?.groups) ? model.groups : parseGroupsFromDom().groups;
    circuits = createCircuitsFromGroups(groups);
  }
  const materials = Array.isArray(model?.materials) ? model.materials : createMaterialsFromCircuits(circuits);
  const firstMaterialName = (Array.isArray(materials) && materials[0]?.name) ? materials[0].name : null;
  const materialsByCircuit = new Map();
  circuits.forEach((circuit) => {
    const list = createMaterialsForCircuit(circuit);
    materialsByCircuit.set(circuit?.id, list);
  });

  const pickMaterialName = (segment) => {
    const circuitMaterials = materialsByCircuit.get(segment?.circuitId) || [];
    if (segment?.kind === "trunk") {
      return circuitMaterials[0]?.name || firstMaterialName || "未判定材料";
    }

    const label = String(segment?.deviceLabel || "").toUpperCase();
    const findByHint = (hintList) =>
      circuitMaterials.find((material) => {
        const text = `${material?.name || ""} ${material?.type || ""}`.toUpperCase();
        return hintList.some((hint) => text.includes(hint));
      });
    if (label.includes("OUTLET")) {
      const hit = findByHint(["OUTLET", "コンセント"]);
      if (hit?.name) return hit.name;
    }
    if (label.includes("SW")) {
      const hit = findByHint(["SWITCH", "スイッチ"]);
      if (hit?.name) return hit.name;
    }
    if (label.includes("LIGHT")) {
      const hit = findByHint(["LIGHT", "照明"]);
      if (hit?.name) return hit.name;
    }
    return circuitMaterials[0]?.name || firstMaterialName || "未判定材料";
  };

  const sumByMaterial = new Map();
  allSegments.forEach((segment) => {
    const name = pickMaterialName(segment);
    const lengthMm = Number(segment?.lengthMm || 0);
    if (!Number.isFinite(lengthMm) || lengthMm <= 0) return;
    sumByMaterial.set(name, (sumByMaterial.get(name) || 0) + lengthMm);
  });

  return Array.from(sumByMaterial.entries()).map(([name, lengthMm]) => ({
    name,
    lengthMm,
  }));
}

function aggregateCableLengthsByCircuit(sceneModel) {
  let model = sceneModel;
  if (!model || typeof model !== "object") {
    if (connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object") {
      model = connectionPointsEditorSceneModel;
    } else {
      model = {};
    }
  }

  const estimate = estimateConnectionPointWireLength(model);
  const trunkSegments = Array.isArray(estimate?.trunkSegments) ? estimate.trunkSegments : [];
  const branchSegments = Array.isArray(estimate?.branchSegments) ? estimate.branchSegments : [];
  const allSegments = [
    ...trunkSegments.map((segment) => ({ ...segment, kind: "trunk" })),
    ...branchSegments.map((segment) => ({ ...segment, kind: "branch" })),
  ];
  if (!allSegments.length) return {};

  let circuits = Array.isArray(model?.circuits) ? model.circuits : [];
  if (!circuits.length) {
    const groups = Array.isArray(model?.groups) ? model.groups : parseGroupsFromDom().groups;
    circuits = createCircuitsFromGroups(groups);
  }
  const materials = Array.isArray(model?.materials) ? model.materials : createMaterialsFromCircuits(circuits);
  const firstMaterialName = (Array.isArray(materials) && materials[0]?.name) ? materials[0].name : null;
  const materialsByCircuit = new Map();
  circuits.forEach((circuit) => {
    const list = createMaterialsForCircuit(circuit);
    materialsByCircuit.set(circuit?.id, list);
  });

  const pickMaterialName = (segment) => {
    const circuitMaterials = materialsByCircuit.get(segment?.circuitId) || [];
    if (segment?.kind === "trunk") {
      return circuitMaterials[0]?.name || firstMaterialName || "未判定材料";
    }

    const label = String(segment?.deviceLabel || "").toUpperCase();
    const findByHint = (hintList) =>
      circuitMaterials.find((material) => {
        const text = `${material?.name || ""} ${material?.type || ""}`.toUpperCase();
        return hintList.some((hint) => text.includes(hint));
      });
    if (label.includes("OUTLET")) {
      const hit = findByHint(["OUTLET", "コンセント"]);
      if (hit?.name) return hit.name;
    }
    if (label.includes("SW")) {
      const hit = findByHint(["SWITCH", "スイッチ"]);
      if (hit?.name) return hit.name;
    }
    if (label.includes("LIGHT")) {
      const hit = findByHint(["LIGHT", "照明"]);
      if (hit?.name) return hit.name;
    }
    return circuitMaterials[0]?.name || firstMaterialName || "未判定材料";
  };

  const byCircuit = {};
  allSegments.forEach((segment) => {
    const lengthMm = Number(segment?.lengthMm || 0);
    if (!Number.isFinite(lengthMm) || lengthMm <= 0) return;
    const materialName = pickMaterialName(segment);
    const circuitId = Number.isFinite(Number(segment?.circuitId)) ? Number(segment.circuitId) : null;
    const circuitLabel = circuitId !== null ? `回路${circuitId}` : "回路不明";
    if (!byCircuit[circuitLabel]) byCircuit[circuitLabel] = {};
    byCircuit[circuitLabel][materialName] = (byCircuit[circuitLabel][materialName] || 0) + lengthMm;
  });
  return byCircuit;
}

function renderCableLengthSummary(sceneModel) {
  const panel = document.getElementById("cable-length-summary");
  if (!panel) return;

  const rows = aggregateCableLengthsByMaterial(sceneModel);
  panel.innerHTML = "";
  if (!rows.length) {
    panel.textContent = "配線材料長さデータなし";
    return;
  }

  const title = document.createElement("div");
  title.textContent = "配線材料長さ概算";
  panel.appendChild(title);

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.setAttribute("style", "display:flex;justify-content:space-between;gap:8px;");
    const left = document.createElement("span");
    left.textContent = row.name;
    const right = document.createElement("span");
    right.textContent = `${(Number(row.lengthMm || 0) / 1000).toFixed(1)}m`;
    item.appendChild(left);
    item.appendChild(right);
    panel.appendChild(item);
  });
}

function renderCircuitCableLengthSummary(sceneModel) {
  const panel = document.getElementById("circuit-cable-length-summary");
  if (!panel) return;

  const byCircuit = aggregateCableLengthsByCircuit(sceneModel);
  const circuitEntries = Object.entries(byCircuit || {});
  panel.innerHTML = "";
  if (!circuitEntries.length) {
    panel.textContent = "配線材料長さデータなし";
    return;
  }

  circuitEntries.forEach(([circuitLabel, materialMap]) => {
    const circuitBlock = document.createElement("div");
    circuitBlock.setAttribute("style", "padding:10px;margin-bottom:8px;border:1px solid #ddd;border-radius:8px;");

    const title = document.createElement("div");
    title.textContent = circuitLabel;
    circuitBlock.appendChild(title);

    Object.entries(materialMap || {}).forEach(([materialName, lengthMm]) => {
      const row = document.createElement("div");
      row.setAttribute("style", "display:flex;justify-content:space-between;gap:8px;");
      const left = document.createElement("span");
      left.textContent = materialName;
      const right = document.createElement("strong");
      right.textContent = `${(Number(lengthMm || 0) / 1000).toFixed(1)}m`;
      row.appendChild(left);
      row.appendChild(right);
      circuitBlock.appendChild(row);
    });

    panel.appendChild(circuitBlock);
  });
}

function aggregateSleeveMaterials(sceneModel) {
  let model = sceneModel;
  if (!model || typeof model !== "object") {
    if (connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object") {
      model = connectionPointsEditorSceneModel;
    } else {
      model = {};
    }
  }

  const sleeveResults = Array.isArray(model?.sleeveResults) ? model.sleeveResults : [];
  if (!sleeveResults.length) return {};

  const toSleeveLabel = (item) => {
    const raw = String(item?.sleeveSize || item?.size || item?.sleeveType || item?.type || "").toLowerCase();
    if (raw === "small") return "小スリーブ";
    if (raw === "middle" || raw === "medium") return "中スリーブ";
    if (raw === "large") return "大スリーブ";
    return null;
  };

  const result = {};
  sleeveResults.forEach((item) => {
    const label = toSleeveLabel(item);
    if (!label) return;
    const qtyRaw = Number(item?.quantity);
    const qty = Number.isFinite(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
    result[label] = (result[label] || 0) + qty;
  });
  return result;
}

function renderSleeveMaterialSummary(sceneModel) {
  const panel = document.getElementById("sleeve-material-summary");
  if (!panel) return;

  const summary = aggregateSleeveMaterials(sceneModel);
  const rows = Object.entries(summary || {});
  panel.innerHTML = "";
  if (!rows.length) {
    panel.textContent = "スリーブ材料データなし";
    return;
  }

  rows.forEach(([name, qty]) => {
    const row = document.createElement("div");
    row.setAttribute("style", "display:flex;justify-content:space-between;gap:8px;");
    const left = document.createElement("span");
    left.textContent = name;
    const right = document.createElement("strong");
    right.textContent = String(qty);
    row.appendChild(left);
    row.appendChild(right);
    panel.appendChild(row);
  });
}

function aggregateJunctionBoxMaterials(sceneModel) {
  let model = sceneModel;
  if (!model || typeof model !== "object") {
    if (connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object") {
      model = connectionPointsEditorSceneModel;
    } else {
      model = {};
    }
  }

  const connectionPoints = Array.isArray(model?.connectionPoints) ? model.connectionPoints : [];
  if (!connectionPoints.length) return {};

  const resolveConnectionCount = (point) => {
    const numericCandidates = [
      point?.branchCount,
      point?.connectionCount,
      point?.connectedCount,
      point?.wireCount,
      point?.totalConnections,
      point?.degree,
      point?.fanOut,
    ];
    for (let i = 0; i < numericCandidates.length; i += 1) {
      const value = Number(numericCandidates[i]);
      if (Number.isFinite(value) && value >= 0) return value;
    }

    const arrayCandidates = [
      point?.connections,
      point?.connectedPoints,
      point?.connectedDevices,
      point?.devices,
      point?.branches,
      point?.branchPoints,
      point?.wires,
      point?.terminals,
    ];
    for (let i = 0; i < arrayCandidates.length; i += 1) {
      if (Array.isArray(arrayCandidates[i])) return arrayCandidates[i].length;
    }

    const objectCandidates = [point?.connections, point?.adjacent, point?.links];
    for (let i = 0; i < objectCandidates.length; i += 1) {
      const candidate = objectCandidates[i];
      if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
        const keys = Object.keys(candidate);
        if (keys.length) return keys.length;
      }
    }

    return null;
  };

  const resolveBoxLabel = (connectionCount) => {
    if (!Number.isFinite(connectionCount)) return null;
    if (connectionCount <= 3) return "小BOX";
    if (connectionCount <= 5) return "中BOX";
    return "大BOX";
  };

  const counts = {
    小BOX: 0,
    中BOX: 0,
    大BOX: 0,
  };

  connectionPoints.forEach((point) => {
    const connectionCount = resolveConnectionCount(point);
    if (!Number.isFinite(connectionCount) || connectionCount < 2) return;
    const boxLabel = resolveBoxLabel(connectionCount);
    if (!boxLabel) return;
    counts[boxLabel] += 1;
  });

  const compact = {};
  if (counts["小BOX"] > 0) compact["小BOX"] = counts["小BOX"];
  if (counts["中BOX"] > 0) compact["中BOX"] = counts["中BOX"];
  if (counts["大BOX"] > 0) compact["大BOX"] = counts["大BOX"];
  return compact;
}

function renderJunctionBoxMaterialSummary(sceneModel) {
  const panel = document.getElementById("junction-box-material-summary");
  if (!panel) return;

  const summary = aggregateJunctionBoxMaterials(sceneModel);
  const rows = Object.entries(summary || {});
  panel.innerHTML = "";
  if (!rows.length) {
    panel.textContent = "ジョイントBOX材料データなし";
    return;
  }

  const card = document.createElement("div");
  card.setAttribute("style", "padding:10px;border:1px solid #ddd;border-radius:8px;");
  rows.forEach(([name, qty]) => {
    const row = document.createElement("div");
    row.setAttribute("style", "display:flex;justify-content:space-between;gap:8px;");
    const left = document.createElement("span");
    left.textContent = name;
    const right = document.createElement("strong");
    right.textContent = String(qty);
    row.appendChild(left);
    row.appendChild(right);
    card.appendChild(row);
  });
  panel.appendChild(card);
}

function aggregateDeviceMaterials(sceneModel) {
  let model = sceneModel;
  if (!model || typeof model !== "object") {
    if (connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object") {
      model = connectionPointsEditorSceneModel;
    } else {
      model = {};
    }
  }

  const connectionPoints = Array.isArray(model?.connectionPoints) ? model.connectionPoints : [];
  if (!connectionPoints.length) return {};

  const result = {
    スイッチ: 0,
    コンセント: 0,
    照明器具: 0,
  };

  const toDeviceLabel = (device) => {
    const raw =
      typeof device === "string"
        ? device
        : String(device?.deviceId || device?.id || device?.name || device?.type || device?.deviceType || "");
    const text = raw.toUpperCase();
    if (text.includes("SW")) return "スイッチ";
    if (text.includes("OUTLET")) return "コンセント";
    if (text.includes("LIGHT")) return "照明器具";
    return null;
  };

  connectionPoints.forEach((point) => {
    const devices = Array.isArray(point?.devices) ? point.devices : [];
    devices.forEach((device) => {
      const label = toDeviceLabel(device);
      if (!label) return;
      result[label] += 1;
    });
  });

  const compact = {};
  if (result["スイッチ"] > 0) compact["スイッチ"] = result["スイッチ"];
  if (result["コンセント"] > 0) compact["コンセント"] = result["コンセント"];
  if (result["照明器具"] > 0) compact["照明器具"] = result["照明器具"];
  return compact;
}

function renderDeviceMaterialSummary(sceneModel) {
  const panel = document.getElementById("device-material-summary");
  if (!panel) return;

  const summary = aggregateDeviceMaterials(sceneModel);
  const rows = Object.entries(summary || {});
  panel.innerHTML = "";
  if (!rows.length) {
    panel.textContent = "器具材料データなし";
    return;
  }

  rows.forEach(([name, qty]) => {
    const row = document.createElement("div");
    row.setAttribute("style", "display:flex;justify-content:space-between;gap:8px;");
    const left = document.createElement("span");
    left.textContent = name;
    const right = document.createElement("strong");
    right.textContent = String(qty);
    row.appendChild(left);
    row.appendChild(right);
    panel.appendChild(row);
  });
}

function renderCircuitHeightEditor(sceneModel) {
  const profile = getCircuitHeightProfile(sceneModel);
  const block = document.createElement("div");
  block.className = "circuit-height-editor";
  block.setAttribute("style", "padding:10px;margin-top:8px;border:1px solid #ddd;border-radius:8px;");

  const title = document.createElement("div");
  title.textContent = "回路設定";
  block.appendChild(title);

  const panelRiseRow = document.createElement("div");
  panelRiseRow.setAttribute("style", "margin-top:8px;");
  const panelRiseLabel = document.createElement("div");
  panelRiseLabel.textContent = "分電盤立ち上げ高さ";
  const panelRiseValue = document.createElement("div");
  panelRiseValue.textContent = `${profile.panelRise}mm`;
  const panelRiseEdit = document.createElement("button");
  panelRiseEdit.type = "button";
  panelRiseEdit.textContent = "編集";
  panelRiseEdit.addEventListener("click", () => {
    handleEditPanelRise(sceneModel);
  });
  panelRiseRow.appendChild(panelRiseLabel);
  panelRiseRow.appendChild(panelRiseValue);
  panelRiseRow.appendChild(panelRiseEdit);
  block.appendChild(panelRiseRow);

  const slackRow = document.createElement("div");
  slackRow.setAttribute("style", "margin-top:8px;");
  const slackLabel = document.createElement("div");
  slackLabel.textContent = "余長";
  const slackValue = document.createElement("div");
  slackValue.textContent = `${profile.slack}mm`;
  const slackEdit = document.createElement("button");
  slackEdit.type = "button";
  slackEdit.textContent = "編集";
  slackEdit.addEventListener("click", () => {
    handleEditSlack(sceneModel);
  });
  slackRow.appendChild(slackLabel);
  slackRow.appendChild(slackValue);
  slackRow.appendChild(slackEdit);
  block.appendChild(slackRow);

  return block;
}

function getConnectionPointRouteSegments(sceneModel) {
  const connectionPoints = sceneModel && Array.isArray(sceneModel.connectionPoints) ? sceneModel.connectionPoints : [];
  if (!Array.isArray(connectionPoints) || !connectionPoints.length) return [];

  const toCpLabel = (point, fallbackIndex) => {
    const pointId = String(point?.id || "");
    const hit = pointId.match(/(\d+)(?!.*\d)/);
    return hit ? `CP${hit[1]}` : `CP${fallbackIndex + 1}`;
  };

  const segments = [];
  const panelSpanRaw = Number(connectionPoints[0]?.horizontalSpanFromPanel);
  segments.push({
    index: 0,
    type: "from_panel",
    fromLabel: "分電盤",
    toLabel: toCpLabel(connectionPoints[0], 0),
    horizontalSpan: Number.isFinite(panelSpanRaw) && panelSpanRaw > 0 ? panelSpanRaw : 2000,
  });

  for (let i = 0; i < connectionPoints.length - 1; i += 1) {
    const spanRaw = Number(connectionPoints[i]?.horizontalSpanToNext);
    segments.push({
      index: i + 1,
      type: "between_cp",
      fromIndex: i,
      toIndex: i + 1,
      fromLabel: toCpLabel(connectionPoints[i], i),
      toLabel: toCpLabel(connectionPoints[i + 1], i + 1),
      horizontalSpan: Number.isFinite(spanRaw) && spanRaw > 0 ? spanRaw : 2000,
    });
  }
  return segments;
}

function handleEditConnectionPointSegment(index) {
  const model = connectionPointsEditorSceneModel;
  if (!model || !Array.isArray(model.connectionPoints)) return;
  const points = model.connectionPoints;
  if (!Number.isInteger(index) || index < 0) return;

  const segments = getConnectionPointRouteSegments(model);
  const segment = segments.find((item) => item.index === index);
  if (!segment || !points.length) return;

  const input = prompt("horizontalSpan(mm)を入力してください", String(segment.horizontalSpan));
  const value = Number(typeof input === "string" ? input.trim() : "");
  if (!Number.isFinite(value) || value <= 0) return;

  if (segment.type === "from_panel") {
    points[0].horizontalSpanFromPanel = value;
  } else if (Number.isInteger(segment.fromIndex) && segment.fromIndex >= 0 && segment.fromIndex < points.length) {
    points[segment.fromIndex].horizontalSpanToNext = value;
  } else {
    return;
  }

  renderConnectionPointRoute(model);
  renderConnectionPointsEditor(model);
}

function renderConnectionPointSegmentEditor(sceneModel) {
  const segments = getConnectionPointRouteSegments(sceneModel);
  const block = document.createElement("div");
  block.className = "cp-segment-editor";
  block.setAttribute("style", "padding:10px;margin-top:8px;border:1px solid #ddd;border-radius:8px;");

  const title = document.createElement("div");
  title.textContent = "幹線区間距離";
  block.appendChild(title);

  if (!segments.length) {
    const empty = document.createElement("div");
    empty.textContent = "区間なし";
    block.appendChild(empty);
    return block;
  }

  segments.forEach((segment) => {
    const row = document.createElement("div");
    row.setAttribute("style", "margin-top:8px;");

    const path = document.createElement("div");
    path.textContent = `${segment.fromLabel} → ${segment.toLabel}`;
    row.appendChild(path);

    const span = document.createElement("div");
    span.textContent = `horizontalSpan: ${segment.horizontalSpan}mm`;
    row.appendChild(span);

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => {
      handleEditConnectionPointSegment(segment.index);
    });
    row.appendChild(editButton);

    block.appendChild(row);
  });

  return block;
}

function renderConnectionPointRoute(sceneModel) {
  const panel = document.getElementById("connection-point-route");
  if (!panel) {
    renderCableLengthSummary(sceneModel);
    renderCircuitCableLengthSummary(sceneModel);
    renderSleeveMaterialSummary(sceneModel);
    renderDeviceMaterialSummary(sceneModel);
    renderJunctionBoxMaterialSummary(sceneModel);
    return;
  }

  let connectionPoints = [];
  if (sceneModel && Array.isArray(sceneModel.connectionPoints)) {
    connectionPointsEditorSceneModel = sceneModel;
    connectionPoints = sceneModel.connectionPoints;
  } else {
    let groups = [];
    if (sceneModel && Array.isArray(sceneModel.groups)) {
      groups = sceneModel.groups;
    } else {
      const parsed = parseGroupsFromDom();
      groups = parsed.groups;
    }
    const circuits = createCircuitsFromGroups(groups);
    connectionPoints = createConnectionPointsFromCircuits(circuits);
    connectionPointsEditorSceneModel = { connectionPoints };
  }

  panel.innerHTML = "";
  if (!Array.isArray(connectionPoints) || !connectionPoints.length) {
    panel.textContent = "ルートなし";
    renderCableLengthSummary(
      connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object"
        ? connectionPointsEditorSceneModel
        : { connectionPoints }
    );
    renderCircuitCableLengthSummary(
      connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object"
        ? connectionPointsEditorSceneModel
        : { connectionPoints }
    );
    renderSleeveMaterialSummary(
      connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object"
        ? connectionPointsEditorSceneModel
        : { connectionPoints }
    );
    renderDeviceMaterialSummary(
      connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object"
        ? connectionPointsEditorSceneModel
        : { connectionPoints }
    );
    renderJunctionBoxMaterialSummary(
      connectionPointsEditorSceneModel && typeof connectionPointsEditorSceneModel === "object"
        ? connectionPointsEditorSceneModel
        : { connectionPoints }
    );
    return;
  }

  const route = document.createElement("div");
  route.className = "cp-route";
  const branchLists = renderConnectionPointBranches({ connectionPoints });

  const head = document.createElement("div");
  head.textContent = "分電盤";
  route.appendChild(head);

  connectionPoints.forEach((point, index) => {
    const arrow = document.createElement("div");
    arrow.textContent = "↓";
    route.appendChild(arrow);

    const row = document.createElement("div");
    row.setAttribute("style", "display:flex;align-items:center;gap:8px;");

    const label = document.createElement("span");
    const pointId = String(point?.id || "");
    const hit = pointId.match(/(\d+)(?!.*\d)/);
    label.textContent = hit ? `CP${hit[1]}` : `CP${index + 1}`;
    row.appendChild(label);

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "⬆";
    upButton.addEventListener("click", () => {
      moveConnectionPoint(index, "up");
    });
    row.appendChild(upButton);

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "⬇";
    downButton.addEventListener("click", () => {
      moveConnectionPoint(index, "down");
    });
    row.appendChild(downButton);

    route.appendChild(row);
    const branches = branchLists[index];
    if (branches) route.appendChild(branches);
  });

  panel.appendChild(route);

  const routeModel =
    connectionPointsEditorSceneModel && Array.isArray(connectionPointsEditorSceneModel.connectionPoints)
      ? connectionPointsEditorSceneModel
      : { connectionPoints };
  const estimate = estimateConnectionPointWireLength(routeModel);
  if (!Array.isArray(estimate.trunkSegments) || estimate.trunkSegments.length < 1) {
    renderCableLengthSummary(routeModel);
    renderCircuitCableLengthSummary(routeModel);
    renderSleeveMaterialSummary(routeModel);
    renderDeviceMaterialSummary(routeModel);
    renderJunctionBoxMaterialSummary(routeModel);
    return;
  }

  const estimateBlock = document.createElement("div");
  estimateBlock.className = "wire-length-estimate";
  const title = document.createElement("div");
  title.textContent = "配線概算";
  estimateBlock.appendChild(title);

  estimate.trunkSegments.forEach((segment) => {
    const row = document.createElement("div");
    const from = segment.fromLabel || `CP${segment.fromIndex + 1}`;
    const to = segment.toLabel || `CP${segment.toIndex + 1}`;
    const lengthM = (Number(segment.lengthMm || 0) / 1000).toFixed(1);
    row.textContent = `${from} → ${to}  ${lengthM}m`;
    estimateBlock.appendChild(row);
  });

  if (Array.isArray(estimate.branchSegments) && estimate.branchSegments.length) {
    const branchTitle = document.createElement("div");
    branchTitle.textContent = "枝配線";
    estimateBlock.appendChild(branchTitle);
    estimate.branchSegments.forEach((segment) => {
      const row = document.createElement("div");
      const cp = segment.cpLabel || `CP${segment.cpIndex + 1}`;
      const device = segment.deviceLabel || "DEVICE";
      const lengthM = (Number(segment.lengthMm || 0) / 1000).toFixed(1);
      row.textContent = `${cp} → ${device}  ${lengthM}m`;
      estimateBlock.appendChild(row);
    });
  }

  panel.appendChild(estimateBlock);
  panel.appendChild(renderCircuitHeightEditor(routeModel));
  panel.appendChild(renderConnectionPointSegmentEditor(routeModel));
  renderCableLengthSummary(routeModel);
  renderCircuitCableLengthSummary(routeModel);
  renderSleeveMaterialSummary(routeModel);
  renderDeviceMaterialSummary(routeModel);
  renderJunctionBoxMaterialSummary(routeModel);
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
  ensureAiDiagramModeSwitcher();
  renderAiDiagramByMode();
  renderConnectionPointsEditor();
  renderConnectionPointRoute();
  renderCableLengthSummary();
  if (!target) return;
  const observer = new MutationObserver(() => {
    renderCircuitList();
    renderMaterialList();
    renderCircuitMaterialList();
    renderSleeveJudgeList();
    renderParseDebugResult();
    renderLayoutDebug();
    renderWirePathDebug();
    ensureAiDiagramModeSwitcher();
    renderAiDiagramByMode();
    renderConnectionPointsEditor();
    renderConnectionPointRoute();
    renderCableLengthSummary();
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
window.renderAiDiagramPreview = renderAiDiagramPreview;
window.renderAiDiagramEnhanced = renderAiDiagramEnhanced;
window.renderAiDiagramExamStyle = renderAiDiagramExamStyle;
window.renderAiDiagramByMode = renderAiDiagramByMode;
window.renderConnectionPointsEditor = renderConnectionPointsEditor;
window.handleAddDeviceToConnectionPoint = handleAddDeviceToConnectionPoint;
window.handleEditDeviceHeight = handleEditDeviceHeight;
window.getCircuitHeightProfile = getCircuitHeightProfile;
window.handleEditPanelRise = handleEditPanelRise;
window.handleEditSlack = handleEditSlack;
window.renderCircuitHeightEditor = renderCircuitHeightEditor;
window.moveConnectionPoint = moveConnectionPoint;
window.renderConnectionPointBranches = renderConnectionPointBranches;
window.estimateConnectionPointWireLength = estimateConnectionPointWireLength;
window.aggregateCableLengthsByMaterial = aggregateCableLengthsByMaterial;
window.aggregateCableLengthsByCircuit = aggregateCableLengthsByCircuit;
window.renderCableLengthSummary = renderCableLengthSummary;
window.renderCircuitCableLengthSummary = renderCircuitCableLengthSummary;
window.aggregateSleeveMaterials = aggregateSleeveMaterials;
window.renderSleeveMaterialSummary = renderSleeveMaterialSummary;
window.aggregateDeviceMaterials = aggregateDeviceMaterials;
window.renderDeviceMaterialSummary = renderDeviceMaterialSummary;
window.aggregateJunctionBoxMaterials = aggregateJunctionBoxMaterials;
window.renderJunctionBoxMaterialSummary = renderJunctionBoxMaterialSummary;
window.getConnectionPointRouteSegments = getConnectionPointRouteSegments;
window.handleEditConnectionPointSegment = handleEditConnectionPointSegment;
window.renderConnectionPointSegmentEditor = renderConnectionPointSegmentEditor;
window.renderConnectionPointRoute = renderConnectionPointRoute;
window.getConnectionPointHeightProfile = getConnectionPointHeightProfile;
window.renderConnectionPointHeights = renderConnectionPointHeights;
window.getDefaultDeviceHeight = getDefaultDeviceHeight;
window.renderConnectionPointDeviceHeights = renderConnectionPointDeviceHeights;

initPlayground();
setupCircuitListAutoRender();
