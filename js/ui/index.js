import {
  CONDITION_OPTIONS,
  EMPTY_DIAGRAM,
  buildRequiredAndNotes,
  generateDiagram,
  judgeSleeve,
  renderDiagram,
} from "../diagram/index.js";
import {
  _getGroupQuantity,
  _inferConditionIdFromCounts,
  _setGroupQuantity,
  applyParsedResult,
  buildDeviceListFromUi,
  buildDiagramInputFromGroup,
  createEmptyGroup,
  createDefaultSceneModel,
  getNextControlId,
  parseFieldSceneText,
  parseProblemText,
  toDiagramFormState,
} from "../parser/index.js";

/**
 * @param {ReturnType<typeof parseProblemText>} parsed
 */
function renderParseResult(parsed) {
  const panel = document.getElementById("parseResultPanel");
  if (!panel) return;

  const circuitMap = { single: "片切", threeway: "3路" };
  const lightText = parsed.lightCount ? `${parsed.lightCount}灯` : "未判定";
  const modeText = parsed.sameTime ? "あり" : "なし";
  const outletText = parsed.outletCount ? `${parsed.outletCount}個` : "なし";
  const warningText = parsed.warnings.length ? parsed.warnings.join("\n- ") : "なし";
  const errorText = parsed.errors.length ? parsed.errors.join("\n- ") : "なし";
  const summary = parsed.errors.length ? "解析失敗（エラーあり）" : "解析成功";

  let pre = panel.querySelector("pre");
  if (!pre) {
    pre = document.createElement("pre");
    panel.appendChild(pre);
  }
  pre.textContent = [
    `判定結果: ${summary}`,
    `回路種別: ${parsed.circuitType ? circuitMap[parsed.circuitType] : "未判定"}`,
    `灯数: ${lightText}`,
    `同時点灯: ${modeText}`,
    `コンセント数: ${outletText}`,
    `controlCount: ${parsed.controlCount}`,
    `confidence: ${parsed.confidence}`,
    `matchedRules: ${parsed.matchedRules.length ? parsed.matchedRules.join(", ") : "なし"}`,
    `警告: ${warningText === "なし" ? "なし" : `\n- ${warningText}`}`,
    `エラー: ${errorText === "なし" ? "なし" : `\n- ${errorText}`}`,
  ].join("\n");
}

function renderGroupList(sceneModel) {
  const listEl = document.getElementById("group-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  sceneModel.groups.forEach((group, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "group-item-btn";
    if (index === sceneModel.activeGroupIndex) btn.classList.add("active");
    const switchText = group.switchType === "threeway" ? "3路" : "片切";
    btn.textContent = `${group.controlId} | ${group.label || ""} | ${group.purpose || "unknown"} | ${switchText} | 照明${_getGroupQuantity(group, "light")} | コンセント${_getGroupQuantity(group, "outlet")}`;
    btn.dataset.groupIndex = String(index);
    listEl.appendChild(btn);
  });
}

function renderGroupEditor(sceneModel, activeGroupIndex) {
  const group = sceneModel.groups[activeGroupIndex];
  const controlIdInput = document.getElementById("group-control-id-input");
  const groupLabelInput = document.getElementById("group-label-input");
  const groupPurposeInput = document.getElementById("group-purpose-input");
  const switchTypeSelect = document.getElementById("group-switch-type-select");
  const sameTimeCheckbox = document.getElementById("group-same-time-checkbox");
  const lightCountSelect = document.getElementById("light-count-select");
  const outletCountSelect = document.getElementById("outlet-count-select");
  if (
    !group ||
    !(controlIdInput instanceof HTMLInputElement) ||
    !(groupLabelInput instanceof HTMLInputElement) ||
    !(groupPurposeInput instanceof HTMLSelectElement) ||
    !(switchTypeSelect instanceof HTMLSelectElement)
  ) {
    return;
  }

  controlIdInput.value = group.controlId;
  groupLabelInput.value = group.label || "";
  groupPurposeInput.value = group.purpose || "unknown";
  switchTypeSelect.value = group.switchType;
  if (sameTimeCheckbox instanceof HTMLInputElement) sameTimeCheckbox.checked = !!group.sameTime;
  if (lightCountSelect instanceof HTMLSelectElement) lightCountSelect.value = String(_getGroupQuantity(group, "light"));
  if (outletCountSelect instanceof HTMLSelectElement) outletCountSelect.value = String(_getGroupQuantity(group, "outlet"));
}

function updateActiveGroupFromForm(sceneModel) {
  const group = sceneModel.groups[sceneModel.activeGroupIndex];
  if (!group) return;
  const controlIdInput = document.getElementById("group-control-id-input");
  const groupLabelInput = document.getElementById("group-label-input");
  const groupPurposeInput = document.getElementById("group-purpose-input");
  const switchTypeSelect = document.getElementById("group-switch-type-select");
  const sameTimeCheckbox = document.getElementById("group-same-time-checkbox");
  const lightCountSelect = document.getElementById("light-count-select");
  const outletCountSelect = document.getElementById("outlet-count-select");

  if (controlIdInput instanceof HTMLInputElement) group.controlId = controlIdInput.value.trim() || getNextControlId(sceneModel.groups);
  if (groupLabelInput instanceof HTMLInputElement) group.label = groupLabelInput.value.trim();
  if (groupPurposeInput instanceof HTMLSelectElement) group.purpose = groupPurposeInput.value || "unknown";
  if (switchTypeSelect instanceof HTMLSelectElement) group.switchType = switchTypeSelect.value === "threeway" ? "threeway" : "single";
  if (sameTimeCheckbox instanceof HTMLInputElement) group.sameTime = sameTimeCheckbox.checked;
  if (lightCountSelect instanceof HTMLSelectElement) _setGroupQuantity(group, "light", Number(lightCountSelect.value));
  if (outletCountSelect instanceof HTMLSelectElement) _setGroupQuantity(group, "outlet", Number(outletCountSelect.value));
}

function renderActiveGroupDiagram(sceneModel) {
  const result = {
    diagram: EMPTY_DIAGRAM,
    error: "",
    warnings: [],
    errors: [],
    conditionId: null,
    devices: [],
    resolved: { lightCount: 0, outletCount: 0 },
  };
  if (!sceneModel.groups.length) {
    result.error = "系統がありません";
    return result;
  }
  if (sceneModel.groups.length > 6) {
    result.error = "系統数は6件までです。";
    result.errors.push(result.error);
    return result;
  }
  const active = sceneModel.groups[sceneModel.activeGroupIndex];
  const built = buildDiagramInputFromGroup(active);
  result.warnings.push(...built.warnings);
  result.errors.push(...built.errors);
  result.conditionId = built.conditionId;
  result.devices = built.devices;
  result.resolved = built.resolved;
  if (built.errors.length) {
    result.error = built.errors.join(" / ");
    return result;
  }
  try {
    const generationMode = sceneModel.mode === "exam_gamidenki" ? "exam" : sceneModel.mode;
    result.diagram = { ...generateDiagram(built.devices, generationMode), mode: sceneModel.mode };
  } catch (_error) {
    result.error = "複線図生成に失敗しました";
  }
  return result;
}

export function initPlayground() {
  const circuitSingleBtn = document.getElementById("circuit-single-btn");
  const circuitThreewayBtn = document.getElementById("circuit-threeway-btn");
  const conditionButtonsEl = document.getElementById("condition-buttons");
  const conditionHintEl = document.getElementById("condition-hint");
  const modeExamBtn = document.getElementById("mode-exam-btn");
  const modeGamidenkiBtn = document.getElementById("mode-gamidenki-btn");
  const modeFieldBtn = document.getElementById("mode-field-btn");
  const generateBtn = document.getElementById("generate-btn");
  const addGroupBtn = document.getElementById("add-group-btn");
  const groupControlIdInput = document.getElementById("group-control-id-input");
  const groupLabelInput = document.getElementById("group-label-input");
  const groupPurposeInput = document.getElementById("group-purpose-input");
  const groupSwitchTypeSelect = document.getElementById("group-switch-type-select");
  const groupSameTimeCheckbox = document.getElementById("group-same-time-checkbox");
  const fieldSceneInput = document.getElementById("field-scene-input");
  const parseFieldSceneBtn = document.getElementById("parse-field-scene");
  const lightCountSelect = document.getElementById("light-count-select");
  const outletCountSelect = document.getElementById("outlet-count-select");
  const problemTextInput = document.getElementById("problemTextInput");
  const parseProblemButton = document.getElementById("parseProblemButton");

  const selectionEl = document.getElementById("selection-result");
  const groupEl = document.getElementById("group-result");
  const warningEl = document.getElementById("warning-result");
  const debugEl = document.getElementById("debug-result");
  const requiredEl = document.getElementById("required-cables");
  const notesEl = document.getElementById("notes-result");

  const sleeveBtn = document.getElementById("sleeve-judge-btn");
  const wire16El = document.getElementById("wire16-count");
  const wire20El = document.getElementById("wire20-count");
  const wire26El = document.getElementById("wire26-count");
  const sleeveEl = document.getElementById("sleeve-result");

  if (
    !circuitSingleBtn ||
    !circuitThreewayBtn ||
    !conditionButtonsEl ||
    !conditionHintEl ||
    !modeExamBtn ||
    !modeGamidenkiBtn ||
    !modeFieldBtn ||
    !generateBtn ||
    !addGroupBtn ||
    !groupControlIdInput ||
    !groupLabelInput ||
    !groupPurposeInput ||
    !groupSwitchTypeSelect ||
    !groupSameTimeCheckbox ||
    !fieldSceneInput ||
    !parseFieldSceneBtn ||
    !lightCountSelect ||
    !outletCountSelect ||
    !selectionEl ||
    !groupEl ||
    !warningEl ||
    !debugEl ||
    !requiredEl ||
    !notesEl ||
    !sleeveBtn ||
    !wire16El ||
    !wire20El ||
    !wire26El ||
    !sleeveEl
  ) {
    return;
  }

  const state = {
    sceneModel: createDefaultSceneModel(),
    selectedCondition: "single_1light",
    devices: [],
    formState: null,
    inputWarnings: [],
    inputErrors: [],
    sceneParseWarnings: [],
    sceneParseErrors: [],
    simplified: { lightCount: 0, outletCount: 0 },
    diagram: EMPTY_DIAGRAM,
    error: "",
  };

  function getActiveGroup() {
    return state.sceneModel.groups[state.sceneModel.activeGroupIndex] || null;
  }

  function isSelectionReady() {
    return !!getActiveGroup() && state.devices.length > 0 && state.inputErrors.length === 0;
  }

  function readQuantityFromUi() {
    return {
      lightCount: Number(lightCountSelect.value),
      outletCount: Number(outletCountSelect.value),
    };
  }

  function syncQuantityUiFromCondition(conditionId) {
    if (conditionId === "single_1light") {
      lightCountSelect.value = "1";
      outletCountSelect.value = "0";
      return;
    }
    if (conditionId === "single_2lights_same") {
      lightCountSelect.value = "2";
      outletCountSelect.value = "0";
      return;
    }
    if (conditionId === "single_1light_1outlet") {
      lightCountSelect.value = "1";
      outletCountSelect.value = "1";
      return;
    }
    if (conditionId === "threeway_1light") {
      lightCountSelect.value = "1";
      outletCountSelect.value = "0";
    }
  }

  function rebuildDevicesFromCurrentInput() {
    const group = getActiveGroup();
    if (!group) {
      state.formState = null;
      state.devices = [];
      state.inputWarnings = [];
      state.inputErrors = [];
      state.simplified = { lightCount: 0, outletCount: 0 };
      return;
    }
    const quantity = readQuantityFromUi();
    _setGroupQuantity(group, "light", quantity.lightCount);
    _setGroupQuantity(group, "outlet", quantity.outletCount);
    group.switchType = groupSwitchTypeSelect.value === "threeway" ? "threeway" : "single";
    group.sameTime = groupSameTimeCheckbox.checked;

    state.formState = buildDeviceListFromUi({
      circuitType: group.switchType === "threeway" ? "threeway" : "single",
      mode: state.sceneModel.mode,
      lightCount: quantity.lightCount,
      outletCount: quantity.outletCount,
      sameTime: group.sameTime,
      controlCount: 1,
    });
    const built = buildDiagramInputFromGroup(group);
    state.devices = built.devices;
    state.inputWarnings = built.warnings;
    state.inputErrors = built.errors;
    state.simplified = built.resolved;
    state.selectedCondition = built.conditionId;
  }

  function getConditionLabel() {
    const group = getActiveGroup();
    if (!group) return "未選択";
    if (!state.selectedCondition) {
      const q = readQuantityFromUi();
      return `照明${q.lightCount}灯 / コンセント${q.outletCount}個`;
    }
    const circuitType = group.switchType === "threeway" ? "threeway" : "single";
    const hit = CONDITION_OPTIONS[circuitType].find((c) => c.id === state.selectedCondition);
    return hit ? hit.label : "カスタム";
  }

  function renderConditionButtons() {
    conditionButtonsEl.innerHTML = "";
    const group = getActiveGroup();
    if (!group) {
      conditionHintEl.textContent = "先に回路を選んでください。";
      return;
    }
    const circuitType = group.switchType === "threeway" ? "threeway" : "single";
    conditionHintEl.textContent = `${circuitType === "single" ? "片切" : "3路"} の条件を選んでください。`;
    CONDITION_OPTIONS[circuitType].forEach((option) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = option.label;
      btn.className = "select-btn";
      if (state.selectedCondition === option.id) btn.classList.add("active");
      btn.addEventListener("click", () => {
        state.selectedCondition = option.id;
        if (option.id === "single_1light") {
          group.switchType = "single";
          group.sameTime = false;
        } else if (option.id === "single_2lights_same") {
          group.switchType = "single";
          group.sameTime = true;
        } else if (option.id === "single_1light_1outlet") {
          group.switchType = "single";
          group.sameTime = false;
        } else if (option.id === "threeway_1light") {
          group.switchType = "threeway";
          group.sameTime = false;
        }
        groupControlIdInput.value = group.controlId;
        groupSwitchTypeSelect.value = group.switchType;
        groupSameTimeCheckbox.checked = group.sameTime;
        syncQuantityUiFromCondition(option.id);
        rebuildDevicesFromCurrentInput();
        renderAll();
        if (isSelectionReady()) generateAndRender();
      });
      conditionButtonsEl.appendChild(btn);
    });
  }

  function renderSelection() {
    const group = getActiveGroup();
    const circuitType = group ? (group.switchType === "threeway" ? "threeway" : "single") : null;
    const circuitText = circuitType === "single" ? "片切" : circuitType === "threeway" ? "3路" : "未選択";
    const quantity = readQuantityFromUi();
    const modeText =
      state.sceneModel.mode === "exam"
        ? "試験モード"
        : state.sceneModel.mode === "exam_gamidenki"
          ? "ガミデンキモード"
          : "現場モード";
    selectionEl.textContent = JSON.stringify(
      {
        回路を選ぶ: circuitText,
        条件を選ぶ: getConditionLabel(),
        照明数: `${quantity.lightCount}灯`,
        コンセント数: `${quantity.outletCount}個`,
        表示モード: modeText,
      },
      null,
      2
    );
  }

  function renderActiveButtons() {
    const group = getActiveGroup();
    const circuitType = group ? (group.switchType === "threeway" ? "threeway" : "single") : null;
    circuitSingleBtn.classList.toggle("active", circuitType === "single");
    circuitThreewayBtn.classList.toggle("active", circuitType === "threeway");
    modeExamBtn.classList.toggle("active", state.sceneModel.mode === "exam");
    modeGamidenkiBtn.classList.toggle("active", state.sceneModel.mode === "exam_gamidenki");
    modeFieldBtn.classList.toggle("active", state.sceneModel.mode === "field");
  }

  function generateAndRender() {
    const rendered = renderActiveGroupDiagram(state.sceneModel);
    state.diagram = rendered.diagram;
    state.error = rendered.error;
    state.devices = rendered.devices;
    state.inputWarnings = rendered.warnings;
    state.inputErrors = rendered.errors;
    state.selectedCondition = rendered.conditionId;
    state.simplified = rendered.resolved;

    groupEl.textContent = state.diagram.groups.length ? JSON.stringify(state.diagram.groups, null, 2) : "グループ化結果なし";
    const allWarnings = [
      ...state.sceneParseWarnings,
      ...state.sceneParseErrors.map((e) => `解析エラー: ${e}`),
      ...state.inputWarnings,
      ...state.diagram.warnings,
    ];
    warningEl.textContent = allWarnings.length ? allWarnings.join("\n") : "警告なし";
    renderDiagram(state.diagram, state.error);

    const active = getActiveGroup();
    const quantity = {
      lightCount: active ? _getGroupQuantity(active, "light") : 0,
      outletCount: active ? _getGroupQuantity(active, "outlet") : 0,
    };
    const fallbackCondition = active
      ? _inferConditionIdFromCounts(
          active.switchType === "threeway" ? "threeway" : "single",
          quantity.lightCount,
          quantity.outletCount,
          !!active.sameTime
        )
      : null;
    const meta = fallbackCondition ? buildRequiredAndNotes(fallbackCondition) : { required: ["カスタム系統: 自動算出対象外"], notes: [] };
    const customNotes = !fallbackCondition ? ["カスタム系統のため必要本数は参考表示です。"] : [];
    requiredEl.textContent = meta.required.join("\n");
    notesEl.textContent = [
      ...customNotes,
      ...meta.notes,
      state.simplified.lightCount < quantity.lightCount ? `照明${quantity.lightCount - state.simplified.lightCount}灯は補助情報扱い` : "",
      state.simplified.outletCount < quantity.outletCount ? `コンセント${quantity.outletCount - state.simplified.outletCount}個は補助情報扱い` : "",
    ]
      .filter(Boolean)
      .join("\n");

    debugEl.textContent = JSON.stringify(
      {
        選択状態: {
          selectedCircuitType: active ? (active.switchType === "threeway" ? "threeway" : "single") : null,
          selectedCondition: state.selectedCondition,
          selectedMode: state.sceneModel.mode,
          activeGroupIndex: state.sceneModel.activeGroupIndex,
        },
        devices: state.devices,
        formState: state.formState,
        sceneParseWarnings: state.sceneParseWarnings,
        sceneParseErrors: state.sceneParseErrors,
        diagram: state.diagram,
        error: state.error || "なし",
      },
      null,
      2
    );
  }

  function renderAll() {
    if (!state.sceneModel.groups.length) {
      state.sceneModel.activeGroupIndex = 0;
    } else if (state.sceneModel.activeGroupIndex >= state.sceneModel.groups.length) {
      state.sceneModel.activeGroupIndex = state.sceneModel.groups.length - 1;
    }
    renderGroupList(state.sceneModel);
    renderGroupEditor(state.sceneModel, state.sceneModel.activeGroupIndex);
    renderSelection();
    renderConditionButtons();
    renderActiveButtons();
  }

  function parseAndApplyProblemText() {
    if (!(problemTextInput instanceof HTMLTextAreaElement)) return;
    const parsed = parseProblemText(problemTextInput.value);
    const diagramFormState = toDiagramFormState(parsed);
    console.info("[problem-parser] normalizedText:", parsed.normalizedText);
    console.info("[problem-parser] parsedResult:", parsed);
    console.info("[problem-parser] matchedRules:", parsed.matchedRules);
    console.info("[problem-parser] diagramFormState:", diagramFormState);
    const applied = applyParsedResult(parsed);
    if (applied.warnings.length) parsed.warnings.push(...applied.warnings);
    if (applied.errors.length) parsed.errors.push(...applied.errors);
    renderParseResult(parsed);

    if (parsed.errors.length || !applied.circuitType) {
      state.inputErrors = [...parsed.errors];
      state.inputWarnings = [...parsed.warnings];
      return;
    }
    const group = getActiveGroup();
    if (!group) return;
    if (parsed.lightCount) lightCountSelect.value = String(parsed.lightCount);
    outletCountSelect.value = String(parsed.outletCount || 0);
    group.switchType = applied.circuitType === "threeway" ? "threeway" : "single";
    group.sameTime = !!parsed.sameTime;
    state.selectedCondition = applied.conditionId || null;
    state.formState = diagramFormState;
    state.devices = applied.devices;
    state.inputWarnings = [...parsed.warnings];
    state.inputErrors = [...parsed.errors];
    state.simplified = {
      lightCount: Math.min(parsed.lightCount || 0, 2),
      outletCount: Math.min(parsed.outletCount || 0, 1),
    };
    renderGroupEditor(state.sceneModel, state.sceneModel.activeGroupIndex);
    renderAll();
    generateAndRender();
  }

  circuitSingleBtn.addEventListener("click", () => {
    const group = getActiveGroup();
    if (!group) return;
    group.switchType = "single";
    groupSwitchTypeSelect.value = "single";
    state.selectedCondition = null;
    rebuildDevicesFromCurrentInput();
    renderAll();
  });

  circuitThreewayBtn.addEventListener("click", () => {
    const group = getActiveGroup();
    if (!group) return;
    group.switchType = "threeway";
    groupSwitchTypeSelect.value = "threeway";
    state.selectedCondition = null;
    rebuildDevicesFromCurrentInput();
    renderAll();
  });

  modeExamBtn.addEventListener("click", () => {
    state.sceneModel.mode = "exam";
    rebuildDevicesFromCurrentInput();
    renderAll();
    if (isSelectionReady()) generateAndRender();
  });

  modeGamidenkiBtn.addEventListener("click", () => {
    state.sceneModel.mode = "exam_gamidenki";
    rebuildDevicesFromCurrentInput();
    renderAll();
    if (isSelectionReady()) generateAndRender();
  });

  modeFieldBtn.addEventListener("click", () => {
    state.sceneModel.mode = "field";
    rebuildDevicesFromCurrentInput();
    renderAll();
    if (isSelectionReady()) generateAndRender();
  });

  if (addGroupBtn instanceof HTMLButtonElement) {
    addGroupBtn.addEventListener("click", () => {
      if (state.sceneModel.groups.length >= 6) {
        state.inputErrors = ["系統数は6件までです。"];
        renderAll();
        generateAndRender();
        return;
      }
      const newGroup = createEmptyGroup(getNextControlId(state.sceneModel.groups));
      state.sceneModel.groups.push(newGroup);
      state.sceneModel.activeGroupIndex = state.sceneModel.groups.length - 1;
      state.selectedCondition = null;
      renderAll();
      rebuildDevicesFromCurrentInput();
      generateAndRender();
    });
  }

  if (groupSwitchTypeSelect instanceof HTMLSelectElement) {
    groupSwitchTypeSelect.addEventListener("change", () => {
      updateActiveGroupFromForm(state.sceneModel);
      state.selectedCondition = null;
      rebuildDevicesFromCurrentInput();
      renderAll();
    });
  }
  if (groupControlIdInput instanceof HTMLInputElement) {
    groupControlIdInput.addEventListener("change", () => {
      updateActiveGroupFromForm(state.sceneModel);
      renderAll();
    });
  }
  if (groupLabelInput instanceof HTMLInputElement) {
    groupLabelInput.addEventListener("change", () => {
      updateActiveGroupFromForm(state.sceneModel);
      renderAll();
    });
  }
  if (groupPurposeInput instanceof HTMLSelectElement) {
    groupPurposeInput.addEventListener("change", () => {
      updateActiveGroupFromForm(state.sceneModel);
      renderAll();
    });
  }
  if (groupSameTimeCheckbox instanceof HTMLInputElement) {
    groupSameTimeCheckbox.addEventListener("change", () => {
      updateActiveGroupFromForm(state.sceneModel);
      state.selectedCondition = null;
      rebuildDevicesFromCurrentInput();
      renderAll();
    });
  }

  lightCountSelect.addEventListener("change", () => {
    state.selectedCondition = null;
    rebuildDevicesFromCurrentInput();
    renderAll();
  });

  outletCountSelect.addEventListener("change", () => {
    state.selectedCondition = null;
    rebuildDevicesFromCurrentInput();
    renderAll();
  });

  const groupListEl = document.getElementById("group-list");
  if (groupListEl instanceof HTMLElement) {
    groupListEl.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const btn = target.closest("[data-group-index]");
      if (!(btn instanceof HTMLElement)) return;
      const idx = Number(btn.dataset.groupIndex);
      if (!Number.isInteger(idx) || idx < 0 || idx >= state.sceneModel.groups.length) return;
      state.sceneModel.activeGroupIndex = idx;
      state.selectedCondition = null;
      renderAll();
      rebuildDevicesFromCurrentInput();
      generateAndRender();
    });
  }

  if (parseFieldSceneBtn instanceof HTMLButtonElement) {
    parseFieldSceneBtn.addEventListener("click", () => {
      if (!(fieldSceneInput instanceof HTMLTextAreaElement)) return;
      const parsedScene = parseFieldSceneText(fieldSceneInput.value);
      state.sceneParseWarnings = parsedScene.warnings;
      state.sceneParseErrors = parsedScene.errors;
      if (parsedScene.groups.length) {
        state.sceneModel.groups = parsedScene.groups;
        state.sceneModel.activeGroupIndex = 0;
        state.selectedCondition = null;
        renderAll();
        rebuildDevicesFromCurrentInput();
        generateAndRender();
      } else {
        renderAll();
        generateAndRender();
      }
    });
  }

  generateBtn.addEventListener("click", () => {
    generateAndRender();
  });

  if (parseProblemButton instanceof HTMLButtonElement) {
    parseProblemButton.addEventListener("click", () => {
      parseAndApplyProblemText();
    });
  }

  sleeveBtn.addEventListener("click", () => {
    const result = judgeSleeve({
      wire16Count: Number(wire16El.value),
      wire20Count: Number(wire20El.value),
      wire26Count: Number(wire26El.value),
    });
    sleeveEl.textContent = JSON.stringify(result, null, 2);
  });

  sleeveEl.textContent = JSON.stringify(judgeSleeve({ wire16Count: 2, wire20Count: 0, wire26Count: 0 }), null, 2);
  rebuildDevicesFromCurrentInput();
  renderAll();
  generateAndRender();
}
