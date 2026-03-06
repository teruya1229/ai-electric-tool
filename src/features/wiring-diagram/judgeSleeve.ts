import type { SleeveJudgeInput, SleeveJudgeResult } from "./types";

function ok(
  sleeveSize: "small" | "medium" | "large",
  mark: "○" | "小" | "中" | "大",
  reason: string
): SleeveJudgeResult {
  return {
    error: false,
    sleeveSize,
    mark,
    display: `${mark} (${sleeveSize})`,
    reason,
    message: `判定: ${mark} (${sleeveSize})`,
  };
}

function ng(reason: string): SleeveJudgeResult {
  return {
    error: true,
    reason,
    message: "定義外の組み合わせです",
  };
}

export function judgeSleeve(input: SleeveJudgeInput): SleeveJudgeResult {
  const wire16 = input.wire16Count;
  const wire20 = input.wire20Count;
  const wire26 = input.wire26Count;

  if ([wire16, wire20, wire26].some((v) => !Number.isInteger(v) || v < 0)) {
    return ng("本数は0以上の整数で入力してください。");
  }

  const total = wire16 + wire20 + wire26;
  if (total < 2) return ng("接続本数が不足しています。");

  if (wire20 === 0 && wire26 === 0) {
    if (wire16 === 2) return ok("small", "○", "1.6mm 2本");
    if (wire16 >= 3 && wire16 <= 4) return ok("small", "小", "1.6mm 3〜4本");
    if (wire16 >= 5 && wire16 <= 6) return ok("medium", "中", "1.6mm 5〜6本");
    if (wire16 >= 7) return ok("large", "大", "1.6mm 7本以上");
  }

  if (wire16 === 0 && wire26 === 0) {
    if (wire20 === 2) return ok("small", "小", "2.0mm 2本");
    if (wire20 >= 3 && wire20 <= 4) return ok("medium", "中", "2.0mm 3〜4本");
    if (wire20 >= 5) return ok("large", "大", "2.0mm 5本以上");
  }

  if (wire16 === 0 && wire20 === 0) {
    if (wire26 === 2) return ok("medium", "中", "2.6mm 2本");
    if (wire26 >= 3) return ok("large", "大", "2.6mm 3本以上");
  }

  if (wire26 === 0 && wire20 === 1 && wire16 >= 1) {
    if (wire16 <= 2) return ok("small", "小", "2.0mm1本 + 1.6mm1〜2本");
    if (wire16 <= 5) return ok("medium", "中", "2.0mm1本 + 1.6mm3〜5本");
    return ok("large", "大", "2.0mm1本 + 1.6mm6本以上");
  }

  if (wire26 === 0 && wire20 === 2 && wire16 >= 1 && wire16 <= 3) {
    return ok("medium", "中", "2.0mm2本 + 1.6mm1〜3本");
  }

  if (wire26 === 0 && wire20 === 3 && wire16 === 1) {
    return ok("medium", "中", "2.0mm3本 + 1.6mm1本");
  }

  return ng("ルール未定義の組み合わせです。");
}
