// 目的:
// このツールは、初心者電気工事士が現場で頭が真っ白になった時に、
// 判断の順番を整理し、安全に施工方針を考えるための補助ツールである。
const form = document.getElementById("planner-form");
const resultCard = document.getElementById("result-card");
const judgementEl = document.getElementById("judgement");
const firstActionsEl = document.getElementById("first-actions");
const judgementReasonEl = document.getElementById("judgement-reason");

const overviewEl = document.getElementById("overview");
const simpleDiagramEl = document.getElementById("simple-diagram");
const imageEl = document.getElementById("image");
const routeEl = document.getElementById("route");
const routeTradeNoteEl = document.getElementById("route-trade-note");
const buildingInterferenceEl = document.getElementById("building-interference");
const wiringCautionsEl = document.getElementById("wiring-cautions");
const materialsEl = document.getElementById("materials");
const toolsEl = document.getElementById("tools");
const stepsEl = document.getElementById("steps");
const riskPointsEl = document.getElementById("risk-points");
const fieldMistakesEl = document.getElementById("field-mistakes");
const cautionsEl = document.getElementById("cautions");
const photoPointsEl = document.getElementById("photo-points");
const extraChecksEl = document.getElementById("extra-checks");
const sampleButtons = document.querySelectorAll(".sample-btn");

const forbiddenBranchTypes = ["専用回路（エアコン）", "専用回路（電子レンジ）", "専用回路（IH）"];
const checkItems = [
  "分電盤に空きブレーカーがあるか",
  "既設コンセントが専用回路ではないか",
  "既設回路の負荷状況",
  "接地が必要な機器か",
  "無電圧確認を行ったか",
];
const strongLoadKeywords = ["電子レンジ", "オーブン", "IH"];
const groundPriorityKeywords = ["洗濯機", "ウォシュレット"];

const sampleData = {
  // 迷いやすい点: 小負荷でも「照明回路」へ誤って分岐しがち。回路種別確認が要点。
  light: {
    site: "2階 子供部屋 西側壁",
    outletCount: "1",
    devices: "デスクライト、スマホ充電器、ノートPC",
    powerSource: "既設回路から分岐",
    breakerSpace: "なし",
    building: "木造住宅",
    existingCircuit: "一般回路",
    grounding: "不要",
    exposed: "不可（隠ぺい優先）",
    memo: "天井裏点検口あり",
    prechecks: ["既設コンセントが専用回路ではないか", "既設回路の負荷状況", "無電圧確認を行ったか"],
  },
  // 迷いやすい点: 洗濯機は接地と水回り器具選定を忘れやすい。
  washer: {
    site: "1階 洗面脱衣室 洗濯機スペース",
    outletCount: "1",
    devices: "洗濯機",
    powerSource: "既設回路から分岐",
    breakerSpace: "なし",
    building: "木造住宅",
    existingCircuit: "一般回路",
    grounding: "必要",
    exposed: "不可（隠ぺい優先）",
    memo: "防水配慮が必要",
    prechecks: ["分電盤に空きブレーカーがあるか", "接地が必要な機器か", "無電圧確認を行ったか"],
  },
  // 迷いやすい点: キッチン高負荷機器を既設回路へ安易に分岐しがち。
  microwave: {
    site: "1階 キッチン 電子レンジ置場",
    outletCount: "1",
    devices: "電子レンジ、オーブンレンジ",
    powerSource: "現地確認で判断",
    breakerSpace: "あり",
    building: "木造住宅",
    existingCircuit: "一般回路",
    grounding: "必要",
    exposed: "可",
    memo: "キッチン周辺の既設回路が混雑",
    prechecks: ["分電盤に空きブレーカーがあるか", "既設回路の負荷状況", "接地が必要な機器か"],
  },
};

sampleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.sample;
    applySample(sampleData[key]);
    generatePlanFromForm(true);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generatePlanFromForm(false);
});

function generatePlanFromForm(fromSample) {
  const formData = new FormData(form);
  const input = {
    site: formData.get("site").trim(),
    outletCount: Number(formData.get("outletCount")),
    devices: formData.get("devices").trim(),
    powerSource: formData.get("powerSource"),
    breakerSpace: formData.get("breakerSpace"),
    building: formData.get("building").trim(),
    existingCircuit: formData.get("existingCircuit"),
    grounding: formData.get("grounding"),
    exposed: formData.get("exposed"),
    memo: formData.get("memo").trim(),
    prechecks: formData.getAll("precheck"),
  };

  const plan = createPlan(input);
  renderPlan(plan);
  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: fromSample ? "nearest" : "start" });
}

function createPlan(input) {
  const hasStrongLoadDevice = strongLoadKeywords.some((word) => input.devices.includes(word));
  const hasGroundPriorityDevice = groundPriorityKeywords.some((word) => input.devices.includes(word));

  const needsGround =
    input.grounding === "必要" ||
    hasGroundPriorityDevice ||
    input.site.includes("洗面") ||
    input.site.includes("脱衣") ||
    input.site.includes("キッチン");

  const branchForbidden = forbiddenBranchTypes.includes(input.existingCircuit);
  const hasSuspiciousCircuit = input.existingCircuit === "専用回路っぽい";
  const unknownBreaker = input.breakerSpace === "不明";
  const unknownCircuit = input.existingCircuit === "不明";
  const unknownGround = input.grounding === "不明";
  const hasUnknown = unknownBreaker || unknownCircuit || unknownGround;
  const unknownInfoCount = [unknownBreaker, unknownCircuit, unknownGround].filter(Boolean).length;
  const uncheckedItems = checkItems.filter((item) => !input.prechecks.includes(item));

  const judgement = decideJudgement({
    input,
    branchForbidden,
    hasStrongLoadDevice,
    hasSuspiciousCircuit,
    hasUnknown,
    unknownBreaker,
    unknownInfoCount,
  });

  const sourceText = decideRouteSource(input, { branchForbidden, hasStrongLoadDevice, hasSuspiciousCircuit, unknownBreaker });
  const firstActions = buildFirstActions({ input, unknownBreaker, hasSuspiciousCircuit });
  const judgementReasons = buildJudgementReasons({
    input,
    judgement,
    needsGround,
    hasStrongLoadDevice,
    hasGroundPriorityDevice,
    hasSuspiciousCircuit,
    hasUnknown,
    unknownBreaker,
    unknownInfoCount,
  });

  const overview = `${input.building}の「${input.site}」に、コンセントを${input.outletCount}口増設します。使う予定の機器は「${input.devices}」です。今回の判定は「${judgement}」です。`;
  const simpleDiagram = createSimpleDiagram({
    input,
    judgement,
    sourceText,
    needsGround,
    branchForbidden,
    hasUnknown,
  });
  const image = createCompletionImage({
    input,
    sourceText,
    needsGround,
    judgement,
  });
  const routeText = `どこから: 「${sourceText}」から取ります。どこを通るか: 天井裏を通して目的の壁の中へ下ろします。どこへ行くか: 「${input.site}」の新しいコンセントへ接続します。`;
  const routeTradeNote = buildRouteTradeNote({ input, unknownInfoCount });
  const buildingInterferenceChecks = buildBuildingInterferenceChecks({ input, needsGround });

  const materials = [
    "電線（VVF 2.0mm）",
    needsGround ? "アース線（緑色 2.0mm）" : "アース線は不要想定（最終は現場判断）",
    "壁の中を通す保護管（PF管）",
    "中継用ボックス",
    `コンセント本体 ${input.outletCount}個`,
    "取付枠、プレート、絶縁テープ",
    input.exposed === "可" ? "露出配線用モール（必要時）" : "露出配線材は基本使わない",
  ];
  const tools = buildRecommendedTools({ input, needsGround, hasStrongLoadDevice });
  const wiringCautions = buildWiringCautions({
    input,
    needsGround,
    hasSuspiciousCircuit,
    hasStrongLoadDevice,
  });
  const photoPoints = buildPhotoCheckPoints({ input, needsGround, unknownBreaker });

  const steps = [
    "【確認】分電盤で対象回路の電源を切り、無電圧を確認する。",
    "【確認】分岐元が専用回路ではないか、回路の負荷に余裕があるか確認する。",
    "【配線】新しいコンセント位置を決め、経路を印して天井裏へ配線する。",
    "【配線】目的の壁の中へ電線を下ろし、必要なら保護管とアース線を通す。",
    "【取付】コンセントを取り付け、電線を正しく接続してねじを締める。",
    "【チェック】通電前に再点検し、通電後に電圧と機器動作を確認する。",
  ];

  const cautions = [
    "専用回路から分岐しない（エアコン・電子レンジ・IHなど）。",
    "照明回路から安易に取らない（回路用途と負荷を確認する）。",
    "接地線の入れ忘れに注意する（水回り・接地が必要な機器は必須）。",
    "作業前に電源を遮断し、無電圧確認をしてから触る。",
    "水回りでは器具選定ミスに注意する（適切なコンセント種別を使う）。",
  ];

  const extraChecks = buildExtraChecks({
    input,
    needsGround,
    hasStrongLoadDevice,
    hasSuspiciousCircuit,
    hasUnknown,
    uncheckedItems,
  });
  const riskPoints = buildRiskPoints({
    unknownBreaker,
    hasSuspiciousCircuit,
    needsGround,
    hasStrongLoadDevice,
    input,
  });
  const fieldMistakes = buildCommonFieldMistakes({
    input,
    needsGround,
    branchForbidden,
    hasSuspiciousCircuit,
  });

  return {
    judgement,
    firstActions,
    judgementReasons,
    overview,
    simpleDiagram,
    routeText,
    routeTradeNote,
    buildingInterferenceChecks,
    wiringCautions,
    image,
    materials,
    tools,
    steps,
    riskPoints,
    fieldMistakes,
    cautions,
    photoPoints,
    extraChecks,
  };
}

function decideJudgement({ input, branchForbidden, hasStrongLoadDevice, hasSuspiciousCircuit, hasUnknown, unknownBreaker, unknownInfoCount }) {
  if (unknownBreaker || input.powerSource === "現地確認で判断" || unknownInfoCount >= 2) return "まず現場確認が必要";
  if (branchForbidden || hasStrongLoadDevice) return "新設回路推奨";
  if (hasSuspiciousCircuit) return "まず現場確認が必要";
  if (hasUnknown) return "まず現場確認が必要";
  return "既設回路からの分岐候補";
}

function decideRouteSource(input, status) {
  if (status.branchForbidden || status.hasStrongLoadDevice) return "分電盤（新しい回路）";
  if (status.unknownBreaker || status.hasSuspiciousCircuit) return "分電盤または既設コンセント回路（現場確認後に決定）";
  if (input.powerSource === "分電盤から新設") return "分電盤";
  if (input.powerSource === "既設回路から分岐") return "既設コンセント回路（一般回路）";
  if (input.breakerSpace === "あり") return "分電盤";
  if (input.breakerSpace === "なし") return "既設コンセント回路（一般回路）";
  return "分電盤または既設コンセント回路";
}

function buildJudgementReasons(status) {
  const lines = [];

  if (status.unknownBreaker) {
    lines.push("・分電盤の空きが不明のため、新設回路か分岐かを今は確定できません。");
  }
  if (status.unknownInfoCount >= 2) {
    lines.unshift("・不明情報が多いため、まず現場確認を優先してください。");
  }
  if (status.hasStrongLoadDevice) {
    lines.push("・電子レンジ、オーブン、IHは負荷が大きいため、新しい回路を優先します。");
  }
  if (status.hasGroundPriorityDevice || status.needsGround) {
    lines.push("・洗濯機やウォシュレット、水回りは感電防止のため接地ありで計画します。");
  }
  if (status.hasSuspiciousCircuit || status.input.existingCircuit === "不明") {
    lines.push("・既設回路が専用回路の可能性または不明なので、安全側で現場確認を優先します。");
  }
  if (lines.length === 0 && status.judgement === "既設回路からの分岐候補") {
    lines.push("・分電盤の空き条件と既設回路の情報から、一般回路の分岐候補として判断しています。");
    lines.push("・施工前に負荷状況と無電圧確認を行うと、安心して作業できます。");
  }

  return lines.slice(0, 3);
}

function buildFirstActions(status) {
  const lines = [];
  if (status.unknownBreaker) {
    lines.push("・まず分電盤の空きブレーカー有無を確認してください。");
  } else {
    lines.push("・まず分電盤の対象回路とブレーカー容量を確認してください。");
  }
  if (status.hasSuspiciousCircuit || status.input.existingCircuit === "不明") {
    lines.push("・次に既設コンセントが専用回路か不明回路でないか確認してください。");
  } else {
    lines.push("・次に既設コンセントが専用回路ではないか確認してください。");
  }
  lines.push("・不明点が残る場合は分岐せず、現場確認を優先してください。");
  return lines.slice(0, 3);
}

function buildRiskPoints(status) {
  const points = [];
  if (status.hasSuspiciousCircuit || status.input.existingCircuit === "不明") {
    points.push("専用回路からの分岐の可能性あり。分岐前に回路名と行き先を再確認する。");
  }
  if (status.needsGround) {
    points.push("水回りまたは接地対象機器のため、接地線の入れ忘れに注意する。");
  }
  if (status.unknownBreaker) {
    points.push("分電盤空き不明のため、新設回路の判断を先に確定しない。");
  }
  if (status.hasStrongLoadDevice) {
    points.push("高負荷機器のため、既設回路へ安易に分岐すると過負荷の恐れがある。");
  }
  if (status.input.prechecks && !status.input.prechecks.includes("無電圧確認を行ったか")) {
    points.push("無電圧確認が未チェック。感電リスクを避けるため最優先で確認する。");
  }
  return points.slice(0, 3);
}

function buildCommonFieldMistakes(status) {
  const mistakes = [];
  const hasWallWork = status.input.site.includes("壁") || status.input.memo.includes("壁") || status.input.memo.includes("貫通");
  const hasThreeWayHint = status.input.memo.includes("3路") || status.input.devices.includes("3路") || status.input.memo.includes("スイッチ");
  const noInspectionHatch = status.input.memo.includes("点検口なし");

  if (hasWallWork) {
    mistakes.push("・壁貫通時は外壁側へ抜けすぎないよう、深さ確認をして作業する。");
    mistakes.push("・本穴を開ける前に、下穴と位置確認を優先する。");
  }
  if (hasThreeWayHint) {
    mistakes.push("・3路配線では返り線の入れ忘れに注意する。");
    mistakes.push("・3路は渡り線だけでなく返り線も必要。");
  }
  if (status.needsGround) {
    mistakes.push("・接地が必要な場合は、接地線の通し忘れに注意する。");
  }
  if (noInspectionHatch || status.input.exposed === "不可（隠ぺい優先）") {
    mistakes.push("・点検口なしで無理な天井裏通線をしない。");
  }
  if (status.input.site.includes("壁中央") || status.input.memo.includes("壁中央") || hasWallWork) {
    mistakes.push("・壁中央付近は下地ビス干渉に注意する。");
  }
  if (status.branchForbidden || status.hasSuspiciousCircuit || status.input.existingCircuit === "不明") {
    mistakes.push("・専用回路から誤って分岐しない。");
  }

  if (mistakes.length < 2) {
    mistakes.push("・本穴前に下穴で位置確認し、狙いをずらさない。");
  }
  if (mistakes.length < 2) {
    mistakes.push("・接続前に配線の用途を口頭確認して、取り違えを防ぐ。");
  }

  return Array.from(new Set(mistakes)).slice(0, 4);
}

function buildWiringCautions(status) {
  const items = [];
  const hasThreeWayHint = status.input.memo.includes("3路") || status.input.devices.includes("3路") || status.input.memo.includes("スイッチ");

  // 優先1: 接地が必要な場合の入れ忘れ防止
  if (status.needsGround) {
    items.push("接地線の入れ忘れに注意し、接地端子まで確実につなぐこと。");
  }
  // 優先2: 3路配線の返り線ミス防止
  if (hasThreeWayHint) {
    items.push("3路配線は返り線を入れ忘れないこと。");
  }
  // 優先3: 回路取り違え防止
  if (status.hasSuspiciousCircuit || status.hasStrongLoadDevice || status.input.existingCircuit === "不明") {
    items.push("専用回路から誤って分岐しないよう、分岐前に回路を再確認すること。");
  }

  items.push("極性を崩さない（接続先を間違えない）こと。");
  items.push("既設回路のジョイント位置を無理に増やしすぎないこと。");

  return Array.from(new Set(items)).slice(0, 3);
}

function buildRouteTradeNote(status) {
  const noInspectionHatch = status.input.memo.includes("点検口なし");
  if (noInspectionHatch) {
    return "点検口なしのため、無理な隠ぺいは避けて露出案や点検口追加を優先検討してください。";
  }
  if (status.input.exposed === "不可（隠ぺい優先）") {
    return "隠ぺい優先でも、通線が厳しい場合は無理をせず施工方法を変更してください。";
  }
  if (status.unknownInfoCount >= 2) {
    return "不明情報が多いため、ルート確定前に現場写真と他業種情報を先に確認してください。";
  }
  if (status.input.site.includes("キッチン") || status.input.site.includes("洗面") || status.input.site.includes("脱衣")) {
    return "設備配管や内装下地と干渉しないか、配線前に位置を確認してください。";
  }
  return "開口追加が必要な場合は、補修範囲を先に確認してください。";
}

function buildBuildingInterferenceChecks(status) {
  const checks = [];
  const hasWallCenter = status.input.site.includes("壁中央") || status.input.memo.includes("壁中央");
  const noInspectionHatch = status.input.memo.includes("点検口なし");
  const hasBeamRisk = status.input.memo.includes("梁") || status.input.memo.includes("桁") || status.input.memo.includes("またぐ");
  const hasNoguchiCenter = status.input.memo.includes("野縁中央") || status.input.exposed === "不可（隠ぺい優先）";

  // 優先表示: 点検口なし / 壁中央 / 梁 / 野縁中央
  if (noInspectionHatch) checks.push("・点検口なしでは無理な天井裏通線を避け、施工方法を先に再検討する。");
  if (hasWallCenter) checks.push("・壁中央付近は下地ビス干渉の可能性が高いため、下地確認を優先する。");
  if (hasBeamRisk) checks.push("・梁まわり配線は貫通方法や回避経路を事前確認する。");
  if (hasNoguchiCenter) checks.push("・野縁中央の通線はビス干渉の可能性があるため避ける。");
  if (status.needsGround || status.input.site.includes("キッチン") || status.input.site.includes("洗面") || status.input.site.includes("脱衣")) {
    checks.push("・水回り付近は設備配管との干渉を確認してから通線する。");
  }

  if (checks.length < 2) checks.push("・壁内配線前に下地位置を確認し、ビス干渉を避ける。");
  if (checks.length < 2) checks.push("・隠ぺいが難しい場合は露出配線案を含めて再検討する。");

  return checks.slice(0, 4);
}

function buildPhotoCheckPoints(status) {
  const points = [];
  const noInspectionHatch = status.input.memo.includes("点検口なし");
  const hasWallCenter = status.input.site.includes("壁中央") || status.input.memo.includes("壁中央");
  const hasBeamRisk = status.input.memo.includes("梁") || status.input.memo.includes("桁") || status.input.memo.includes("またぐ");
  const hasNoguchiCenter = status.input.memo.includes("野縁中央") || status.input.exposed === "不可（隠ぺい優先）";

  // 配線ルートミス防止を優先した写真項目
  if (noInspectionHatch) points.push("点検口の有無と、点検口を追加できる位置の写真");
  if (hasWallCenter) points.push("増設予定壁面の下地位置が分かる写真（壁中央付近）");
  if (hasBeamRisk) points.push("梁まわりの通線候補位置が分かる写真");
  if (hasNoguchiCenter) points.push("野縁中央付近のビス・下地位置が分かる写真");

  points.push("増設予定位置の壁面と周辺障害物");
  points.push("既設コンセントまわり（プレートを外した内部含む）");
  points.push("分電盤の空きブレーカー状態");
  if (status.needsGround) {
    points.push("増設位置と水回りの距離が分かる写真");
  }
  if (status.unknownBreaker) {
    points.push("分電盤ラベル（回路名）が読める写真");
  }
  return Array.from(new Set(points)).slice(0, 7);
}

function buildRecommendedTools(status) {
  const tools = ["検電器", "テスター", "通線ワイヤー", "下地探し", "レベル"];
  if (status.input.site.includes("壁") || status.input.exposed === "不可（隠ぺい優先）") {
    tools.push("ホールソー");
  }
  if (status.hasStrongLoadDevice) {
    tools.push("クランプメーター（負荷確認用）");
  }
  if (status.needsGround) {
    tools.push("導通確認リード（接地確認用）");
  }
  return Array.from(new Set(tools));
}

function buildExtraChecks(status) {
  const items = [
    "分電盤に空きブレーカーがあるか",
    "既設コンセントが専用回路ではないか",
    "既設回路の負荷状況",
    "壁内配線が可能か",
  ];

  if (status.needsGround) {
    items.push("接地線を安全に引ける経路があるか");
  }
  if (status.hasStrongLoadDevice) {
    items.push("新設回路を取るためのブレーカー容量に余裕があるか");
  }
  if (status.hasSuspiciousCircuit || status.hasUnknown) {
    items.push("既設回路の行き先と回路名が分電盤表示と一致しているか");
  }
  if (status.uncheckedItems.length > 0) {
    items.push(`今回未チェックの項目: ${status.uncheckedItems.join("、")}`);
  }

  return Array.from(new Set(items));
}

function createSimpleDiagram(status) {
  const isUnknown = status.judgement === "まず現場確認が必要" || status.hasUnknown;
  const isBranch = status.sourceText.includes("既設コンセント");
  const sourceLabel = isUnknown
    ? "電源: 分電盤 / 既設コンセント(要確認)"
    : isBranch
    ? "電源: 既設コンセント"
    : "電源: 分電盤";
  const circuitLabel = isUnknown ? "回路: 要確認" : isBranch ? "回路: 既設回路から分岐" : "回路: 新設回路";
  const groundLabel = status.needsGround ? "接地: あり" : "接地: なし";

  return buildFlowDiagram({
    title: "簡易施工図",
    sourceLabel,
    routeLabel: "配線: VVF 2.0-2C",
    circuitLabel,
    groundLabel,
    destinationLabel: `器具: 新設コンセント x${status.input.outletCount}`,
    note: isUnknown ? "※ 現場確認後に配線ルートと回路方式を確定" : "",
  });
}

function createCompletionImage(status) {
  const isUnknown = status.judgement === "まず現場確認が必要";
  const isBranch = status.sourceText.includes("既設コンセント");
  const sourceLabel = isUnknown
    ? "電源: 分電盤 / 既設コンセント(要確認)"
    : isBranch
    ? "電源: 既設コンセント"
    : "電源: 分電盤";
  const circuitLabel = isUnknown ? "回路: 要確認" : isBranch ? "回路: 分岐完了" : "回路: 新設完了";
  const groundLabel = status.needsGround ? "接地: 接続済み" : "接地: なし";

  return buildFlowDiagram({
    title: "完成イメージ図",
    sourceLabel,
    routeLabel: "配線: 天井裏 -> 壁内 -> 器具",
    circuitLabel,
    groundLabel,
    destinationLabel: `器具: 新設コンセント x${status.input.outletCount}`,
    note: "※ 完成後の電源の流れと器具関係を表示",
  });
}

function buildFlowDiagram(status) {
  const lines = [];
  lines.push(`[${status.title}]`);
  lines.push("");
  lines.push(...toBox([status.sourceLabel]));
  lines.push("            |");
  lines.push(`            | ${status.routeLabel}`);
  lines.push(`            | ${status.circuitLabel}`);
  lines.push(`            | ${status.groundLabel}`);
  lines.push("            v");
  lines.push(...toBox([status.destinationLabel]));
  if (status.note) {
    lines.push("");
    lines.push(status.note);
  }
  return lines.join("\n");
}

function toBox(lines) {
  const width = 44;
  const top = "+" + "-".repeat(width - 2) + "+";
  const body = lines.map((line) => {
    const text = line.length > width - 4 ? line.slice(0, width - 7) + "..." : line;
    return "| " + text.padEnd(width - 4, " ") + " |";
  });
  return [top, ...body, top];
}

function renderPlan(plan) {
  renderJudgement(plan.judgement);
  firstActionsEl.textContent = plan.firstActions.join("\n");
  judgementReasonEl.textContent = plan.judgementReasons.join("\n");
  overviewEl.textContent = plan.overview;
  simpleDiagramEl.textContent = plan.simpleDiagram;
  routeEl.textContent = plan.routeText;
  routeTradeNoteEl.hidden = !plan.routeTradeNote;
  routeTradeNoteEl.textContent = plan.routeTradeNote ? `他業種トラブル注意: ${plan.routeTradeNote}` : "";
  fillList(buildingInterferenceEl, plan.buildingInterferenceChecks);
  fillList(wiringCautionsEl, plan.wiringCautions);
  imageEl.textContent = plan.image;

  fillList(materialsEl, plan.materials);
  fillList(toolsEl, plan.tools);
  fillList(stepsEl, plan.steps);
  fillList(riskPointsEl, plan.riskPoints);
  fillList(fieldMistakesEl, plan.fieldMistakes);
  fillList(cautionsEl, plan.cautions);
  fillList(photoPointsEl, plan.photoPoints);
  fillList(extraChecksEl, plan.extraChecks);
}

function renderJudgement(judgement) {
  judgementEl.textContent = judgement;
  judgementEl.className = "judgement";
  if (judgement === "新設回路推奨") judgementEl.classList.add("judgement-new");
  else if (judgement === "まず現場確認が必要") judgementEl.classList.add("judgement-check");
  else judgementEl.classList.add("judgement-branch");
}

function fillList(target, items) {
  target.innerHTML = "";
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    target.appendChild(li);
  });
}

function applySample(sample) {
  if (!sample) return;
  form.site.value = sample.site;
  form.outletCount.value = sample.outletCount;
  form.devices.value = sample.devices;
  form.powerSource.value = sample.powerSource;
  form.breakerSpace.value = sample.breakerSpace;
  form.building.value = sample.building;
  form.existingCircuit.value = sample.existingCircuit;
  form.grounding.value = sample.grounding;
  form.exposed.value = sample.exposed;
  form.memo.value = sample.memo;

  const checkboxes = form.querySelectorAll('input[name="precheck"]');
  checkboxes.forEach((checkbox) => {
    checkbox.checked = sample.prechecks.includes(checkbox.value);
  });
}
