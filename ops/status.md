# status

## 引継ぎ・記載ルール

- 引継ぎは **handoff.md**（運用上は `ops/handoff.md` を参照）の固定フォーマットに従う。
- 環境表記（Windows / Linux / git / worktree）を省略しない。
- Linux 側のみの修正を、Windows 実ファイル未反映のまま完了扱いにしない。

## 2026-03-28 終了時点（ParserError / UnexpectedToken 優先）

### 今日やったこと

- window handles 差分を主因として追っていたが、WITH / WITHOUT で差が出ない状態まで確認した。
- compare mode に入れる状態までは到達した。
- 最新実行では WITH / WITHOUT 両方とも `stdoutTail=(empty)`、`stderrTail=ParserError` / `UnexpectedToken` を確認した。
- 現在の主因は navigate timeout より前段の `stability-test.ps1` の構文エラーであると切り分けた。

### 現在の状態

- **正本**: Windows 実ファイル `C:\dev\ai-electric-tool`。
- `tools/run-window-handles-only.ps1` は Windows 実ファイルで複数回上書き・実行確認済み（**反映済み: Windows 実ファイル**）。
- `stability-test.ps1` には compare 用の次の 6 項目が Windows 実ファイルで **EXISTS 済み**（**反映済み: Windows 実ファイル**）:
  - `WaitForExit(30000)`
  - `comparePhase`
  - `compareLastStep`
  - `compareTimedOut`
  - `withChildFinished`
  - `withoutChildFinished`
- ただし `stability-test.ps1` 自体が ParserError / UnexpectedToken で崩れており、今は compare / navigate の再評価前に PowerShell として実行可能に戻す必要がある。
- 今回の作業では **`run-window-handles-only.ps1` は触らない**（コード修正は行っていない）。
