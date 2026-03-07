import {
  buildDevicesFromSelection,
  buildRequiredAndNotes,
  generateDiagram,
  groupDevicesByControl,
  judgeSleeve,
  renderDiagram,
} from "./js/diagram/index.js";
import { createCircuitsFromGroups } from "./js/engine/circuit-engine.js";
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

function setupCircuitListAutoRender() {
  const target = document.getElementById("group-list");
  renderCircuitList();
  renderMaterialList();
  renderCircuitMaterialList();
  if (!target) return;
  const observer = new MutationObserver(() => {
    renderCircuitList();
    renderMaterialList();
    renderCircuitMaterialList();
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

initPlayground();
setupCircuitListAutoRender();
