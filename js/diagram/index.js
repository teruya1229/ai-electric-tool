/**
 * @typedef {"exam" | "field" | "exam_gamidenki"} DiagramMode
 * @typedef {"single" | "threeway"} CircuitType
 * @typedef {"power"|"joint"|"switch_single"|"switch_3way"|"switch_4way"|"light"|"outlet"|"outlet_e"|"fan"|"earth"} DeviceKind
 * @typedef {{id:string,kind:DeviceKind,name:string,controlId?:number,position?:number}} InputDevice
 * @typedef {{x:number,y:number}} Point
 * @typedef {"L"|"N"|"R"|"T1"|"T2"|"E"} ConductorType
 * @typedef {{id:string,conductor:ConductorType,points:Point[]}} DiagramWire
 * @typedef {{id:string,kind:DeviceKind,label:string,x:number,y:number,meta?:Record<string, unknown>}} DiagramDevice
 * @typedef {{id:string,x:number,y:number,sleeveInfo?:string[]}} DiagramJoint
 * @typedef {"single_switch_1light"|"single_switch_2lights_same_time"|"three_way_1light"} TemplateId
 * @typedef {{controlId:number,controlLabel:string,templateId:TemplateId,devices:InputDevice[]}} CircuitGroup
 * @typedef {{mode:DiagramMode,groups:CircuitGroup[],devices:DiagramDevice[],wires:DiagramWire[],joints:DiagramJoint[],warnings:string[]}} GeneratedDiagram
 * @typedef {{wire16Count:number,wire20Count:number,wire26Count:number}} SleeveJudgeInput
 * @typedef {{error:boolean,sleeveSize?:"small"|"medium"|"large",mark?:"○"|"小"|"中"|"大",display?:string,reason?:string,message?:string}} SleeveJudgeResult
 */

export const EXAM_LABELS = ["イ", "ロ", "ハ", "ニ", "ホ", "ヘ", "ト", "チ", "リ", "ヌ", "ル", "ヲ"];
const WIRE_COLORS = { L: "#111111", N: "#1d4ed8", R: "#dc2626", T1: "#0ea5e9", T2: "#1e40af", E: "#16a34a" };

export const CONDITION_OPTIONS = {
  single: [
    { id: "single_1light", label: "1灯" },
    { id: "single_2lights_same", label: "2灯同時" },
    { id: "single_1light_1outlet", label: "コンセントあり" },
  ],
  threeway: [{ id: "threeway_1light", label: "1灯" }],
};

export const EMPTY_DIAGRAM = { mode: "exam", groups: [], devices: [], wires: [], joints: [], warnings: [] };

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
 * @param {CircuitType | null} circuitType
 * @param {string | null} condition
 * @returns {InputDevice[]}
 */
export function buildDevicesFromSelection(circuitType, condition) {
  if (!circuitType || !condition) return [];

  if (circuitType === "single" && condition === "single_1light") {
    return [
      { id: "power", kind: "power", name: "電源" },
      { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
      { id: "light1", kind: "light", name: "R1", controlId: 1 },
    ];
  }

  if (circuitType === "single" && condition === "single_2lights_same") {
    return [
      { id: "power", kind: "power", name: "電源" },
      { id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 },
      { id: "light1", kind: "light", name: "R1", controlId: 1 },
      { id: "light2", kind: "light", name: "R2", controlId: 1 },
    ];
  }

  if (circuitType === "single" && condition === "single_1light_1outlet") {
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
      const switchSingleCount = groupDevices.filter((d) => d.kind === "switch_single").length;
      const switch3wayCount = groupDevices.filter((d) => d.kind === "switch_3way").length;
      const lightCount = groupDevices.filter((d) => d.kind === "light").length;

      if (switchSingleCount === 1 && switch3wayCount === 0 && lightCount === 1) {
        groups.push({ controlId, controlLabel, templateId: "single_switch_1light", devices: groupDevices });
        return;
      }
      if (switchSingleCount === 1 && switch3wayCount === 0 && lightCount === 2) {
        groups.push({ controlId, controlLabel, templateId: "single_switch_2lights_same_time", devices: groupDevices });
        return;
      }
      if (switchSingleCount === 0 && switch3wayCount === 2 && lightCount === 1) {
        groups.push({
          controlId,
          controlLabel,
          templateId: "three_way_1light",
          switchType: "threeway",
          devices: groupDevices,
        });
        return;
      }

      warnings.push(`controlId=${controlId} の条件がテンプレに一致しません`);
    });

  if (!groups.length) warnings.push("グループ化結果なし");
  return { groups, warnings };
}

/**
 * @param {InputDevice[]} devices
 * @param {DiagramMode} mode
 */
export function groupDevicesByControl(devices, mode) {
  return groupDevicesByControlWithWarnings(devices, mode).groups;
}

/**
 * @param {InputDevice[]} devices
 * @param {DiagramMode} mode
 * @returns {GeneratedDiagram}
 */
export function generateDiagram(devices, mode) {
  /** @type {string[]} */
  const warnings = [];
  /** @type {DiagramDevice[]} */
  const diagramDevices = [];
  /** @type {DiagramWire[]} */
  const wires = [];
  /** @type {DiagramJoint[]} */
  const joints = [];

  const grouped = groupDevicesByControlWithWarnings(devices, mode);
  warnings.push(...grouped.warnings);
  const outlets = devices.filter((d) => d.kind === "outlet");

  let lightSerial = 1;
  grouped.groups.forEach((group, index) => {
    const baseY = 30 + index * 210;
    const yL = baseY + 20;
    const yN = baseY + 150;
    const powerX = 90;
    const powerY = baseY + 85;

    diagramDevices.push({ id: `power-${index}`, kind: "power", label: "電源", x: powerX, y: powerY });
    wires.push({ id: `bus-l-${index}`, conductor: "L", points: [{ x: 60, y: yL }, { x: 820, y: yL }] });
    wires.push({ id: `bus-n-${index}`, conductor: "N", points: [{ x: 60, y: yN }, { x: 820, y: yN }] });
    wires.push({ id: `power-l-${index}`, conductor: "L", points: [{ x: powerX, y: powerY - 12 }, { x: powerX, y: yL }] });
    wires.push({ id: `power-n-${index}`, conductor: "N", points: [{ x: powerX, y: powerY + 12 }, { x: powerX, y: yN }] });

    if (group.templateId === "single_switch_1light" || group.templateId === "single_switch_2lights_same_time") {
      const swX = 310;
      const swY = baseY + 108;
      diagramDevices.push({ id: `sw-${index}`, kind: "switch_single", label: `SW（${group.controlLabel}）`, x: swX, y: swY });
      wires.push({ id: `l-sw-${index}`, conductor: "L", points: [{ x: swX, y: yL }, { x: swX, y: swY - 18 }] });
      joints.push(makeJoint(`joint-l-${index}`, swX, yL, 2, 0, 0));

      const lights = group.devices.filter((d) => d.kind === "light");
      lights.forEach((light, lightIndex) => {
        const lightX = 560 + lightIndex * 180;
        const lightY = baseY + 84 + lightIndex * 24;
        diagramDevices.push({
          id: `light-${index}-${light.id}`,
          kind: "light",
          label: `${light.name || `R${lightSerial}`}（${group.controlLabel}）`,
          x: lightX,
          y: lightY,
        });
        lightSerial += 1;
        wires.push({
          id: `r-light-${index}-${light.id}`,
          conductor: "R",
          points: [{ x: swX, y: swY + 18 }, { x: swX + 80, y: swY + 18 }, { x: swX + 80, y: lightY }, { x: lightX - 24, y: lightY }],
        });
        wires.push({ id: `n-light-${index}-${light.id}`, conductor: "N", points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }] });
        joints.push(makeJoint(`joint-n-${index}-${light.id}`, lightX, yN, 2, 0, 0));
      });

      if (outlets.length) {
        const outlet = outlets[0];
        const outletX = 740;
        const outletY = baseY + 138;
        diagramDevices.push({ id: `outlet-${index}`, kind: "outlet", label: outlet.name || "C1", x: outletX, y: outletY });
        wires.push({ id: `l-outlet-${index}`, conductor: "L", points: [{ x: outletX, y: yL }, { x: outletX, y: outletY - 18 }] });
        wires.push({ id: `n-outlet-${index}`, conductor: "N", points: [{ x: outletX + 14, y: yN }, { x: outletX + 14, y: outletY + 18 }] });
      }
      return;
    }

    const sws = group.devices
      .filter((d) => d.kind === "switch_3way")
      .sort((a, b) => (a.position || 999) - (b.position || 999));
    if (sws.length !== 2) {
      warnings.push("3路スイッチが2個そろっていません");
      return;
    }

    const sw1X = 270;
    const sw2X = 520;
    const swY = baseY + 104;
    const lightX = 760;
    const lightY = baseY + 86;
    diagramDevices.push({ id: `sw1-${index}`, kind: "switch_3way", label: `SW（${group.controlLabel}）`, x: sw1X, y: swY, meta: { terminals: [0, 1, 3] } });
    diagramDevices.push({ id: `sw2-${index}`, kind: "switch_3way", label: `SW（${group.controlLabel}）`, x: sw2X, y: swY, meta: { terminals: [0, 1, 3] } });
    diagramDevices.push({ id: `light-${index}`, kind: "light", label: `R${lightSerial}（${group.controlLabel}）`, x: lightX, y: lightY });
    lightSerial += 1;

    wires.push({ id: `l-sw1-${index}`, conductor: "L", points: [{ x: sw1X, y: yL }, { x: sw1X, y: swY - 24 }] });
    wires.push({ id: `t1-${index}`, conductor: "T1", points: [{ x: sw1X + 24, y: swY - 12 }, { x: sw2X - 24, y: swY - 12 }] });
    wires.push({ id: `t2-${index}`, conductor: "T2", points: [{ x: sw1X + 24, y: swY + 12 }, { x: sw2X - 24, y: swY + 12 }] });
    wires.push({
      id: `r-light-${index}`,
      conductor: "R",
      points: [{ x: sw2X, y: swY - 24 }, { x: sw2X + 90, y: swY - 24 }, { x: sw2X + 90, y: lightY }, { x: lightX - 24, y: lightY }],
    });
    wires.push({ id: `n-light-${index}`, conductor: "N", points: [{ x: lightX, y: yN }, { x: lightX, y: lightY + 24 }] });

    joints.push(makeJoint(`joint-l-3-${index}`, sw1X, yL, 2, 0, 0));
    joints.push(makeJoint(`joint-n-3-${index}`, lightX, yN, 2, 0, 0));
  });

  return { mode, groups: grouped.groups, devices: diagramDevices, wires, joints, warnings };
}

/**
 * @param {string | null} condition
 */
export function buildRequiredAndNotes(condition) {
  if (condition === "single_1light") {
    return {
      required: ["電源→SW：2C", "SW→R1：2C"],
      notes: ["Nをスイッチに通さない", "返り線をLと混同しない"],
    };
  }
  if (condition === "single_2lights_same") {
    return {
      required: ["電源→SW：2C", "SW→分岐点：2C", "分岐点→R1：2C", "分岐点→R2：2C"],
      notes: ["2灯同時なので返り線は同一制御", "R1とR2のcontrolは同一"],
    };
  }
  if (condition === "single_1light_1outlet") {
    return {
      required: ["電源→SW：2C", "SW→R1：2C", "電源→C1：2C"],
      notes: ["コンセントは常時給電", "照明返り線とコンセントLを混同しない"],
    };
  }
  return {
    required: ["電源→3路(イ)：2C", "3路(イ)→3路(イ)：3C", "3路(イ)→R1：2C"],
    notes: ["3路の共通端子0を渡り線につながない", "渡り線は2本必要", "Nは照明へ直結"],
  };
}

/**
 * @param {SleeveJudgeInput} input
 * @returns {SleeveJudgeResult}
 */
export function judgeSleeve(input) {
  const wire16 = input.wire16Count;
  const wire20 = input.wire20Count;
  const wire26 = input.wire26Count;
  if ([wire16, wire20, wire26].some((v) => !Number.isInteger(v) || v < 0)) {
    return { error: true, reason: "本数は0以上の整数で入力してください。", message: "定義外の組み合わせです" };
  }
  if (wire16 + wire20 + wire26 < 2) {
    return { error: true, reason: "接続本数が不足しています。", message: "定義外の組み合わせです" };
  }

  if (wire20 === 0 && wire26 === 0) {
    if (wire16 === 2) return { error: false, sleeveSize: "small", mark: "○", display: "○ (small)", reason: "1.6mm 2本", message: "判定: ○ (small)" };
    if (wire16 >= 3 && wire16 <= 4) return { error: false, sleeveSize: "small", mark: "小", display: "小 (small)", reason: "1.6mm 3〜4本", message: "判定: 小 (small)" };
    if (wire16 >= 5 && wire16 <= 6) return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "1.6mm 5〜6本", message: "判定: 中 (medium)" };
    if (wire16 >= 7) return { error: false, sleeveSize: "large", mark: "大", display: "大 (large)", reason: "1.6mm 7本以上", message: "判定: 大 (large)" };
  }

  if (wire16 === 0 && wire26 === 0) {
    if (wire20 === 2) return { error: false, sleeveSize: "small", mark: "小", display: "小 (small)", reason: "2.0mm 2本", message: "判定: 小 (small)" };
    if (wire20 >= 3 && wire20 <= 4) return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "2.0mm 3〜4本", message: "判定: 中 (medium)" };
    if (wire20 >= 5) return { error: false, sleeveSize: "large", mark: "大", display: "大 (large)", reason: "2.0mm 5本以上", message: "判定: 大 (large)" };
  }

  if (wire16 === 0 && wire20 === 0) {
    if (wire26 === 2) return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "2.6mm 2本", message: "判定: 中 (medium)" };
    if (wire26 >= 3) return { error: false, sleeveSize: "large", mark: "大", display: "大 (large)", reason: "2.6mm 3本以上", message: "判定: 大 (large)" };
  }

  if (wire26 === 0 && wire20 === 1 && wire16 >= 1) {
    if (wire16 <= 2) return { error: false, sleeveSize: "small", mark: "小", display: "小 (small)", reason: "2.0mm1本 + 1.6mm1〜2本", message: "判定: 小 (small)" };
    if (wire16 <= 5) return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "2.0mm1本 + 1.6mm3〜5本", message: "判定: 中 (medium)" };
    return { error: false, sleeveSize: "large", mark: "大", display: "大 (large)", reason: "2.0mm1本 + 1.6mm6本以上", message: "判定: 大 (large)" };
  }

  if (wire26 === 0 && wire20 === 2 && wire16 >= 1 && wire16 <= 3) {
    return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "2.0mm2本 + 1.6mm1〜3本", message: "判定: 中 (medium)" };
  }

  if (wire26 === 0 && wire20 === 3 && wire16 === 1) {
    return { error: false, sleeveSize: "medium", mark: "中", display: "中 (medium)", reason: "2.0mm3本 + 1.6mm1本", message: "判定: 中 (medium)" };
  }

  return { error: true, reason: "ルール未定義の組み合わせです。", message: "定義外の組み合わせです" };
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
 * @param {string} renderError
 */
export function renderDiagram(diagram, renderError) {
  const canvas = document.getElementById("diagram-canvas");
  if (!canvas) return;
  canvas.innerHTML = "";

  if (diagram.mode === "exam_gamidenki") {
    renderExamStyleDiagram(diagram, renderError);
    return;
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 900 460");
  svg.setAttribute("width", "900");
  svg.setAttribute("height", "460");

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "900");
  bg.setAttribute("height", "460");
  bg.setAttribute("fill", "#f8fafc");
  bg.setAttribute("stroke", "#cbd5e1");
  bg.setAttribute("stroke-width", "1");
  svg.appendChild(bg);

  const hasData = diagram.devices.length > 0 || diagram.wires.length > 0;
  if (!hasData || renderError) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "450");
    text.setAttribute("y", "230");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "18");
    text.setAttribute("fill", "#475569");
    text.textContent = renderError || "複線図データなし";
    svg.appendChild(text);
    canvas.appendChild(svg);
    return;
  }

  diagram.wires.forEach((wire) => {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("points", wire.points.map((p) => `${p.x},${p.y}`).join(" "));
    polyline.setAttribute("stroke", WIRE_COLORS[wire.conductor] || "#334155");
    polyline.setAttribute("stroke-width", "3");
    polyline.setAttribute("fill", "none");
    svg.appendChild(polyline);
  });

  diagram.joints.forEach((joint) => {
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", String(joint.x));
    dot.setAttribute("cy", String(joint.y));
    dot.setAttribute("r", "4");
    dot.setAttribute("fill", "#111827");
    svg.appendChild(dot);
  });

  diagram.devices.forEach((device) => {
    const width = device.kind === "power" ? 64 : 100;
    const height = device.kind === "light" ? 44 : 38;
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(device.x - width / 2));
    rect.setAttribute("y", String(device.y - height / 2));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("rx", "6");
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("stroke", "#334155");
    rect.setAttribute("stroke-width", "2");
    svg.appendChild(rect);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", String(device.x));
    label.setAttribute("y", String(device.y + 4));
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
 * @param {string} renderError
 */
function renderExamStyleDiagram(diagram, renderError) {
  const canvas = document.getElementById("diagram-canvas");
  if (!canvas) return;
  canvas.innerHTML = "";

  const groupCount = Math.max(diagram.groups.length, 1);
  const height = Math.max(420, groupCount * 300 + 80);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 900 ${height}`);
  svg.setAttribute("width", "900");
  svg.setAttribute("height", String(height));

  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", "0");
  bg.setAttribute("y", "0");
  bg.setAttribute("width", "900");
  bg.setAttribute("height", String(height));
  bg.setAttribute("fill", "#1f2937");
  bg.setAttribute("stroke", "#111827");
  bg.setAttribute("stroke-width", "1");
  svg.appendChild(bg);

  const hasData = diagram.devices.length > 0 || diagram.wires.length > 0;
  if (!hasData || renderError) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", "450");
    text.setAttribute("y", String(Math.floor(height / 2)));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "18");
    text.setAttribute("fill", "#e2e8f0");
    text.textContent = renderError || "複線図データなし";
    svg.appendChild(text);
    canvas.appendChild(svg);
    return;
  }

  const wireColor = { L: "#111111", N: "#ffffff", R: "#dc2626" };
  const drawWire = (x1, y1, x2, y2, conductor) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", wireColor[conductor] || "#94a3b8");
    line.setAttribute("stroke-width", conductor === "N" ? "4" : "3");
    svg.appendChild(line);
  };

  const drawBox = (x, y, w, h, label) => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x - w / 2));
    rect.setAttribute("y", String(y - h / 2));
    rect.setAttribute("width", String(w));
    rect.setAttribute("height", String(h));
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", "#f8fafc");
    rect.setAttribute("stroke", "#0f172a");
    rect.setAttribute("stroke-width", "2");
    svg.appendChild(rect);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y + 4));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "14");
    text.setAttribute("fill", "#0f172a");
    text.textContent = label;
    svg.appendChild(text);
  };

  diagram.groups.forEach((group, index) => {
    const centerX = 330 + (index % 2) * 260;
    const topY = 70 + Math.floor(index / 2) * 300;
    const powerY = topY;
    const controlY = topY + 65;
    const switchY = topY + 140;
    const lightY = topY + 225;
    const outletX = centerX + 180;
    const outletY = switchY + 20;
    const label = group.controlLabel;
    const swCount = group.devices.filter((d) => d.kind === "switch_3way").length;
    const lightDevice = group.devices.find((d) => d.kind === "light");
    const outletDevice = diagram.devices.find((d) => d.kind === "outlet" && d.id.includes(`-${index}`));

    drawWire(centerX, powerY + 18, centerX, controlY - 18, "L");
    drawWire(centerX, controlY + 18, centerX, switchY - 18, "L");
    drawWire(centerX, switchY + 18, centerX, lightY - 18, "R");
    drawWire(centerX + 38, controlY + 18, centerX + 38, lightY - 18, "N");

    drawBox(centerX, powerY, 88, 36, "電源");
    drawBox(centerX, controlY, 72, 36, `(${label})`);
    drawBox(centerX, switchY, 112, 40, swCount === 2 ? `SW1/SW2(${label})` : `SW(${label})`);
    drawBox(centerX, lightY, 112, 40, `${lightDevice?.name || "R1"}(${label})`);

    if (outletDevice) {
      drawWire(centerX, controlY, outletX - 50, outletY - 6, "L");
      drawWire(centerX + 38, controlY, outletX - 38, outletY + 6, "N");
      drawBox(outletX, outletY, 96, 36, `${outletDevice.label || "C1"}`);
    }
  });

  canvas.appendChild(svg);
}
