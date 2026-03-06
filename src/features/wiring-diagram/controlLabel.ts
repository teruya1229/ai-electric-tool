import type { DiagramMode } from "./types";

const EXAM_LABELS = ["イ", "ロ", "ハ", "ニ", "ホ", "ヘ", "ト", "チ", "リ", "ヌ", "ル", "ヲ"] as const;

export type ControlLabelResult = {
  label: string;
  warning?: string;
};

export function getControlLabel(controlId: number, mode: DiagramMode): string {
  return getControlLabelDetail(controlId, mode).label;
}

export function getControlLabelDetail(controlId: number, mode: DiagramMode): ControlLabelResult {
  if (!Number.isInteger(controlId) || controlId <= 0) {
    return {
      label: `#${controlId}`,
      warning: `controlId=${controlId} は正の整数ではありません。`,
    };
  }

  if (mode === "exam") {
    const label = EXAM_LABELS[controlId - 1];
    if (!label) {
      return {
        label: `#${controlId}`,
        warning: `examモードのラベル上限(${EXAM_LABELS.length})を超えました。`,
      };
    }
    return { label };
  }

  return { label: toExcelLikeLabel(controlId) };
}

function toExcelLikeLabel(controlId: number): string {
  let current = controlId;
  let label = "";
  while (current > 0) {
    current -= 1;
    label = String.fromCharCode(65 + (current % 26)) + label;
    current = Math.floor(current / 26);
  }
  return label;
}
