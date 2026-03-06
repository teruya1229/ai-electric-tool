/**
 * Diagram mode
 * @typedef {"exam" | "field"} DiagramMode
 */

/**
 * @typedef {"power"|"joint"|"switch_single"|"switch_3way"|"switch_4way"|"light"|"outlet"|"outlet_e"|"fan"|"earth"} DeviceKind
 */

/**
 * @typedef {{id:string,kind:DeviceKind,name:string,controlId?:number,position?:number}} InputDevice
 * @typedef {{x:number,y:number}} Point
 * @typedef {{id:string,kind:DeviceKind,label:string,x:number,y:number,meta?:Record<string, unknown>}} DiagramDevice
 * @typedef {"L"|"N"|"R"|"T1"|"T2"|"E"} ConductorType
 * @typedef {{id:string,conductor:ConductorType,points:Point[]}} DiagramWire
 * @typedef {{id:string,x:number,y:number,sleeveInfo?:string[]}} DiagramJoint
 * @typedef {{controlId:number,controlLabel:string,templateId:"single_switch_1light"|"three_way_1light",devices:InputDevice[]}} CircuitGroup
 * @typedef {{mode:DiagramMode,groups:CircuitGroup[],devices:DiagramDevice[],wires:DiagramWire[],joints:DiagramJoint[],warnings:string[]}} GeneratedDiagram
 * @typedef {{wire16Count:number,wire20Count:number,wire26Count:number}} SleeveJudgeInput
 * @typedef {{error:boolean,sleeveSize?:"small"|"medium"|"large",mark?:"○"|"小"|"中"|"大",display?:string,reason?:string,message?:string}} SleeveJudgeResult
 */

const EXAM_LABELS = ["イ", "ロ", "ハ", "ニ", "ホ", "ヘ", "ト", "チ", "リ", "ヌ", "ル", "ヲ"];
const WIRE_COLORS = {
  L: "#111111",
  N: "#1d4ed8",
  R: "#dc2626",
  T1: "#0ea5e9",
  T2: "#1e40af",
  E: "#16a34a",
};

/** @type {InputDevice[]} */
const sampleSingle = [
  { id: "power", kind: "power", name: "電源" },
  { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
  { id: "light1", kind: "light", name: "R1", controlId: 1 },
];

/** @type {InputDevice[]} */
const sampleThreeWay = [
  { id: "power", kind: "power", name: "電源" },
  { id: "sw1", kind: "switch_3way", name: "SW1", controlId: 1, position: 1 },
  { id: "sw2", kind: "switch_3way", name: "SW2", controlId: 1, position: 2 },
  { id: "light1", kind: "light", name: "R1", controlId: 1 },
];

/**
 * @param {number} controlId
 * @param {DiagramMode} mode
 */
function getControlLabel(controlId, mode) {
  if (!Number.isInteger(controlId) || controlId <= 0) return `#${controlId}`;
  if (mode === "exam") return EXAM_LABELS[controlId - 1] ?? `#${controlId}`;
  return toFieldLabel(controlId);
}

/**
 * @param {number} controlId
 */
function toFieldLabel(controlId) {
  let current = controlId;
  let label = "";
  while (current > 0) {
    current -= 1;
    label = String.fromCharCode(65 + (current % 26)) + label;
    current = Math.floor(current / 26);
  }
  return label;
}

/**
 * @param {InputDevice[]} devices
 * @param {DiagramMode} mode
 * @returns {CircuitGroup[]}
 */
function groupDevicesByControl(devices, mode) {
  return groupDevicesByControlWithWarnings(devices, mode).groups;
}

/**
 * @param {InputDevice[]} devices
 * @param {DiagramMode} mode
 */
function groupDevicesByControlWithWarnings(devices, mode) {
  /** @type {Map<number, InputDevice[]>} */
  const byControl = new Map();
  /** @type {string[]} */
  const warnings = [];

  devices.forEach((device) => {
    if (typeof device.controlId !== "number") return;
    const list = byControl.get(device.controlId) || [];
    list.push(device);
    byControl.set(device.controlId, list);
  });

  /** @type {CircuitGroup[]} */
  const groups = [];
  [...byControl.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([controlId, groupDevices]) => {
      const controlLabel = getControlLabel(controlId, mode);
      if (mode === "exam" && controlLabel.startsWith("#")) {
        warnings.push(`examモードのラベル上限を超えました: controlId=${controlId}`);
      }

      const switchSingleCount = groupDevices.filter((d) => d.kind === "switch_single").length;
      const switch3wayCount = groupDevices.filter((d) => d.kind === "switch_3way").length;
      const lightCount = groupDevices.filter((d) => d.kind === "light").length;

      if (switchSingleCount === 1 && switch3wayCount === 0 && lightCount === 1) {
        groups.push({ controlId, controlLabel, templateId: "single_switch_1light", devices: groupDevices });
        return;
      }
      if (switchSingleCount === 0 && switch3wayCount === 2 && lightCount === 1) {
        groups.push({ controlId, controlLabel, templateId: "three_way_1light", devices: groupDevices });
        return;
      }

      warnings.push(
        `未対応構成: control=${controlLabel} (single=${switchSingleCount}, threeWay=${switch3wayCount}, light=${lightCount})`
      );
    });

  return { groups, warnings };
}

/**
 * @param {"small"|"medium"|"large"} sleeveSize
 * @param {"○"|"小"|"中"|"大"} mark
 * @param {string} reason
 * @returns {SleeveJudgeResult}
 */
function okSleeve(sleeveSize, mark, reason) {
  return {
    error: false,
    sleeveSize,
    mark,
    display: `${mark} (${sleeveSize})`,
    reason,
    message: `判定: ${mark} (${sleeveSize})`,
  };
}

/**
 * @param {string} reason
 * @returns {SleeveJudgeResult}
 */
function ngSleeve(reason) {
  return { error: true, reason, message: "定義外の組み合わせです" };
}

/**
 * @param {SleeveJudgeInput} input
 * @returns {SleeveJudgeResult}
 */
function judgeSleeve(input) {
  const wire16 = input.wire16Count;
  const wire20 = input.wire20Count;
  const wire26 = input.wire26Count;

  if ([wire16, wire20, wire26].some((v) => !Number.isInteger(v) || v < 0)) {
    return ngSleeve("本数は0以上の整数で入力してください。");
  }
  if (wire16 + wire20 + wire26 < 2) return ngSleeve("接続本数が不足しています。");

  if (wire20 === 0 && wire26 === 0) {
    if (wire16 === 2) return okSleeve("small", "○", "1.6mm 2本");
    if (wire16 >= 3 && wire16 <= 4) return okSleeve("small", "小", "1.6mm 3〜4本");
    if (wire16 >= 5 && wire16 <= 6) return okSleeve("medium", "中", "1.6mm 5〜6本");
    if (wire16 >= 7) return okSleeve("large", "大", "1.6mm 7本以上");
  }
  if (wire16 === 0 && wire26 === 0) {
    if (wire20 === 2) return okSleeve("small", "小", "2.0mm 2本");
    if (wire20 >= 3 && wire20 <= 4) return okSleeve("medium", "中", "2.0mm 3〜4本");
    if (wire20 >= 5) return okSleeve("large", "大", "2.0mm 5本以上");
  }
  if (wire16 === 0 && wire20 === 0) {
    if (wire26 === 2) return okSleeve("medium", "中", "2.6mm 2本");
    if (wire26 >= 3) return okSleeve("large", "大", "2.6mm 3本以上");
  }
  if (wire26 === 0 && wire20 === 1 && wire16 >= 1) {
    if (wire16 <= 2) return okSleeve("small", "小", "2.0mm1本 + 1.6mm1〜2本");
    if (wire16 <= 5) return okSleeve("medium", "中", "2.0mm1本 + 1.6mm3〜5本");
    return okSleeve("large", "大", "2.0mm1本 + 1.6mm6本以上");
  }
  if (wire26 === 0 && wire20 === 2 && wire16 >= 1 && wire16 <= 3) {
    return okSleeve("medium", "中", "2.0mm2本 + 1.6mm1〜3本");
  }
  if (wire26 === 0 && wire20 === 3 && wire16 === 1) {
    return okSleeve("medium", "中", "2.0mm3本 + 1.6mm1本");
  }
  return ngSleeve("ルール未定義の組み合わせです。");
}

/**
 * @param {InputDevice[]} devices
 * @param {DiagramMode} mode
 * @returns {GeneratedDiagram}
 */
function generateDiagram(devices, mode) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {DiagramDevice[]} */
  const diagramDevices = [];
  /** @type {DiagramWire[]} */
  const wires = [];
  /** @type {DiagramJoint[]} */
  const joints = [];

  if (!devices.some((d) => d.kind === "power")) warnings.push("powerが見つかりません。仮の始点で描画します。");

  const grouped = groupDevicesByControlWithWarnings(devices, mode);
  warnings.push(...grouped.warnings);

  let lightSerial = 1;
  grouped.groups.forEach((group, index) => {
    const baseY = 40 + index * 220;
    const yL = baseY + 20;
    const yN = baseY + 150;
    const powerX = 90;
    const powerY = baseY + 85;

    diagramDevices.push({ id: `power-${index}`, kind: "power", label: "電源", x: powerX, y: powerY });
    wires.push({ id: `bus-l-${group.controlId}`, conductor: "L", points: [{ x: 60, y: yL }, { x: 780, y: yL }] });
    wires.push({ id: `bus-n-${group.controlId}`, conductor: "N", points: [{ x: 60, y: yN }, { x: 780, y: yN }] });
    wires.push({ id: `power-l-${group.controlId}`, conductor: "L", points: [{ x: powerX, y: powerY - 12 }, { x: powerX, y: yL }] });
    wires.push({ id: `power-n-${group.controlId}`, conductor: "N", points: [{ x: powerX, y: powerY + 12 }, { x: powerX, y: yN }] });

    if (group.templateId === "single_switch_1light") {
      const swX = 320;
      const swY = baseY + 120;
      const lightX = 620;
      const lightY = baseY + 90;

      diagramDevices.push({ id: `sw-${group.controlId}`, kind: "switch_single", label: `SW（${group.controlLabel}）`, x: swX, y: swY });
      diagramDevices.push({ id: `light-${group.controlId}`, kind: "light", label: `R${lightSerial}（${group.controlLabel}）`, x: lightX, y: lightY });
      lightSerial += 1;

      wires.push({ id: `l-sw-${group.controlId}`, conductor: "L", points: [{ x: swX, y: yL }, { x: swX, y: swY - 18 }] });
      wires.push({
        id: `r-light-${group.controlId}`,
        conductor: "R",
        points: [{ x: swX, y: swY + 18 }, { x: swX + 100, y: swY + 18 }, { x: swX + 100, y: lightY }, { x: lightX - 24, y: lightY }],
      });
      wires.push({ id: `n-light-${group.controlId}`, conductor: "N", points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }] });
      joints.push(makeJoint(`joint-l-${group.controlId}`, swX, yL, 2, 0, 0));
      joints.push(makeJoint(`joint-n-${group.controlId}`, lightX, yN, 2, 0, 0));
      return;
    }

    const sws = group.devices
      .filter((d) => d.kind === "switch_3way")
      .sort((a, b) => (a.position || 999) - (b.position || 999));
    if (sws.length !== 2) {
      warnings.push(`control=${group.controlLabel} の3路スイッチ数が不正です。`);
      return;
    }

    const sw1X = 280;
    const sw2X = 500;
    const swY = baseY + 105;
    const lightX = 700;
    const lightY = baseY + 85;
    diagramDevices.push({ id: `sw1-${group.controlId}`, kind: "switch_3way", label: `SW（${group.controlLabel}）`, x: sw1X, y: swY, meta: { terminals: [0, 1, 3], position: sws[0].position || 1 } });
    diagramDevices.push({ id: `sw2-${group.controlId}`, kind: "switch_3way", label: `SW（${group.controlLabel}）`, x: sw2X, y: swY, meta: { terminals: [0, 1, 3], position: sws[1].position || 2 } });
    diagramDevices.push({ id: `light-${group.controlId}`, kind: "light", label: `R${lightSerial}（${group.controlLabel}）`, x: lightX, y: lightY });
    lightSerial += 1;

    wires.push({ id: `l-sw1-${group.controlId}`, conductor: "L", points: [{ x: sw1X, y: yL }, { x: sw1X, y: swY - 24 }] });
    wires.push({ id: `t1-${group.controlId}`, conductor: "T1", points: [{ x: sw1X + 24, y: swY - 12 }, { x: sw2X - 24, y: swY - 12 }] });
    wires.push({ id: `t2-${group.controlId}`, conductor: "T2", points: [{ x: sw1X + 24, y: swY + 12 }, { x: sw2X - 24, y: swY + 12 }] });
    wires.push({
      id: `r-light-${group.controlId}`,
      conductor: "R",
      points: [{ x: sw2X, y: swY - 24 }, { x: sw2X + 90, y: swY - 24 }, { x: sw2X + 90, y: lightY }, { x: lightX - 24, y: lightY }],
    });
    wires.push({ id: `n-light-${group.controlId}`, conductor: "N", points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }] });
    joints.push(makeJoint(`joint-l-${group.controlId}`, sw1X, yL, 2, 0, 0));
    joints.push(makeJoint(`joint-n-${group.controlId}`, lightX, yN, 2, 0, 0));
  });

  return { mode, groups: grouped.groups, devices: diagramDevices, wires, joints, warnings };
}

/**
 * @param {string} id
 * @param {number} x
 * @param {number} y
 * @param {number} wire16Count
 * @param {number} wire20Count
 * @param {number} wire26Count
 * @returns {DiagramJoint}
 */
function makeJoint(id, x, y, wire16Count, wire20Count, wire26Count) {
  const judged = judgeSleeve({ wire16Count, wire20Count, wire26Count });
  return {
    id,
    x,
    y,
    sleeveInfo: judged.error ? ["判定不可", judged.reason || "定義外"] : [`${judged.display || ""}`, judged.reason || ""].filter(Boolean),
  };
}

/**
 * @param {GeneratedDiagram} diagram
 */
function renderDiagram(diagram) {
  const canvas = document.getElementById("diagram-canvas");
  if (!canvas) return;
  canvas.innerHTML = "";

  const height = Math.max(260, diagram.groups.length * 220 + 60);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 840 ${height}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", `${height}`);

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "840");
  bg.setAttribute("height", String(height));
  bg.setAttribute("fill", "#f8fafc");
  svg.appendChild(bg);

  diagram.wires.forEach((wire) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const d = wire.points.map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    path.setAttribute("d", d);
    path.setAttribute("stroke", WIRE_COLORS[wire.conductor]);
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    svg.appendChild(path);
  });

  diagram.joints.forEach((joint) => {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", String(joint.x));
    circle.setAttribute("cy", String(joint.y));
    circle.setAttribute("r", "5");
    circle.setAttribute("fill", "#111827");
    svg.appendChild(circle);

    if (joint.sleeveInfo && joint.sleeveInfo.length > 0) {
      const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", String(joint.x + 8));
      txt.setAttribute("y", String(joint.y - 8));
      txt.setAttribute("font-size", "10");
      txt.setAttribute("fill", "#334155");
      txt.textContent = joint.sleeveInfo.join(" / ");
      svg.appendChild(txt);
    }
  });

  diagram.devices.forEach((device) => {
    const width = device.kind === "power" ? 64 : 96;
    const heightBox = device.kind === "light" ? 44 : 36;
    const x = device.x - width / 2;
    const y = device.y - heightBox / 2;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(heightBox));
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#334155");
    rect.setAttribute("stroke-width", "2");
    svg.appendChild(rect);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(device.x));
    label.setAttribute("y", String(device.y + 5));
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "12");
    label.setAttribute("fill", "#0f172a");
    label.textContent = device.label;
    svg.appendChild(label);

    if (device.kind === "switch_3way") {
      const terminals = document.createElementNS("http://www.w3.org/2000/svg", "text");
      terminals.setAttribute("x", String(device.x));
      terminals.setAttribute("y", String(device.y + 20));
      terminals.setAttribute("text-anchor", "middle");
      terminals.setAttribute("font-size", "11");
      terminals.setAttribute("fill", "#475569");
      terminals.textContent = "0 / 1 / 3";
      svg.appendChild(terminals);
    }
  });

  canvas.appendChild(svg);
}

/**
 * @param {GeneratedDiagram} diagram
 */
function renderInfo(diagram) {
  const groupsEl = document.getElementById("group-result");
  const warningsEl = document.getElementById("warning-result");
  if (groupsEl) groupsEl.textContent = JSON.stringify(diagram.groups, null, 2);
  if (warningsEl) warningsEl.textContent = diagram.warnings.length ? diagram.warnings.join("\n") : "warning はありません。";
}

/**
 * @param {SleeveJudgeResult} result
 */
function renderSleeveResult(result) {
  const sleeveEl = document.getElementById("sleeve-result");
  if (!sleeveEl) return;
  sleeveEl.textContent = JSON.stringify(result, null, 2);
}

function initPlayground() {
  const modeEl = document.getElementById("mode-select");
  const sampleSingleBtn = document.getElementById("sample-single-btn");
  const sampleThreeWayBtn = document.getElementById("sample-threeway-btn");
  const sleeveBtn = document.getElementById("sleeve-judge-btn");
  const wire16El = document.getElementById("wire16-count");
  const wire20El = document.getElementById("wire20-count");
  const wire26El = document.getElementById("wire26-count");

  /** @type {InputDevice[]} */
  let currentDevices = sampleSingle;

  const refresh = () => {
    /** @type {DiagramMode} */
    const mode = modeEl && modeEl.value === "field" ? "field" : "exam";
    const diagram = generateDiagram(currentDevices, mode);
    renderInfo(diagram);
    renderDiagram(diagram);
  };

  if (sampleSingleBtn) {
    sampleSingleBtn.addEventListener("click", () => {
      currentDevices = sampleSingle;
      refresh();
    });
  }
  if (sampleThreeWayBtn) {
    sampleThreeWayBtn.addEventListener("click", () => {
      currentDevices = sampleThreeWay;
      refresh();
    });
  }
  if (modeEl) modeEl.addEventListener("change", refresh);

  if (sleeveBtn && wire16El && wire20El && wire26El) {
    sleeveBtn.addEventListener("click", () => {
      const result = judgeSleeve({
        wire16Count: Number(wire16El.value),
        wire20Count: Number(wire20El.value),
        wire26Count: Number(wire26El.value),
      });
      renderSleeveResult(result);
    });
  }

  refresh();
  renderSleeveResult(judgeSleeve({ wire16Count: 2, wire20Count: 0, wire26Count: 0 }));
}

initPlayground();
