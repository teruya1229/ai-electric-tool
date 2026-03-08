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
  mode: null, // "試験" | "ガミデンキ" | "現場"
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
      sub: "スイッチ1個・照明2個（同時入/切）",
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

const PURPOSE_LABELS = {
  light: "照明",
  outlet: "コンセント",
  ac_outlet: "エアコンコンセント",
  fan: "換気扇",
  kitchen_outlet: "台所コンセント",
  washroom: "洗面所",
  outdoor: "屋外",
  unknown: "未設定",
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
    _syncGroupEditorFromUiState();
    _goStep(2);
    return;
  }

  if (key === "condition") {
    const list = CONDITIONS[UI.circuit] || [];
    UI.condition = list.find((c) => c.id === value) || null;
    _syncGroupEditorFromUiState();
    _goStep(3);
    return;
  }

  if (key === "mode") {
    UI.mode = value;
    _syncGroupEditorFromUiState();
    _buildSummary();
    _goStep(4);
  }
}

function uiBack() {
  if (UI.step > 1) _goStep(UI.step - 1);
}

function uiToggleDetails() {
  const body = document.body;
  if (!body) return;
  body.classList.toggle("show-details");
  _updateDetailToggleButton();
}

function uiGenerate() {
  if (!UI.circuit || !UI.condition || !UI.mode) return;
  _syncGroupEditorFromUiState();

  const syncedToLegacy = _syncToExistingUiAndGenerate();
  if (!syncedToLegacy) {
    _generateByDirectFallback();
  }

  _closePanelAndScrollTop();
}

function _generateByDirectFallback() {
  const circuitType = UI.circuit === "3路" ? "threeway" : "single";
  const conditionId = _normalizeConditionId(UI.condition.id);
  const devices =
    typeof window.buildDevicesFromSelection === "function"
      ? window.buildDevicesFromSelection(circuitType, conditionId)
      : _buildDevicesFromCondition(conditionId);
  const mode = _toDiagramMode(UI.mode);
  const generationMode = mode === "exam_gamidenki" ? "exam" : mode;
  let diagram = null;
  let renderError = "";

  if (typeof window.generateDiagram === "function") {
    try {
      diagram = window.generateDiagram(devices, generationMode);
      if (diagram) diagram = { ...diagram, mode };
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
    conditionId,
    mode,
    devices,
    diagram: diagram || { groups: [], devices: [], wires: [], warnings: [] },
    renderError,
  });
}

function _closePanelAndScrollTop() {
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
  const showDebug = window.__WIRING_DEBUG__ === true;
  const groupArticle = groupEl ? groupEl.closest("article") : null;
  const debugArticle = debugEl ? debugEl.closest("article") : null;

  if (groupArticle) groupArticle.style.display = showDebug ? "block" : "none";
  if (debugArticle) debugArticle.style.display = showDebug ? "block" : "none";

  if (selectionEl) {
    selectionEl.textContent = [
      `回路を選ぶ: ${payload.circuitType === "threeway" ? "3路" : "片切"}`,
      `条件を選ぶ: ${UI.condition ? UI.condition.label : "未選択"}`,
      `表示モード: ${_toDisplayModeLabel(payload.mode)}`,
    ].join("\n");
  }

  if (groupEl && showDebug) {
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
  _renderOutletSupplement(payload);

  if (requiredEl && notesEl && typeof window.buildRequiredAndNotes === "function") {
    const meta = window.buildRequiredAndNotes(payload.conditionId || null);
    requiredEl.textContent = (meta.required || []).join("\n");
    notesEl.textContent = (meta.notes || []).join("\n");
  }

  if (debugEl) {
    if (showDebug) {
      debugEl.textContent = JSON.stringify(
        {
          selected: {
            circuitType: payload.circuitType,
            conditionId: payload.conditionId,
            mode: payload.mode,
          },
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

function _renderOutletSupplement(payload) {
  const canvas = document.getElementById("diagram-canvas");
  if (!canvas) return;

  let info = document.getElementById("outlet-supplement");
  const isOutletCase =
    payload.conditionId === "single_1light_1outlet" ||
    payload.devices.some((d) => d && d.kind === "outlet");
  const hasOutletInSvg = payload.diagram.devices?.some((d) => d && d.kind === "outlet");

  if (!isOutletCase) {
    if (info) info.remove();
    return;
  }

  if (!info) {
    info = document.createElement("div");
    info.id = "outlet-supplement";
    info.style.marginTop = "8px";
    info.style.fontSize = "13px";
    info.style.color = "#334155";
    canvas.insertAdjacentElement("afterend", info);
  }

  info.textContent = hasOutletInSvg
    ? "補助表示: C1（コンセントあり）"
    : "補助表示: C1（コンセントあり / 図中未描画）";
}

function _normalizeConditionId(conditionId) {
  if (conditionId === "single_1light_1outlet") return conditionId;
  const aliases = {
    single_1light_with_outlet: "single_1light_1outlet",
    single_1light_outlet: "single_1light_1outlet",
    single_1outlet: "single_1light_1outlet",
    single_outlet: "single_1light_1outlet",
    threeway: "threeway_1light",
  };
  return aliases[conditionId] || conditionId;
}

function _toDiagramMode(uiMode) {
  if (uiMode === "現場") return "field";
  if (uiMode === "ガミデンキ") return "exam_gamidenki";
  return "exam";
}

function _toDisplayModeLabel(mode) {
  if (mode === "field") return "現場モード";
  if (mode === "exam_gamidenki") return "ガミデンキモード";
  return "試験モード";
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
  const autoName = _buildAutoCircuitName();
  const el = document.getElementById("ui-summary");
  if (!el) return;
  el.innerHTML = `
    <strong>回路</strong>　${UI.circuit}<br>
    <strong>条件</strong>　${UI.condition ? UI.condition.label : "—"}<br>
    <strong>モード</strong>　${UI.mode}<br>
    <strong>回路名</strong>　${autoName}
  `;
}

function _updateDetailToggleButton() {
  const btn = document.getElementById("ui-toggle-details-btn");
  if (!(btn instanceof HTMLElement)) return;
  const expanded = document.body.classList.contains("show-details") || document.body.classList.contains("dev-mode");
  btn.textContent = expanded ? "詳細を隠す" : "詳細を表示";
}

function _clickIfExists(selector) {
  const el = document.querySelector(selector);
  if (el instanceof HTMLElement) el.click();
}

function _syncToExistingUiAndGenerate() {
  const generateButton = document.querySelector("#generate-btn");
  if (!(generateButton instanceof HTMLElement)) return false;

  const setValueAndDispatch = (selector, value, eventType = "change") => {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLElement) || !("value" in el)) return;
    // @ts-ignore - runtime checked by "value" in el
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
  };
  const setCheckedAndDispatch = (selector, checked) => {
    const el = document.querySelector(selector);
    if (!(el instanceof HTMLInputElement)) return;
    el.checked = !!checked;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const enforceLegacyState = () => {
    if (UI.circuit === "3路") {
      setValueAndDispatch("#group-switch-type-select", "threeway");
      setCheckedAndDispatch("#group-same-time-checkbox", false);
      setValueAndDispatch("#light-count-select", "1");
      setValueAndDispatch("#outlet-count-select", "0");
      return;
    }
    setValueAndDispatch("#group-switch-type-select", "single");
  };

  const circuitSelector = UI.circuit === "3路" ? "#circuit-threeway-btn" : "#circuit-single-btn";
  _clickIfExists(circuitSelector);
  enforceLegacyState();
  if (UI.circuit === "3路") {
    _clickIfExists(circuitSelector);
    enforceLegacyState();
  }

  const conditionTextMap = {
    single_1light: ["1灯", "1灯のみ"],
    single_2lights_same: "2灯同時",
    single_1light_1outlet: "コンセントあり",
    threeway_1light: "1灯",
  };

  const getConditionButtons = () => Array.from(document.querySelectorAll("#condition-buttons button"));
  let conditionButtons = getConditionButtons();
  if (UI.circuit === "3路") {
    if (conditionButtons.length !== 1) {
      _clickIfExists(circuitSelector);
      enforceLegacyState();
      conditionButtons = getConditionButtons();
    }
    if (conditionButtons.length === 1 && conditionButtons[0] instanceof HTMLElement) {
      conditionButtons[0].click();
    } else {
      const threewayHint = conditionButtons.find((btn) => String(btn.textContent || "").includes("3路"));
      if (threewayHint instanceof HTMLElement) {
        threewayHint.click();
      } else {
        enforceLegacyState();
      }
    }
    enforceLegacyState();
  } else {
    const conditionText = conditionTextMap[UI.condition.id];
    const matchText = (rawText) => {
      const text = String(rawText || "").trim();
      if (Array.isArray(conditionText)) return conditionText.some((item) => text === item);
      return text === conditionText;
    };
    const target = conditionButtons.find((btn) => matchText(btn.textContent));
    if (target instanceof HTMLElement) target.click();
  }

  const modeSelector =
    UI.mode === "現場"
      ? "#mode-field-btn"
      : UI.mode === "ガミデンキ"
        ? "#mode-gamidenki-btn"
        : "#mode-exam-btn";
  _clickIfExists(modeSelector);
  enforceLegacyState();
  _clickIfExists("#generate-btn");
  return true;
}

function _setValueAndDispatch(el, value) {
  if (!(el instanceof HTMLElement)) return;
  if ("value" in el) {
    // @ts-ignore - HTMLElement narrowed by runtime check
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function _derivePurposeKey() {
  const conditionId = UI?.condition?.id || "";
  if (conditionId.includes("outlet")) return "outlet";
  if (conditionId.includes("fan")) return "fan";
  if (conditionId.includes("washroom")) return "washroom";
  if (conditionId.includes("outdoor")) return "outdoor";
  if (conditionId.includes("kitchen")) return "kitchen_outlet";
  if (UI.circuit) return "light";
  return "unknown";
}

function _buildAutoCircuitName() {
  const symbolInput = document.getElementById("group-control-id-input");
  const currentSymbol =
    symbolInput && "value" in symbolInput && String(symbolInput.value || "").trim()
      ? String(symbolInput.value || "").trim()
      : "イ";
  const purposeKey = _derivePurposeKey();
  const purposeLabel = PURPOSE_LABELS[purposeKey] || PURPOSE_LABELS.unknown;
  if (purposeKey === "unknown") {
    return `${currentSymbol}：未設定`;
  }
  const switchLabel = UI.circuit === "3路" ? "3路" : "片切";
  if (purposeKey === "light") {
    return `${currentSymbol}：${purposeLabel}（${switchLabel}）`;
  }
  return `${currentSymbol}：${purposeLabel}`;
}

function _syncGroupEditorFromUiState() {
  const controlInput = document.getElementById("group-control-id-input");
  const labelInput = document.getElementById("group-label-input");
  const purposeSelect = document.getElementById("group-purpose-input");
  const switchTypeSelect = document.getElementById("group-switch-type-select");

  const symbol =
    controlInput && "value" in controlInput && String(controlInput.value || "").trim()
      ? String(controlInput.value || "").trim()
      : "イ";
  if (controlInput && "value" in controlInput && !String(controlInput.value || "").trim()) {
    _setValueAndDispatch(controlInput, symbol);
  }

  const purposeKey = _derivePurposeKey();
  if (purposeSelect && "value" in purposeSelect) {
    const nextPurpose = purposeKey || "unknown";
    _setValueAndDispatch(purposeSelect, nextPurpose);
  }
  if (switchTypeSelect && "value" in switchTypeSelect) {
    _setValueAndDispatch(switchTypeSelect, UI.circuit === "3路" ? "threeway" : "single");
  }
  if (labelInput && "value" in labelInput) {
    _setValueAndDispatch(labelInput, _buildAutoCircuitName());
  }
}

function _initUiPanel() {
  // モバイル表示開始時にパネルを展開状態へ戻す
  const panel = document.getElementById("ui-panel");
  if (panel) {
    panel.style.transform = "translateY(0)";
    panel.style.transition = "none";
  }
  document.body.classList.remove("show-details");
  if (window.__WIRING_DEBUG__ === true) {
    document.body.classList.add("dev-mode");
  }
  _syncGroupEditorFromUiState();
  _updateDetailToggleButton();
  _updateStepIndicator();
  _updateBackBtn();
}

window.uiSelect = uiSelect;
window.uiBack = uiBack;
window.uiGenerate = uiGenerate;
window.uiToggleDetails = uiToggleDetails;
window.addEventListener("DOMContentLoaded", _initUiPanel);

// ===== 追記: devモード表示制御 / 折りたたみ初期化（既存処理は変更しない） =====
window.addEventListener("DOMContentLoaded", () => {
  const devToggleBtn = document.getElementById("dev-mode-toggle");
  const devTargets = Array.from(document.querySelectorAll('[data-dev="true"]'));

  const setDevVisible = (visible) => {
    devTargets.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.display = visible ? "block" : "none";
    });
    if (devToggleBtn instanceof HTMLElement) {
      devToggleBtn.textContent = visible ? "🛠 詳細表示 ON" : "🛠 詳細表示 OFF";
    }
  };

  setDevVisible(false);

  if (devToggleBtn instanceof HTMLElement) {
    let devVisible = false;
    devToggleBtn.addEventListener("click", () => {
      devVisible = !devVisible;
      setDevVisible(devVisible);
    });
  }

  const collapseCards = Array.from(document.querySelectorAll('[data-collapse="true"]'));
  collapseCards.forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    const title = card.querySelector("h3");
    if (!(title instanceof HTMLElement)) return;

    const contentNodes = Array.from(card.children).filter((node) => node !== title);
    card.dataset.collapsed = "false";

    const setCollapsed = (collapsed) => {
      card.dataset.collapsed = collapsed ? "true" : "false";
      title.textContent = `${title.textContent?.replace(/\s*[▲▼]$/, "") || ""} ${collapsed ? "▼" : "▲"}`;
      contentNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.display = collapsed ? "none" : "";
        }
      });
    };

    title.style.cursor = "pointer";
    setCollapsed(false);
    title.addEventListener("click", () => {
      const isCollapsed = card.dataset.collapsed === "true";
      setCollapsed(!isCollapsed);
    });
  });
});
