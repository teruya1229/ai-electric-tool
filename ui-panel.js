/* ==============================================
   ui-panel.js
   スマホタップUI 状態管理のみ

   【重要】
   generateDiagram() / groupDevicesByControl() / judgeSleeve()
   は一切変更・上書きしない。
   これらはすでに wiring-diagram.js に存在する前提で
   uiGenerate() から呼び出すだけにする。
============================================== */

// ── 状態 ──────────────────────────────────────
const UI = {
  step: 1,
  circuit: null, // "片切" | "3路"
  condition: null, // 条件オブジェクト
  mode: null, // "試験" | "現場"
};

// ── 条件マスタ ────────────────────────────────
const CONDITIONS = {
  片切: [
    {
      id: "single_1light",
      label: "1灯のみ",
      sub: "スイッチ1個・照明1個",
      diagramArgs: { type: "single_1light" },
    },
    {
      id: "single_2lights_same",
      label: "2灯同時",
      sub: "スイッチ1個・照明2個（同時ON/OFF）",
      diagramArgs: { type: "single_2lights_same" },
    },
    {
      id: "single_1light_1outlet",
      label: "コンセントあり",
      sub: "スイッチ1個・照明1個・コンセント1個",
      diagramArgs: { type: "single_1light_1outlet" },
    },
  ],
  "3路": [
    {
      id: "threeway_1light",
      label: "1灯",
      sub: "3路スイッチ2個・照明1個",
      diagramArgs: { type: "threeway_1light" },
    },
  ],
};

function _buildDevicesFromCondition(conditionId) {
  if (conditionId === "single_1light") {
    return [
      { id: "power", kind: "power", name: "電源" },
      { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
      { id: "light1", kind: "light", name: "R1", controlId: 1 },
    ];
  }
  if (conditionId === "single_2lights_same") {
    return [
      { id: "power", kind: "power", name: "電源" },
      { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
      { id: "light1", kind: "light", name: "R1", controlId: 1 },
      { id: "light2", kind: "light", name: "R2", controlId: 1 },
    ];
  }
  if (conditionId === "single_1light_1outlet") {
    return [
      { id: "power", kind: "power", name: "電源" },
      { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
      { id: "light1", kind: "light", name: "R1", controlId: 1 },
      { id: "outlet1", kind: "outlet", name: "C1" },
    ];
  }
  return [
    { id: "power", kind: "power", name: "電源" },
    { id: "sw1", kind: "switch_3way", name: "SW1", controlId: 1, position: 1 },
    { id: "sw2", kind: "switch_3way", name: "SW2", controlId: 1, position: 2 },
    { id: "light1", kind: "light", name: "R1", controlId: 1 },
  ];
}

// ── 外部から呼ばれる選択処理 ──────────────────
function uiSelect(key, value) {
  if (key === "circuit") {
    UI.circuit = value;
    UI.condition = null;
    UI.mode = null;
    _buildConditionList(value);
    _goStep(2);
    return;
  }

  if (key === "condition") {
    const list = CONDITIONS[UI.circuit] || [];
    UI.condition = list.find((c) => c.id === value) || null;
    _goStep(3);
    return;
  }

  if (key === "mode") {
    UI.mode = value;
    _buildSummary();
    _goStep(4);
  }
}

function uiBack() {
  if (UI.step > 1) _goStep(UI.step - 1);
}

function uiGenerate() {
  if (!UI.circuit || !UI.condition || !UI.mode) return;

  const circuitType = UI.circuit === "3路" ? "threeway" : "single";
  const devices =
    typeof window.buildDevicesFromSelection === "function"
      ? window.buildDevicesFromSelection(circuitType, UI.condition.id)
      : _buildDevicesFromCondition(UI.condition.id);
  const mode = UI.mode === "現場" ? "field" : "exam";
  let diagram = null;
  let renderError = "";

  if (typeof window.generateDiagram === "function") {
    try {
      diagram = window.generateDiagram(devices, mode);
      if (!diagram || (!diagram.devices?.length && !diagram.wires?.length)) {
        renderError = "複線図データなし";
      }
    } catch (_error) {
      renderError = "複線図生成に失敗しました";
    }
  } else {
    renderError = "generateDiagram が見つかりません";
  }

  _renderToExistingOutput({
    circuitType,
    mode,
    devices,
    diagram: diagram || { groups: [], devices: [], wires: [], warnings: [] },
    renderError,
  });

  // パネルを閉じてSVGを見せる
  const panel = document.getElementById("ui-panel");
  if (panel) {
    panel.style.transform = "translateY(100%)";
    panel.style.transition = "transform .3s ease";
  }
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 200);
}

function _renderToExistingOutput(payload) {
  const selectionEl = document.getElementById("selection-result");
  const groupEl = document.getElementById("group-result");
  const warningEl = document.getElementById("warning-result");
  const debugEl = document.getElementById("debug-result");
  const requiredEl = document.getElementById("required-cables");
  const notesEl = document.getElementById("notes-result");

  if (selectionEl) {
    selectionEl.textContent = JSON.stringify(
      {
        回路を選ぶ: payload.circuitType === "threeway" ? "3路" : "片切",
        条件を選ぶ: UI.condition ? UI.condition.label : "未選択",
        表示モード: payload.mode === "exam" ? "試験モード" : "現場モード",
      },
      null,
      2
    );
  }

  if (groupEl) {
    groupEl.textContent = payload.diagram.groups?.length
      ? JSON.stringify(payload.diagram.groups, null, 2)
      : "グループ化結果なし";
  }

  if (warningEl) {
    const warnings = Array.isArray(payload.diagram.warnings) ? payload.diagram.warnings : [];
    warningEl.textContent = warnings.length ? warnings.join("\n") : "警告なし";
  }

  if (typeof window.renderDiagram === "function") {
    window.renderDiagram(payload.diagram, payload.renderError);
  }

  if (requiredEl && notesEl && typeof window.buildRequiredAndNotes === "function") {
    const meta = window.buildRequiredAndNotes(UI.condition ? UI.condition.id : null);
    requiredEl.textContent = (meta.required || []).join("\n");
    notesEl.textContent = (meta.notes || []).join("\n");
  }

  if (debugEl) {
    const showDebug = window.__WIRING_DEBUG__ === true;
    const debugArticle = debugEl.closest("article");
    if (debugArticle) {
      debugArticle.style.display = showDebug ? "block" : "none";
    }
    if (showDebug) {
      debugEl.textContent = JSON.stringify(
        {
          buildDevicesFromSelection: payload.devices,
          generateDiagramResult: payload.diagram,
          counts: {
            groups: payload.diagram.groups?.length || 0,
            devices: payload.diagram.devices?.length || 0,
            wires: payload.diagram.wires?.length || 0,
            warnings: payload.diagram.warnings?.length || 0,
          },
          renderError: payload.renderError || "なし",
        },
        null,
        2
      );
    } else {
      debugEl.textContent = "";
    }
  }
}

// ── 内部処理 ──────────────────────────────────
function _goStep(n) {
  const current = document.getElementById(`ui-screen-${UI.step}`);
  const next = document.getElementById(`ui-screen-${n}`);
  if (current) current.style.display = "none";
  if (next) next.style.display = "block";

  UI.step = n;
  _updateStepIndicator();
  _updateBackBtn();
}

function _updateStepIndicator() {
  document.querySelectorAll(".ui-step[data-step]").forEach((el) => {
    const s = Number(el.dataset.step);
    el.classList.remove("active", "done");
    if (s === UI.step) el.classList.add("active");
    if (s < UI.step) el.classList.add("done");
  });
}

function _updateBackBtn() {
  const btn = document.getElementById("ui-back-btn");
  if (!btn) return;
  btn.style.display = UI.step > 1 ? "inline-block" : "none";
}

function _buildConditionList(circuit) {
  const list = CONDITIONS[circuit] || [];
  const container = document.getElementById("ui-condition-list");
  if (!container) return;
  container.innerHTML = list
    .map(
      (c) => `
    <button class="ui-btn" onclick="uiSelect('condition','${c.id}')">
      <span class="ui-btn-icon">⚡</span>
      <span class="ui-btn-main">${c.label}</span>
      <span class="ui-btn-sub">${c.sub}</span>
    </button>
  `
    )
    .join("");
}

function _buildSummary() {
  const el = document.getElementById("ui-summary");
  if (!el) return;
  el.innerHTML = `
    <strong>回路</strong>　${UI.circuit}<br>
    <strong>条件</strong>　${UI.condition ? UI.condition.label : "—"}<br>
    <strong>モード</strong>　${UI.mode}
  `;
}

function _clickIfExists(selector) {
  const el = document.querySelector(selector);
  if (el instanceof HTMLElement) el.click();
}

function _syncToExistingUiAndGenerate() {
  const circuitSelector = UI.circuit === "3路" ? "#circuit-threeway-btn" : "#circuit-single-btn";
  _clickIfExists(circuitSelector);

  const conditionTextMap = {
    single_1light: "1灯",
    single_2lights_same: "2灯同時",
    single_1light_1outlet: "コンセントあり",
    threeway_1light: "1灯",
  };

  const conditionText = conditionTextMap[UI.condition.id];
  const conditionButtons = Array.from(document.querySelectorAll("#condition-buttons button"));
  const target = conditionButtons.find((btn) => btn.textContent && btn.textContent.trim() === conditionText);
  if (target instanceof HTMLElement) target.click();

  const modeSelector = UI.mode === "現場" ? "#mode-field-btn" : "#mode-exam-btn";
  _clickIfExists(modeSelector);
  _clickIfExists("#generate-btn");
}

function _initUiPanel() {
  // モバイル表示開始時にパネルを展開状態へ戻す
  const panel = document.getElementById("ui-panel");
  if (panel) {
    panel.style.transform = "translateY(0)";
    panel.style.transition = "none";
  }
  _updateStepIndicator();
  _updateBackBtn();
}

window.uiSelect = uiSelect;
window.uiBack = uiBack;
window.uiGenerate = uiGenerate;
window.addEventListener("DOMContentLoaded", _initUiPanel);
