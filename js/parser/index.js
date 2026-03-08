import { EXAM_LABELS } from "../diagram/index.js";

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
const PURPOSE_PATTERNS = [
  { purpose: "outdoor", patterns: [/外部/, /ベランダ/, /庭/, /外/] },
  { purpose: "washroom", patterns: [/洗面/, /洗濯機/, /浴室/] },
  { purpose: "kitchen_outlet", patterns: [/電子レンジ/, /レンジ/, /冷蔵庫/] },
  { purpose: "ac_outlet", patterns: [/エアコン用/, /エアコンコンセント/, /エアコン/, /\bac\b/i, /acコンセント/, /クーラー/] },
  { purpose: "fan", patterns: [/換気扇/, /換気/, /ファン/, /ベント/, /浴室換気/, /トイレ換気/] },
  { purpose: "light", patterns: [/照明/, /ライト/, /ランプ/, /シーリング/, /ダウンライト/, /蛍光灯/, /引掛シーリング/, /3路/, /三路/] },
  { purpose: "outlet", patterns: [/一般コンセント/, /ダブルコンセント/, /2口コンセント/, /二口コンセント/, /接地極付コンセント/, /コンセント/] },
];

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeProblemText(text) {
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
    .replace(/一箇所/g, "1箇所")
    .replace(/二箇所/g, "2箇所")
    .replace(/三箇所/g, "3箇所")
    .replace(/四箇所/g, "4箇所")
    .replace(/五箇所/g, "5箇所")
    .replace(/六箇所/g, "6箇所")
    .replace(/一台/g, "1台")
    .replace(/二台/g, "2台")
    .replace(/三台/g, "3台")
    .replace(/四台/g, "4台")
    .replace(/五台/g, "5台")
    .replace(/六台/g, "6台")
    .replace(/一口/g, "1口")
    .replace(/二口/g, "2口")
    .replace(/三口/g, "3口")
    .replace(/四口/g, "4口")
    .replace(/五口/g, "5口")
    .replace(/六口/g, "6口")
    .replace(/三路/g, "3路")
    .replace(/四路/g, "4路")
    .replace(/片切り/g, "片切")
    .replace(/引っ掛けシーリング/g, "引掛シーリング")
    .replace(/引っかけシーリング/g, "引掛シーリング")
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
export function parseProblemText(text) {
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

export function _inferConditionIdFromCounts(circuitType, lightCount, outletCount, sameTime) {
  if (circuitType === "threeway" && lightCount === 1 && outletCount === 0) return "threeway_1light";
  if (circuitType !== "single") return null;
  if (lightCount === 1 && outletCount === 0) return "single_1light";
  if (lightCount === 2 && outletCount === 0 && sameTime) return "single_2lights_same";
  if (lightCount === 1 && outletCount >= 1) return "single_1light_1outlet";
  return null;
}

/**
 * @param {{circuitType:"single"|"threeway"|null,mode?:string,lightCount:number|null,outletCount:number,sameTime:boolean,controlCount?:number}} input
 */
export function buildDeviceListFromUi(input) {
  if (!input.circuitType) return null;
  const lightCount = Number(input.lightCount || 0);
  const outletCount = Number(input.outletCount || 0);
  if (lightCount <= 0 && outletCount <= 0) return null;
  const controlId = input.circuitType === "threeway" ? "イ" : "イ";
  const devices = [];
  if (lightCount > 0) devices.push({ type: "light", quantity: lightCount });
  if (outletCount > 0) devices.push({ type: "outlet", quantity: outletCount });

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
export function buildDiagramInputFromDevices(model) {
  const result = {
    devices: [],
    conditionId: null,
    warnings: [],
    errors: [],
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

  if (lightCount < 1 && outletCount < 1) result.errors.push("照明数またはコンセント数を1以上にしてください。");
  if (lightCount > 6) result.errors.push("照明数は6灯以下で入力してください。");
  if (outletCount > 6) result.errors.push("コンセント数は6個以下で入力してください。");
  if (result.errors.length) return result;

  // 3路 + 複数照明は入力として受ける。既存図は1灯のみ図示し、残りは補助情報扱いとする。
  if (model.circuitType === "threeway" && lightCount > 1) {
    result.warnings.push("3路2灯以上は、図では1灯として扱います。残りは補助情報で確認してください。");
  }
  if (model.circuitType === "single" && lightCount === 0 && outletCount > 0) {
    result.warnings.push("照明なしのコンセントのみでも、簡略図を生成できます。");
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
  if (model.circuitType === "threeway" && lightCount > 1) {
    renderLightCount = 1;
  }
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

export function createEmptyGroup(controlId) {
  return {
    controlId,
    label: "",
    purpose: "unknown",
    switchType: "single",
    sameTime: false,
    devices: [
      { type: "light", quantity: 1 },
      { type: "outlet", quantity: 0 },
    ],
  };
}

export function getNextControlId(groups) {
  const used = new Set((groups || []).map((g) => g.controlId));
  for (let i = 0; i < EXAM_LABELS.length; i += 1) {
    if (!used.has(EXAM_LABELS[i])) return EXAM_LABELS[i];
  }
  return `#${(groups || []).length + 1}`;
}

export function createDefaultSceneModel() {
  const first = createEmptyGroup(getNextControlId([]));
  return {
    mode: "exam",
    groups: [first],
    activeGroupIndex: 0,
  };
}

export function _getGroupQuantity(group, type) {
  const hit = (group.devices || []).find((d) => d.type === type);
  return Number(hit?.quantity || 0);
}

export function _setGroupQuantity(group, type, quantity) {
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

export function buildDiagramInputFromGroup(group) {
  const result = {
    devices: [],
    conditionId: null,
    warnings: [],
    errors: [],
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
  if (circuitType === "threeway" && lightCount >= 2) {
    result.warnings.push("3路2灯以上は、図では1灯として扱います。残りは補助情報で確認してください。");
  }
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

function detectDeviceType(line) {
  if (/(照明|ライト|ランプ|シーリング|ダウンライト|蛍光灯|引掛シーリング)/.test(line)) return "light";
  if (/(エアコン用|エアコンコンセント|エアコン|acコンセント|\bac\b|クーラー)/.test(line)) return "outlet";
  if (/(換気扇|換気|ファン|ベント|浴室換気|トイレ換気)/.test(line)) return "outlet";
  if (/(一般コンセント|ダブルコンセント|2口コンセント|二口コンセント|接地極付コンセント|コンセント)/.test(line)) return "outlet";
  return null;
}

function detectSwitchType(line) {
  if (/(4路|四路|4路スイッチ|四路スイッチ)/.test(line)) return "threeway";
  if (/(3路|三路|3路スイッチ)/.test(line)) return "threeway";
  if (/片切/.test(line)) return "single";
  return "single";
}

function detectPurpose(line) {
  const hit = PURPOSE_PATTERNS.find((item) => _matchesAny(item.patterns, line));
  if (hit) return hit.purpose;
  return "unknown";
}

function purposeToDeviceType(purpose, switchType) {
  if (purpose === "light") return "light";
  if (switchType === "threeway") return "light";
  if (["outlet", "ac_outlet", "kitchen_outlet", "washroom", "outdoor", "fan"].includes(purpose)) return "outlet";
  return null;
}

function detectAssistFeatures(line) {
  const features = [];
  if (/(パイロットランプ)/.test(line)) features.push("パイロットランプ");
  if (/(ほたる|ホタル)/.test(line)) features.push("ほたる");
  if (/(タイマ|タイマー|timer)/.test(line)) features.push("タイマー");
  if (/(遅れスイッチ|遅延スイッチ)/.test(line)) features.push("遅れスイッチ");
  if (/(人感|センサー|sensor)/.test(line)) features.push("センサー");
  return features;
}

function extractPositionHints(line) {
  const hints = [];
  const addIfMatch = (pattern, label) => {
    if (pattern.test(line) && !hints.includes(label)) hints.push(label);
  };
  addIfMatch(/玄関側/, "玄関側");
  addIfMatch(/ldk側/, "LDK側");
  addIfMatch(/入口横/, "入口横");
  addIfMatch(/廊下側/, "廊下側");
  addIfMatch(/トイレ側/, "トイレ側");
  addIfMatch(/室内側/, "室内側");
  addIfMatch(/屋外側/, "屋外側");
  addIfMatch(/右/, "右");
  addIfMatch(/左/, "左");
  addIfMatch(/上/, "上");
  addIfMatch(/下/, "下");
  return hints;
}

function extractNumericOnlyQuantityFromLine(line) {
  const normalized = String(line || "").trim();
  const allNumbers = normalized.match(/[0-9]+/g);
  if (!allNumbers || allNumbers.length === 0) return null;
  return Number(allNumbers[0]);
}

function detectQuantity(line) {
  const numMatch = line.match(/([1-6])\s*(灯|個|箇所|台|口)/);
  if (numMatch) return Number(numMatch[1]);

  const jpMap = [
    { re: /一(灯|個|箇所|台|口)/, value: 1 },
    { re: /二(灯|個|箇所|台|口)/, value: 2 },
    { re: /三(灯|個|箇所|台|口)/, value: 3 },
    { re: /四(灯|個|箇所|台|口)/, value: 4 },
    { re: /五(灯|個|箇所|台|口)/, value: 5 },
    { re: /六(灯|個|箇所|台|口)/, value: 6 },
  ];
  const hit = jpMap.find((item) => item.re.test(line));
  if (hit) return hit.value;

  const switchCount = line.match(/(?:片切|3路|4路)(?:スイッチ)?\s*([1-6])/);
  if (switchCount) return Number(switchCount[1]);

  const over = line.match(/([0-9]+)\s*(灯|個|箇所|台|口)/);
  if (over) return Number(over[1]);

  const numericOnly = extractNumericOnlyQuantityFromLine(line);
  if (numericOnly !== null) return numericOnly;

  return 1;
}

function extractGroupLabel(line) {
  return String(line || "")
    .replace(/\s+/g, "")
    .replace(
      /(照明|ライト|ランプ|シーリング|ダウンライト|蛍光灯|引掛シーリング|一般コンセント|ダブルコンセント|2口コンセント|二口コンセント|接地極付コンセント|コンセント|エアコン用|エアコンコンセント|エアコン|AC|ac|クーラー|換気扇|換気|ファン|ベント|浴室換気|トイレ換気|電子レンジ|レンジ|冷蔵庫|洗面|洗濯機|外部|外|庭|ベランダ|玄関側|LDK側|ldk側|入口横|廊下側|トイレ側|室内側|屋外側|右|左|上|下|片切|スイッチ|パイロットランプ|ほたる|ホタル|タイマ|タイマー|遅れスイッチ|遅延スイッチ|人感|センサー)/g,
      ""
    )
    .replace(/(3路|三路|4路|四路)/g, "")
    .replace(/([1-9][0-9]*)(灯|個|箇所|台|口)/g, "")
    .replace(/([一二三四五六七八九十]+)(灯|個|箇所|台|口)/g, "")
    .trim();
}

function normalizeGroupLabel(label) {
  return String(label || "").replace(/\s+/g, "").trim();
}

function canMergeGroups(a, b) {
  const aLabel = normalizeGroupLabel(a?.label);
  const bLabel = normalizeGroupLabel(b?.label);
  if (!aLabel || !bLabel) return { ok: false, reason: "empty_label" };
  if (aLabel !== bLabel) return { ok: false, reason: "label_mismatch" };
  if ((a?.purpose || "unknown") !== (b?.purpose || "unknown")) return { ok: false, reason: "purpose_mismatch" };
  if (a.switchType !== b.switchType) return { ok: false, reason: "switch_mismatch" };
  const mergedLight = _getGroupQuantity(a, "light") + _getGroupQuantity(b, "light");
  const mergedOutlet = _getGroupQuantity(a, "outlet") + _getGroupQuantity(b, "outlet");
  if (mergedLight > 6) return { ok: false, reason: "light_overflow" };
  if (mergedOutlet > 6) return { ok: false, reason: "outlet_overflow" };
  return { ok: true, reason: "" };
}

function mergeTwoGroups(a, b) {
  const merged = {
    ...a,
    label: a.label || b.label || "",
    purpose: a.purpose || b.purpose || "unknown",
    devices: [
      { type: "light", quantity: _getGroupQuantity(a, "light") + _getGroupQuantity(b, "light") },
      { type: "outlet", quantity: _getGroupQuantity(a, "outlet") + _getGroupQuantity(b, "outlet") },
    ],
  };
  merged.sameTime = !!a.sameTime || !!b.sameTime || _getGroupQuantity(merged, "light") >= 2;
  return merged;
}

function mergeGroupsByLabel(groups) {
  const result = {
    groups: [],
    warnings: [],
    errors: [],
  };
  (groups || []).forEach((group) => {
    const normalized = normalizeGroupLabel(group?.label);
    if (!normalized) {
      result.groups.push(group);
      return;
    }
    const sameLabelGroups = result.groups.filter((g) => normalizeGroupLabel(g.label) === normalized);
    const sameLabelSamePurposeAndSwitch = sameLabelGroups.find(
      (g) => (g.purpose || "unknown") === (group.purpose || "unknown") && g.switchType === group.switchType
    );
    if (!sameLabelSamePurposeAndSwitch) {
      if (sameLabelGroups.length) {
        result.warnings.push(`label="${normalized}" は purpose/switchType が異なるため統合しません。`);
      }
      result.groups.push(group);
      return;
    }
    const check = canMergeGroups(sameLabelSamePurposeAndSwitch, group);
    if (!check.ok) {
      if (check.reason === "light_overflow") {
        result.errors.push(`label="${normalized}" 統合後の照明数が6を超えます。`);
      } else if (check.reason === "outlet_overflow") {
        result.errors.push(`label="${normalized}" 統合後のコンセント数が6を超えます。`);
      } else {
        result.warnings.push(`label="${normalized}" は統合条件（purpose/switchType/上限）を満たさないため統合しません。`);
      }
      result.groups.push(group);
      return;
    }
    const idx = result.groups.indexOf(sameLabelSamePurposeAndSwitch);
    if (idx >= 0) {
      result.groups[idx] = mergeTwoGroups(sameLabelSamePurposeAndSwitch, group);
      result.warnings.push(`label="${normalized}" を統合しました。`);
    } else {
      result.groups.push(group);
    }
  });
  result.groups.forEach((group, index) => {
    group.controlId = EXAM_LABELS[index] || `#${index + 1}`;
  });
  return result;
}

function parseFieldLine(line) {
  const normalizedLine = normalizeProblemText(line);
  const switchType = detectSwitchType(normalizedLine);
  const purpose = detectPurpose(normalizedLine);
  const detectedDeviceType = detectDeviceType(normalizedLine) || purposeToDeviceType(purpose, switchType);
  const assistFeatures = detectAssistFeatures(normalizedLine);
  const positionHints = extractPositionHints(normalizedLine);
  const parsed = {
    rawLine: line,
    normalizedLine,
    deviceType: detectedDeviceType || (switchType === "threeway" ? "light" : null),
    purpose,
    switchType,
    quantity: detectQuantity(normalizedLine),
    label: normalizeGroupLabel(extractGroupLabel(line)),
    assistFeatures,
    positionHints,
    warnings: [],
    errors: [],
  };

  if (!parsed.deviceType) parsed.errors.push("器具種別を判定できません。");
  if (parsed.quantity === 0) parsed.errors.push("数量は1以上で入力してください。");
  if (parsed.quantity > 6) parsed.errors.push("数量は6以下で入力してください。");
  if (/(4路|四路)/.test(normalizedLine)) {
    parsed.warnings.push("4路を検出しました。現行では3路系ヒントとして扱います。");
  }
  if (assistFeatures.length) {
    parsed.warnings.push(`補助器具語を検出: ${assistFeatures.join(" / ")}`);
  }
  if (positionHints.length) {
    parsed.warnings.push(`位置ヒントを検出: ${positionHints.join(" / ")}`);
  }
  if (
    !/(照明|ライト|ランプ|シーリング|ダウンライト|蛍光灯|引掛シーリング|コンセント|一般コンセント|ダブルコンセント|2口コンセント|二口コンセント|接地極付コンセント|エアコン|ac|クーラー|換気扇|換気|ファン|ベント|浴室換気|トイレ換気|片切|3路|三路|4路|四路|[1-6](灯|個|箇所|台|口)|一(灯|個|箇所|台|口)|二(灯|個|箇所|台|口)|三(灯|個|箇所|台|口)|四(灯|個|箇所|台|口)|五(灯|個|箇所|台|口)|六(灯|個|箇所|台|口)|玄関側|ldk側|入口横|廊下側|トイレ側|室内側|屋外側|右|左|上|下|パイロットランプ|ほたる|タイマ|タイマー|人感|センサー)/.test(normalizedLine)
  ) {
    parsed.warnings.push("未知語句を含みます。");
  }
  return parsed;
}

function createGroupFromLine(parsed) {
  if (!parsed || parsed.errors.length) return null;
  const controlId = "";
  const group = createEmptyGroup(controlId);
  group.label = parsed.label || "";
  group.purpose = parsed.purpose || "unknown";
  group.switchType = parsed.switchType;
  group.sameTime = parsed.deviceType === "light" && parsed.quantity >= 2;
  _setGroupQuantity(group, "light", parsed.deviceType === "light" ? parsed.quantity : 0);
  _setGroupQuantity(group, "outlet", parsed.deviceType === "outlet" ? parsed.quantity : 0);
  if (Array.isArray(parsed.assistFeatures) && parsed.assistFeatures.length) {
    group.assistFeatures = [...parsed.assistFeatures];
  }
  if (Array.isArray(parsed.positionHints) && parsed.positionHints.length) {
    group.positionHints = [...parsed.positionHints];
  }
  if (Array.isArray(parsed.warnings) && parsed.warnings.length) {
    group.warnings = [...parsed.warnings];
  }
  return group;
}

const STRUCTURED_ROOM_RULES = [
  { id: "玄関", patterns: [/玄関/] },
  { id: "廊下", patterns: [/廊下/] },
  { id: "LDK", patterns: [/\bldk\b/, /リビング/, /居間/] },
  { id: "トイレ", patterns: [/トイレ/] },
  { id: "洗面", patterns: [/洗面/, /洗面所/] },
  { id: "キッチン", patterns: [/キッチン/, /台所/] },
  { id: "洋室", patterns: [/洋室/] },
];

function extractStructuredRoom(line) {
  const hit = STRUCTURED_ROOM_RULES.find((item) => _matchesAny(item.patterns, line));
  return hit ? hit.id : "";
}

function extractStructuredSwitchType(line) {
  if (/(4路|四路)/.test(line)) return "fourway";
  if (/(3路|三路)/.test(line)) return "threeway";
  if (/片切/.test(line)) return "single";
  return "";
}

function detectStructuredLight(line) {
  return /(照明|ライト|ダウンライト|シーリング)/.test(line);
}

function detectStructuredOutlet(line) {
  if (/エアコンコンセント/.test(line)) return "ac_outlet";
  if (/コンセント/.test(line)) return "outlet";
  return "";
}

/**
 * @param {string} text
 */
export function parseStructuredDeviceText(text) {
  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const result = {
    devices: [],
    switches: [],
    lights: [],
    outlets: [],
    circuits: [],
    controlGroups: [],
    warnings: [],
  };
  if (!lines.length) return result;

  const groupMap = new Map();
  let activeRoom = "";

  const ensureGroup = (room) => {
    const key = room || "未指定";
    const existing = groupMap.get(key);
    if (existing) return existing;
    const group = {
      id: key,
      room: key,
      switchType: "",
      lights: [],
      outlets: [],
      devices: [],
    };
    groupMap.set(key, group);
    return group;
  };

  lines.forEach((rawLine, idx) => {
    const normalized = normalizeProblemText(rawLine);
    const room = extractStructuredRoom(normalized);
    if (room) activeRoom = room;
    const group = ensureGroup(room || activeRoom);

    const switchType = extractStructuredSwitchType(normalized);
    if (switchType) {
      group.switchType = switchType;
      result.switches.push({
        id: `sw-${result.switches.length + 1}`,
        type: switchType,
        room: group.room,
        line: idx + 1,
      });
    }

    if (detectStructuredLight(normalized)) {
      const quantity = Math.max(1, detectQuantity(normalized));
      const light = {
        id: `light-${result.lights.length + 1}`,
        room: group.room,
        quantity,
        line: idx + 1,
      };
      group.lights.push(light);
      group.devices.push({ kind: "light", ...light });
      result.lights.push(light);
    }

    const outletType = detectStructuredOutlet(normalized);
    if (outletType) {
      const quantity = Math.max(1, detectQuantity(normalized));
      const outlet = {
        id: `outlet-${result.outlets.length + 1}`,
        room: group.room,
        outletType,
        quantity,
        line: idx + 1,
      };
      group.outlets.push(outlet);
      group.devices.push({ kind: "outlet", ...outlet });
      result.outlets.push(outlet);
    }
  });

  result.controlGroups = Array.from(groupMap.values()).filter((group) => group.lights.length || group.outlets.length);
  result.devices = [...result.lights.map((item) => ({ kind: "light", ...item })), ...result.outlets.map((item) => ({ kind: "outlet", ...item }))];
  result.circuits = result.controlGroups.map((group, index) => ({
    id: index + 1,
    room: group.room,
    switchType: group.switchType || "single",
    lights: group.lights.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    outlets: group.outlets.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  }));
  return result;
}

function createGroupsFromStructuredParse(structured) {
  const groups = [];
  const warnings = [];
  (structured?.controlGroups || []).forEach((item) => {
    const lightCount = item.lights.reduce((sum, light) => sum + Number(light.quantity || 0), 0);
    const outletCount = item.outlets.reduce((sum, outlet) => sum + Number(outlet.quantity || 0), 0);
    if (lightCount <= 0 && outletCount <= 0) return;
    const group = createEmptyGroup("");
    group.label = item.room || "";
    group.purpose = lightCount > 0 ? "light" : item.outlets.some((outlet) => outlet.outletType === "ac_outlet") ? "ac_outlet" : "outlet";
    const parsedSwitchType = item.switchType || "single";
    if (parsedSwitchType === "fourway") {
      warnings.push(`${group.label || "未指定"}: 4路は未対応のため3路として扱います。`);
    }
    group.switchType = parsedSwitchType === "threeway" || parsedSwitchType === "fourway" ? "threeway" : "single";
    group.sameTime = lightCount >= 2;
    _setGroupQuantity(group, "light", Math.min(lightCount, 6));
    _setGroupQuantity(group, "outlet", Math.min(outletCount, 6));
    group.controlId = getNextControlId(groups);
    groups.push(group);
  });
  return { groups, warnings };
}

export function parseFieldSceneText(text) {
  const result = {
    groups: [],
    warnings: [],
    errors: [],
    lineResults: [],
    sceneModel: {},
  };
  const structured = parseStructuredDeviceText(text);
  const structuredBuilt = createGroupsFromStructuredParse(structured);
  if (structuredBuilt.groups.length) {
    result.sceneModel.structured = structured;
    result.groups = structuredBuilt.groups;
    result.warnings.push(...structuredBuilt.warnings);
    if (result.groups.length > 6) {
      result.errors.push("系統数は6件までです。");
      result.groups = result.groups.slice(0, 6);
    }
    return result;
  }

  const lines = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line, idx) => {
    const parsed = parseFieldLine(line);
    result.lineResults.push(parsed);
    if (parsed.warnings.length) result.warnings.push(...parsed.warnings.map((m) => `${idx + 1}行目: ${m}`));
    if (parsed.errors.length) {
      result.errors.push(...parsed.errors.map((m) => `${idx + 1}行目: ${m}`));
      return;
    }
    const group = createGroupFromLine(parsed);
    if (!group) {
      result.errors.push(`${idx + 1}行目: group 生成に失敗しました。`);
      return;
    }
    group.controlId = getNextControlId(result.groups);
    result.groups.push(group);
  });

  const merged = mergeGroupsByLabel(result.groups);
  result.groups = merged.groups;
  result.warnings.push(...merged.warnings);
  result.errors.push(...merged.errors);

  if (!result.groups.length) result.errors.push("有効な系統を生成できませんでした。");
  if (result.groups.length > 6) {
    result.errors.push("系統数は6件までです。");
    result.groups = result.groups.slice(0, 6);
  }
  return result;
}

/**
 * @param {ReturnType<typeof parseProblemText>} parsed
 */
export function toDiagramFormState(parsed) {
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
export function applyParsedResult(parsed) {
  const result = {
    circuitType: null,
    conditionId: null,
    devices: [],
    warnings: [],
    errors: [],
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
