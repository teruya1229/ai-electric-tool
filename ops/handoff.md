## このプロジェクトの目的

AI電気工事サポートツールを開発する。

---

## 引継ぎ・恒久ルール（テンプレ）

- **正本**: Windows 実ファイル `C:\dev\ai-electric-tool` のみ。
- **参考情報**: Linux 側 / git / worktree は参考であり、正本ではない。
- **「修正済み」の表記**: どの環境で修正済みか必ず明記する。
- **反映の扱い**: push 未了の変更を「反映済み」と扱わない。
- **push 403**: push 403 の間は pull / merge を解決策にしない。
- **次に触るファイル**: 原則 **1 ファイルのみ**。

### 引継ぎで必ず記載する項目

1. 正本
2. 反映済み
3. 未反映
4. push 可否
5. 最後に実行した確認コマンド
6. 最後に確認できた結果
7. 今回触るファイル
8. 今回の目的（確認 / 修正）

---

## AI電気施工アシスタント 引き継ぎ（最新）

## 2026-03-28 次にやるべき1手（stability-test.ps1 構文エラー修復）

### 次にやること

- `C:\dev\ai-electric-tool\stability-test.ps1` の ParserError / UnexpectedToken を最小差分で修復する。

### 判断基準

- compare / navigate の意図を壊さない。
- Open-PageWithRetry / comparePhase / WaitForExit(30000) / withChildFinished / withoutChildFinished を壊さない。
- まず PowerShell として最後まで解釈できる状態に戻ること。
- `run-window-handles-only.ps1` 実行時に、ParserError / UnexpectedToken が消えて次の切り分け段階へ進めること。

### 注意点

- 今回触るファイルは原則 `stability-test.ps1` のみ。
- 正本は Windows 実ファイルであり、Linux 側の修正報告を反映済みと扱わない。
- push 403 中は pull / merge を解決策にしない。
- 今は window handles 再検証ではなく、構文エラー除去を最優先にする。
