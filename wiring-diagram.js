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

const EXAM_LABELS = ["イ", "ロ", "ハ", "ニ", "ホ", "ヘ", "ト", "チ", "リ", "ヌ", "ル", "ヲ"];
const WIRE_COLORS = { L: "#111111", N: "#1d4ed8", R: "#dc2626", T1: "#0ea5e9", T2: "#1e40af", E: "#16a34a" };

const CONDITION_OPTIONS = {
  single: [
    { id: "single_1light", label: "1灯" },
    { id: "single_2lights_same", label: "2灯同時" },
    { id: "single_1light_1outlet", label: "コンセントあり" },
  ],
  threeway: [{ id: "threeway_1light", label: "1灯" }],
};

const EMPTY_DIAGRAM = { mode: "exam", groups: [], devices: [], wires: [], joints: [], warnings: [] };
const PARSE_RULES = {
  circuitType: [
    { value: "single", rule: "circuit:single", patterns: [/片切/, /single/] },
    { value: "threeway", rule: "circuit:threeway", patterns: [/3路/, /三路/, /threeway/, /3-way/] },
  ],
  lightCount: [
    { value: 1, rule: "light:1", patterns: [/1灯/, /一灯/] },
    { value: 2, rule: "light:2", patterns: [/2灯/, /二灯/] },
    { value: 3, rule: "light:3", patterns: [/3灯/, /三灯/] },
    { value: 4, rule: "light:4", patterns: [/4灯/, /四灯/] },
    { value: 5, rule: "light:5", patterns: [/5灯/, /五灯/] },
    { value: 6, rule: "light:6", patterns: [/6灯/, /六灯/] },
  ],
  outletCount: [
    { value: 1, rule: "outlet:1", patterns: [/コンセント\s*1個/, /コンセント\s*一個/] },
    { value: 2, rule: "outlet:2", patterns: [/コンセント\s*2個/, /コンセント\s*二個/] },
    { value: 3, rule: "outlet:3", patterns: [/コンセント\s*3個/, /コンセント\s*三個/] },
    { value: 4, rule: "outlet:4", patterns: [/コンセント\s*4個/, /コンセント\s*四個/] },
    { value: 5, rule: "outlet:5", patterns: [/コンセント\s*5個/, /コンセント\s*五個/] },
    { value: 6, rule: "outlet:6", patterns: [/コンセント\s*6個/, /コンセント\s*六個/] },
  ],
  outletAny: { rule: "outlet:any", patterns: [/コンセントあり/, /コンセント/] },
  sameTime: { rule: "sameTime:true", patterns: [/同時/, /同時点灯/, /まとめて/, /一括/] },
};
const UNSUPPORTED_PATTERNS = [
  { patterns: [/4路/, /四路/], message: "4路は今回の対応範囲外です。" },
  { patterns: [/タイマ/, /タイマー/, /timer/], message: "タイマ回路は今回の対応範囲外です。" },
  { patterns: [/パイロットランプ/], message: "パイロットランプ回路は今回の対応範囲外です。" },
  { patterns: [/換気扇連動/], message: "換気扇連動回路は今回の対応範囲外です。" },
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
 * @param {CircuitType | null} circuitType
 * @param {string | null} condition
 * @returns {InputDevice[]}
 */
function buildDevicesFromSelection(circuitType, condition) {
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
        groups.push({ controlId, controlLabel, templateId: "three_way_1light", devices: groupDevices });
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
function groupDevicesByControl(devices, mode) {
  return groupDevicesByControlWithWarnings(devices, mode).groups;
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
function buildRequiredAndNotes(condition) {
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
 * @param {string} text
 * @returns {string}
 */
function normalizeProblemText(text) {
  if (typeof text !== "string") return "";
  return text
    .normalize("NFKC")
    .replace(/[，、。,.]/g, " ")
    .replace(/一灯/g, "1灯")
    .replace(/二灯/g, "2灯")
    .replace(/三灯/g, "3灯")
    .replace(/四灯/g, "4灯")
    .replace(/五灯/g, "5灯")
    .replace(/六灯/g, "6灯")
    .replace(/一個/g, "1個")
    .replace(/二個/g, "2個")
    .replace(/三個/g, "3個")
    .replace(/四個/g, "4個")
    .replace(/五個/g, "5個")
    .replace(/六個/g, "6個")
    .replace(/三路/g, "3路")
    .replace(/片切り/g, "片切")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function _matchesAny(patterns, text) {
  return patterns.some((re) => re.test(text));
}

function _pickSingleByRule(rules, normalizedText) {
  const hits = rules.filter((rule) => _matchesAny(rule.patterns, normalizedText));
  return {
    hit: hits.length === 1 ? hits[0] : null,
    hitCount: hits.length,
  };
}

function _calcParseConfidence(parsed) {
  const scoreRaw =
    (parsed.circuitType ? 40 : 0) +
    (parsed.lightCount ? 40 : 0) +
    (parsed.sameTime ? 10 : 0) +
    (parsed.hasOutlet ? 10 : 0) -
    parsed.errors.length * 20 -
    parsed.warnings.length * 5;
  return Math.max(0, Math.min(100, scoreRaw));
}

/**
 * @param {string} text
 */
function parseProblemText(text) {
  const normalized = normalizeProblemText(text);
  const parsed = {
    rawText: typeof text === "string" ? text : "",
    normalizedText: normalized,
    circuitType: null,
    lightCount: null,
    outletCount: 0,
    sameTime: false,
    hasOutlet: false,
    controlCount: 1,
    devicesModel: null,
    confidence: 0,
    matchedRules: [],
    warnings: [],
    errors: [],
  };

  const addRule = (rule) => {
    if (!parsed.matchedRules.includes(rule)) parsed.matchedRules.push(rule);
  };

  if (!normalized) {
    parsed.errors.push("問題文が空です。");
    parsed.confidence = _calcParseConfidence(parsed);
    return parsed;
  }

  const circuitPicked = _pickSingleByRule(PARSE_RULES.circuitType, normalized);
  if (circuitPicked.hitCount > 1) {
    parsed.errors.push("片切と3路の両方が含まれています。");
  } else if (circuitPicked.hit) {
    parsed.circuitType = circuitPicked.hit.value;
    addRule(circuitPicked.hit.rule);
  }

  const lightPicked = _pickSingleByRule(PARSE_RULES.lightCount, normalized);
  if (lightPicked.hitCount > 1) {
    parsed.errors.push("灯数が複数候補で矛盾しています。");
  } else if (lightPicked.hit) {
    parsed.lightCount = lightPicked.hit.value;
    addRule(lightPicked.hit.rule);
  }

  const outletPicked = _pickSingleByRule(PARSE_RULES.outletCount, normalized);
  if (outletPicked.hitCount > 1) {
    parsed.errors.push("コンセント数が複数候補で矛盾しています。");
  } else if (outletPicked.hit) {
    parsed.outletCount = outletPicked.hit.value;
    addRule(outletPicked.hit.rule);
  } else if (_matchesAny(PARSE_RULES.outletAny.patterns, normalized)) {
    parsed.outletCount = 1;
    addRule(PARSE_RULES.outletAny.rule);
  }

  if (_matchesAny(PARSE_RULES.sameTime.patterns, normalized)) {
    parsed.sameTime = true;
    addRule(PARSE_RULES.sameTime.rule);
  }
  parsed.hasOutlet = parsed.outletCount > 0;
  if (!parsed.lightCount && parsed.circuitType === "single" && parsed.outletCount > 0) {
    parsed.lightCount = 1;
    parsed.warnings.push("灯数未指定のため1灯として扱います。");
    addRule("light:default1");
  }

  const validated = validateParsedCombination(parsed);
  parsed.warnings.push(...validated.warnings);
  parsed.errors.push(...validated.errors);

  parsed.devicesModel = toDiagramFormState(parsed);
  parsed.confidence = _calcParseConfidence(parsed);

  return parsed;
}

/**
 * @param {{normalizedText:string,circuitType:"single"|"threeway"|null,lightCount:number|null,outletCount:number,sameTime:boolean}} parsed
 */
function validateParsedCombination(parsed) {
  const result = { warnings: [], errors: [] };

  UNSUPPORTED_PATTERNS.forEach((item) => {
    if (_matchesAny(item.patterns, parsed.normalizedText)) result.errors.push(item.message);
  });

  if (!parsed.circuitType) {
    result.errors.push("回路種別（片切 / 3路）を判定できません。");
  }
  if (!parsed.lightCount) {
    result.errors.push("灯数（1灯 / 2灯同時）を判定できません。");
  }
  const overLight = parsed.normalizedText.match(/([0-9]+)灯/);
  if (overLight && Number(overLight[1]) > 6) {
    result.errors.push("照明数は6灯以下で入力してください。");
  }
  const overOutlet = parsed.normalizedText.match(/コンセント\s*([0-9]+)個/);
  if (overOutlet && Number(overOutlet[1]) > 6) {
    result.errors.push("コンセント数は6個以下で入力してください。");
  }
  if (parsed.lightCount && parsed.lightCount > 6) {
    result.errors.push("照明数は6灯以下で入力してください。");
  }
  if (parsed.outletCount > 6) {
    result.errors.push("コンセント数は6個以下で入力してください。");
  }
  if (parsed.circuitType === "single" && parsed.lightCount >= 2 && !parsed.sameTime) {
    result.errors.push("2灯以上だが同時条件が曖昧で今回未対応です。");
  }
  if (parsed.circuitType === "single" && parsed.lightCount === 1 && parsed.sameTime) {
    result.warnings.push("1灯条件では同時点灯指定は不要のため無視します。");
  }
  if (parsed.circuitType === "threeway" && parsed.lightCount !== null && parsed.lightCount !== 1) {
    result.errors.push("3路 + 複数照明は現行描画仕様で未対応です。");
  }
  if (parsed.circuitType === "threeway" && parsed.outletCount > 0) {
    result.errors.push("3路 + コンセントは現行描画仕様で未対応です。");
  }
  if (parsed.circuitType === "single" && parsed.lightCount !== null && parsed.lightCount >= 2 && parsed.outletCount >= 1) {
    result.warnings.push("片切の多灯+コンセントは図を簡略表示します。");
  }
  if (parsed.circuitType === "single" && parsed.lightCount !== null && parsed.lightCount > 2) {
    result.warnings.push("現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。");
  }
  if (parsed.circuitType === "single" && parsed.outletCount > 1) {
    result.warnings.push("現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。");
  }

  return result;
}

function _extractDeviceQuantity(group, type) {
  const hit = (group.devices || []).find((d) => d.type === type);
  return Number(hit?.quantity || 0);
}

function _inferConditionIdFromCounts(circuitType, lightCount, outletCount, sameTime) {
  if (circuitType === "threeway" && lightCount === 1 && outletCount === 0) return "threeway_1light";
  if (circuitType !== "single") return null;
  if (lightCount === 1 && outletCount === 0) return "single_1light";
  if (lightCount === 2 && outletCount === 0 && sameTime) return "single_2lights_same";
  if (lightCount === 1 && outletCount >= 1) return "single_1light_1outlet";
  return null;
}

/**
 * @param {{circuitType:"single"|"threeway"|null,mode?:DiagramMode,lightCount:number|null,outletCount:number,sameTime:boolean,controlCount?:number}} input
 */
function buildDeviceListFromUi(input) {
  if (!input.circuitType || !input.lightCount) return null;
  const controlId = input.circuitType === "threeway" ? "イ" : "イ";
  const devices = [{ type: "light", quantity: input.lightCount }];
  if (input.outletCount > 0) devices.push({ type: "outlet", quantity: input.outletCount });

  return {
    circuitType: input.circuitType,
    mode: input.mode || "exam",
    controlCount: input.controlCount || 1,
    sameTime: input.sameTime,
    groups: [{ controlId, switchType: input.circuitType === "threeway" ? "threeway" : "single", devices }],
  };
}

/**
 * @param {ReturnType<typeof buildDeviceListFromUi>} model
 */
function buildDiagramInputFromDevices(model) {
  const result = {
    devices: /** @type {InputDevice[]} */ ([]),
    conditionId: /** @type {string | null} */ (null),
    warnings: /** @type {string[]} */ ([]),
    errors: /** @type {string[]} */ ([]),
    resolved: { lightCount: 0, outletCount: 0 },
  };

  if (!model || !model.groups?.length) {
    result.errors.push("器具構成モデルがありません。");
    return result;
  }

  const group = model.groups[0];
  const lightCount = _extractDeviceQuantity(group, "light");
  const outletCount = _extractDeviceQuantity(group, "outlet");
  result.resolved.lightCount = lightCount;
  result.resolved.outletCount = outletCount;

  if (lightCount < 1) result.errors.push("照明数は1灯以上が必要です。");
  if (lightCount > 6) result.errors.push("照明数は6灯以下で入力してください。");
  if (outletCount > 6) result.errors.push("コンセント数は6個以下で入力してください。");
  if (result.errors.length) return result;

  if (model.circuitType === "threeway" && lightCount !== 1) {
    result.errors.push("3路 + 複数照明は現行描画仕様で未対応です。");
    return result;
  }
  if (model.circuitType === "threeway" && outletCount > 0) {
    result.errors.push("3路 + コンセントは現行描画仕様で未対応です。");
    return result;
  }
  if (model.circuitType === "single" && lightCount >= 2 && !model.sameTime) {
    result.errors.push("2灯以上は同時点灯条件が必要です。");
    return result;
  }

  let renderLightCount = lightCount;
  let renderOutletCount = outletCount;
  if (model.circuitType === "single" && lightCount > 2) {
    renderLightCount = 2;
    result.warnings.push("照明3灯以上は2灯まで図示し、残りは補助情報として扱います。");
  }
  if (model.circuitType === "single" && outletCount > 1) {
    renderOutletCount = 1;
    result.warnings.push("コンセント2個以上は1個まで図示し、残りは補助情報として扱います。");
  }

  result.conditionId = _inferConditionIdFromCounts(model.circuitType, lightCount, outletCount, model.sameTime);
  result.devices.push({ id: "power", kind: "power", name: "電源" });
  if (model.circuitType === "threeway") {
    result.devices.push({ id: "sw1", kind: "switch_3way", name: "SW1", controlId: 1, position: 1 });
    result.devices.push({ id: "sw2", kind: "switch_3way", name: "SW2", controlId: 1, position: 2 });
  } else {
    result.devices.push({ id: "sw1", kind: "switch_single", name: "SW1", controlId: 1 });
  }
  for (let i = 0; i < renderLightCount; i += 1) {
    result.devices.push({ id: `light${i + 1}`, kind: "light", name: `R${i + 1}`, controlId: 1 });
  }
  for (let i = 0; i < renderOutletCount; i += 1) {
    result.devices.push({ id: `outlet${i + 1}`, kind: "outlet", name: `C${i + 1}` });
  }

  return result;
}

function createEmptyGroup(controlId) {
  return {
    controlId,
    switchType: "single",
    sameTime: false,
    devices: [
      { type: "light", quantity: 1 },
      { type: "outlet", quantity: 0 },
    ],
  };
}

function getNextControlId(groups) {
  const used = new Set((groups || []).map((g) => g.controlId));
  for (let i = 0; i < EXAM_LABELS.length; i += 1) {
    if (!used.has(EXAM_LABELS[i])) return EXAM_LABELS[i];
  }
  return `#${(groups || []).length + 1}`;
}

function createDefaultSceneModel() {
  const first = createEmptyGroup(getNextControlId([]));
  return {
    mode: "exam",
    groups: [first],
    activeGroupIndex: 0,
  };
}

function _getGroupQuantity(group, type) {
  const hit = (group.devices || []).find((d) => d.type === type);
  return Number(hit?.quantity || 0);
}

function _setGroupQuantity(group, type, quantity) {
  const q = Number.isFinite(quantity) ? quantity : 0;
  const list = Array.isArray(group.devices) ? group.devices : [];
  const hit = list.find((d) => d.type === type);
  if (hit) {
    hit.quantity = q;
    return;
  }
  list.push({ type, quantity: q });
  group.devices = list;
}

function buildDiagramInputFromGroup(group) {
  const result = {
    devices: /** @type {InputDevice[]} */ ([]),
    conditionId: /** @type {string | null} */ (null),
    warnings: /** @type {string[]} */ ([]),
    errors: /** @type {string[]} */ ([]),
    resolved: { lightCount: 0, outletCount: 0 },
  };
  if (!group) {
    result.errors.push("系統が選択されていません。");
    return result;
  }
  const lightCount = _getGroupQuantity(group, "light");
  const outletCount = _getGroupQuantity(group, "outlet");
  const circuitType = group.switchType === "threeway" ? "threeway" : "single";
  const sameTime = !!group.sameTime;
  const effectiveSameTime = circuitType === "single" && lightCount >= 2 ? true : sameTime;

  result.resolved.lightCount = lightCount;
  result.resolved.outletCount = outletCount;
  if (lightCount === 0 && outletCount === 0) result.errors.push("照明数とコンセント数がどちらも0です。");
  if (lightCount > 6) result.errors.push("照明数は6灯以下で入力してください。");
  if (outletCount > 6) result.errors.push("コンセント数は6個以下で入力してください。");
  if (circuitType === "threeway" && outletCount > 0) result.errors.push("3路 + コンセントは未対応です。");
  if (circuitType === "threeway" && lightCount >= 2) result.errors.push("3路 + 2灯以上は未対応です。");
  if (circuitType === "single" && lightCount >= 2 && !sameTime) {
    result.warnings.push("2灯以上のため同時点灯として扱います。");
  }
  if (result.errors.length) return result;

  const model = buildDeviceListFromUi({
    circuitType,
    mode: "exam",
    lightCount,
    outletCount,
    sameTime: effectiveSameTime,
    controlCount: 1,
  });
  const built = buildDiagramInputFromDevices(model);
  result.devices = built.devices;
  result.conditionId = built.conditionId;
  result.warnings.push(...built.warnings);
  result.errors.push(...built.errors);
  result.resolved = built.resolved;
  return result;
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
    btn.textContent = `${group.controlId} | ${switchText} | 照明${_getGroupQuantity(group, "light")} | C${_getGroupQuantity(group, "outlet")}`;
    btn.dataset.groupIndex = String(index);
    listEl.appendChild(btn);
  });
}

function renderGroupEditor(sceneModel, activeGroupIndex) {
  const group = sceneModel.groups[activeGroupIndex];
  const controlIdInput = document.getElementById("group-control-id-input");
  const switchTypeSelect = document.getElementById("group-switch-type-select");
  const sameTimeCheckbox = document.getElementById("group-same-time-checkbox");
  const lightCountSelect = document.getElementById("light-count-select");
  const outletCountSelect = document.getElementById("outlet-count-select");
  if (!group || !(controlIdInput instanceof HTMLInputElement) || !(switchTypeSelect instanceof HTMLSelectElement)) return;

  controlIdInput.value = group.controlId;
  switchTypeSelect.value = group.switchType;
  if (sameTimeCheckbox instanceof HTMLInputElement) sameTimeCheckbox.checked = !!group.sameTime;
  if (lightCountSelect instanceof HTMLSelectElement) lightCountSelect.value = String(_getGroupQuantity(group, "light"));
  if (outletCountSelect instanceof HTMLSelectElement) outletCountSelect.value = String(_getGroupQuantity(group, "outlet"));
}

function updateActiveGroupFromForm(sceneModel) {
  const group = sceneModel.groups[sceneModel.activeGroupIndex];
  if (!group) return;
  const controlIdInput = document.getElementById("group-control-id-input");
  const switchTypeSelect = document.getElementById("group-switch-type-select");
  const sameTimeCheckbox = document.getElementById("group-same-time-checkbox");
  const lightCountSelect = document.getElementById("light-count-select");
  const outletCountSelect = document.getElementById("outlet-count-select");

  if (controlIdInput instanceof HTMLInputElement) group.controlId = controlIdInput.value.trim() || getNextControlId(sceneModel.groups);
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

/**
 * @param {ReturnType<typeof parseProblemText>} parsed
 */
function toDiagramFormState(parsed) {
  return buildDeviceListFromUi({
    circuitType: parsed.circuitType,
    mode: "exam",
    lightCount: parsed.lightCount,
    outletCount: parsed.outletCount || 0,
    sameTime: parsed.sameTime,
    controlCount: parsed.controlCount,
  });
}

/**
 * @param {ReturnType<typeof parseProblemText>} parsed
 */
function applyParsedResult(parsed) {
  const result = {
    circuitType: /** @type {CircuitType | null} */ (null),
    conditionId: /** @type {string | null} */ (null),
    devices: /** @type {InputDevice[]} */ ([]),
    warnings: /** @type {string[]} */ ([]),
    errors: /** @type {string[]} */ ([]),
  };

  if (!parsed || typeof parsed !== "object") {
    result.errors.push("解析結果が不正です。");
    return result;
  }

  const formState = toDiagramFormState(parsed);
  if (!formState) {
    result.errors.push("回路種別または灯数が不足しています。");
    return result;
  }

  const built = buildDiagramInputFromDevices(formState);
  result.circuitType = formState.circuitType;
  result.conditionId = built.conditionId;
  result.devices = built.devices;
  result.warnings.push(...built.warnings);
  result.errors.push(...built.errors);

  return result;
}

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

/**
 * @param {SleeveJudgeInput} input
 * @returns {SleeveJudgeResult}
 */
function judgeSleeve(input) {
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
function renderDiagram(diagram, renderError) {
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

function initPlayground() {
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
  const groupSwitchTypeSelect = document.getElementById("group-switch-type-select");
  const groupSameTimeCheckbox = document.getElementById("group-same-time-checkbox");
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
    !groupSwitchTypeSelect ||
    !groupSameTimeCheckbox ||
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
    selectedCondition: /** @type {string | null} */ ("single_1light"),
    devices: /** @type {InputDevice[]} */ ([]),
    formState: null,
    inputWarnings: /** @type {string[]} */ ([]),
    inputErrors: /** @type {string[]} */ ([]),
    simplified: { lightCount: 0, outletCount: 0 },
    diagram: /** @type {GeneratedDiagram} */ (EMPTY_DIAGRAM),
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
    const allWarnings = [...state.inputWarnings, ...state.diagram.warnings];
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
        diagram: state.diagram,
        error: state.error || "なし",
      },
      null,
      2
    );
  }

  function renderAll() {
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

initPlayground();
