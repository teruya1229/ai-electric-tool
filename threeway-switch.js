const form = document.getElementById("threeway-form");
const resultCard = document.getElementById("result-card");

const judgementEl = document.getElementById("judgement");
const firstActionsEl = document.getElementById("first-actions");
const flowEl = document.getElementById("flow");
const wiresEl = document.getElementById("wires");
const diagramEl = document.getElementById("diagram");
const routeEl = document.getElementById("route");
const wiringCautionsEl = document.getElementById("wiring-cautions");
const stepsEl = document.getElementById("steps");
const mistakesEl = document.getElementById("mistakes");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const input = {
    powerPosition: formData.get("powerPosition"),
    lightCount: Number(formData.get("lightCount")),
    switchCount: Number(formData.get("switchCount")),
    building: formData.get("building").trim(),
    wiringMethod: formData.get("wiringMethod"),
    memo: formData.get("memo").trim(),
  };

  const plan = createPlan(input);
  renderPlan(plan);
  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

function createPlan(input) {
  const isBasicCase = input.lightCount === 1 && input.switchCount === 2;
  const hasThreeWayHint = input.memo.includes("3路");
  const hasNoInspection = input.memo.includes("点検口なし");

  let judgement = "";
  if (input.powerPosition === "不明") {
    judgement = "まず現場確認が必要";
  } else if (!isBasicCase) {
    judgement = "基本ケース外（条件整理が必要）";
  } else if (input.powerPosition === "照明側") {
    judgement = "照明側電源の3路として施工可能";
  } else {
    judgement = "スイッチ側電源の3路として施工可能";
  }

  const firstActions = [
    "1) まず、電源が照明側かスイッチ側かを確認する。",
    "2) 次に、3路は渡り線2本＋返り線が必要なことを先に整理する。",
    "3) 最後に、通線ルートと必要本数を紙に書いてから作業する。",
  ];

  const flow = buildFlowText(input.powerPosition);
  const wires = buildWireImage(input.powerPosition);
  const diagram = buildDiagram(input.powerPosition);
  const route = buildRoute(input);

  const wiringCautions = [
    "返り線の入れ忘れを最優先で防ぐ（3路で一番多いミス）。",
    "渡り線2本と返り線を混同しない（色分け・マーキング推奨）。",
    "本結線前に、どの線がどこへ戻るかを口頭で再確認する。",
  ];

  const steps = [
    "電源位置を確認し、3路回路の必要本数を先に決める。",
    "スイッチ間の渡り線2本と返り線ルートを確保する。",
    "器具・スイッチの端子に配線し、返り線が照明へ戻ることを確認する。",
    "通電前に導通確認し、通電後に2か所操作で点灯/消灯を確認する。",
  ];

  const mistakes = [
    "返り線を入れずに渡り線だけで配線してしまう。",
    "電源位置の想定違いで必要本数が足りなくなる。",
    hasNoInspection
      ? "点検口なしで無理に通線して配線を傷つける。"
      : "下書きなしで通線してルートが破綻する。",
  ];

  if (hasThreeWayHint) {
    mistakes.unshift("3路端子の取り違えで、片側しか操作できなくなる。");
  }

  return {
    judgement,
    firstActions,
    flow,
    wires,
    diagram,
    route,
    wiringCautions,
    steps,
    mistakes: mistakes.slice(0, 4),
  };
}

function buildFlowText(powerPosition) {
  if (powerPosition === "照明側") {
    return "電源は照明側から入る。\n照明側からスイッチへ渡り線を送り、もう一方のスイッチから返り線で照明へ戻す。";
  }
  if (powerPosition === "スイッチ側") {
    return "電源はスイッチ側から入る。\nスイッチ間を渡り線でつなぎ、最終的に返り線で照明へ送る。";
  }
  return "電源位置が不明。\n先に電源位置を確認しないと必要本数と結線位置を確定できない。";
}

function buildWireImage(powerPosition) {
  const common = ["スイッチ間: 渡り線 2本", "照明へ戻る: 返り線 1本", "接地線（必要時）"];
  if (powerPosition === "照明側") {
    return ["照明側で常時電源を受ける", "照明側〜スイッチ系: 常時線 1本", ...common];
  }
  if (powerPosition === "スイッチ側") {
    return ["スイッチ側で常時電源を受ける", "スイッチ側〜照明側: 返り線を確保", ...common];
  }
  return ["電源位置が不明なため、必要本数は現場確認後に確定", ...common];
}

function buildDiagram(powerPosition) {
  if (powerPosition === "照明側") {
    return [
      "[電源] -> [照明ボックス]",
      "             |",
      "             +--(渡り線2本)--[3路SW1]---[3路SW2]",
      "                                |",
      "                             (返り線)",
      "                                |",
      "                           [照明へ戻る]",
    ].join("\n");
  }
  if (powerPosition === "スイッチ側") {
    return [
      "[電源] -> [3路SW1]---(渡り線2本)---[3路SW2]",
      "                              |",
      "                           (返り線)",
      "                              |",
      "                            [照明]",
    ].join("\n");
  }
  return [
    "[電源位置 不明]",
    "  ├─ 照明側パターンの可能性",
    "  └─ スイッチ側パターンの可能性",
    "",
    "※ 現場確認後に結線図を確定",
  ].join("\n");
}

function buildRoute(input) {
  if (input.powerPosition === "照明側") {
    return "照明ボックスからスイッチ1へ下ろし、スイッチ間を接続し、返り線で照明へ戻すルート。";
  }
  if (input.powerPosition === "スイッチ側") {
    return "スイッチ1からスイッチ2へ渡り線を通し、スイッチ2から照明へ返り線を送るルート。";
  }
  return "電源位置が不明のため、照明側・スイッチ側の両ルート候補を現場で確認して決定。";
}

function renderPlan(plan) {
  judgementEl.textContent = plan.judgement;
  firstActionsEl.textContent = plan.firstActions.join("\n");
  flowEl.textContent = plan.flow;
  diagramEl.textContent = plan.diagram;
  routeEl.textContent = plan.route;

  fillList(wiresEl, plan.wires);
  fillList(wiringCautionsEl, plan.wiringCautions);
  fillList(stepsEl, plan.steps);
  fillList(mistakesEl, plan.mistakes);
}

function fillList(target, items) {
  target.innerHTML = "";
  items.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    target.appendChild(li);
  });
}
