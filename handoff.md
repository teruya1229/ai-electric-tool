## このプロジェクトの目的

AI電気工事サポートツールを開発する。

---

## AI電気施工アシスタント 引き継ぎ（最新）

### 現在フェーズ
UI整理 + 表示日本語化 完了

### 完了タスク

1. UI整理  
- legacy-control-card で旧UI非表示  
- devトグル追加  
- 折りたたみカード実装  

2. 表示日本語化  
- LABEL_JA 辞書追加  
- outlet / cable / device 等を日本語化  

3. UI同期修正  
- 上UI → hidden UI の3路同期強化  
- `ui-panel.js` 内 `_syncToExistingUiAndGenerate()` 修正  

4. 表示文言  
- Dev → 詳細表示  

commit: `108107e`

### 未確認事項
実機で以下を確認

- 3路選択 → 図が3路
- 材料に VVF1.6-3C が出る
- 英語表示が残っていない

### 次の開発
もし3路が正常なら次フェーズへ進む

- 高さ
- 配線長さ
- 現場配線モード

### 変更ファイル
- `ui-panel.js`
- `wiring-diagram.js`

### 変更禁止
- `generateDiagram()`
- `groupDevicesByControl()`
- `judgeSleeve()`

対象
・第二種電気工事士
・現場経験の浅い電気工事士
・住宅リフォーム工事

このツールは

「完璧な設計図を断定するAI」ではなく

**現場で迷う時間を減らす判断補助AI**

として作る。

---

## 開発思想

・机上理論より現場実用を優先
・スマホ現場利用を前提
・初心者が頭真っ白になった時に助かる出力を優先
・不明情報が多い場合は「まず現場確認が必要」を優先

---

## 出力優先順位

1 判定結果  
2 まず最初にやること  
3 配線ルート  
4 建築干渉チェック  
5 結線注意  
6 施工手順  
7 現場ミス防止  
8 必要に応じて簡易施工図  

---

## 現在の最優先テーマ

1 建築干渉チェック  
2 配線ルート判断  
3 結線サポート  

---

## 現在の実装状況

### コンセント増設AI

・ブラウザで動作確認済み  
・スマホ対応済み  
・判定結果 / 配線ルート / 建築干渉チェック / 結線注意 / 現場ミス注意 を実装済み  
・簡易施工図を箱型フローで表示  

---

### 3路スイッチAI

・初期実装済み  
・threeway-switch.html / css / js 作成済み  
・初期出力9項目を実装済み（判定結果〜現場ミス）  
・回路の流れ / 必要線 / 簡易結線図 / 配線ルート を出力  

---

### エアコン専用回路AI

・未実装  
・今後のフェーズで実装予定  

---

## 次回作業

次回は

**3路スイッチAIの改善**

を行う。

特に強化したい内容

・返り線  
・渡り線  
・必要本数  
・電源位置による回路の違い  
・初心者が頭の中で配線をイメージできる出力  

加えて、

・コンセント増設AIと3路スイッチAIの導線整理  
・トップページから各AIへ遷移しやすいUI整備  

を実施する。

---

# 次の開発

---

## 目的

3次元配線ルート計算の基礎を作る。

connectionPoints に

横距離
高さ
枝落とし

を統合して

配線長さ概算を計算する。

---

## 実装

connectionPoints を使って

幹線配線長
枝配線長

を計算する。

計算要素

horizontalSpan
trunkHeight
branchDrop
slack

---

## UI

connection-point-route の下に

配線概算

を表示する。
#wire-length-result は wirePaths が空でも 0.0 m を表示し、配線なし にはしない
#wire-length-result の表示ラベルは「配線総延長」で固定する
#ai-diagram-preview-result は groups / circuits / layouts が不足している場合、フォールバック文言「複線図を表示できません / 回路情報が不足しています」を表示する
AI複線図の初期モードは preview とし、再描画時は現在選択中のモードを維持する
対象実装: wiring-diagram.js（state / switcher / dispatcher）
parse完了後のUI更新は updateUiFromParseResult(...) を唯一の入口として行う

例

CP1 → CP2
2.4m

---

## 重要

以下の構造は変更しない

parser
groups
circuits
graph
layout
wirePaths

---

## 次のCursor作業

estimateConnectionPointWireLength(sceneModel)

を実装。

horizontalSpan
+
高さ差
+
branchDrop
+
余長

で配線長さを概算する。

---

# 次の開発

## 目的

回路ごとの材料長さを表示する

現在は全体の材料長さ概算のみ表示されているため

回路別に

どの材料が何m必要か

を確認できるようにする

--------------------------------

## 実装

既存の

aggregateCableLengthsByMaterial()

のロジックをベースに

回路単位の材料長さ集計を追加する

--------------------------------

## UI

回路ごとの材料長さ表示
#material-list-result は通常回路別材料一覧を表示し、全体材料一覧は明示呼び出し時のみ使用する

例

回路1

VVF1.6-2C 6.4m  
VVF1.6-3C 3.2m  

回路2

VVF1.6-2C 4.1m  
VVF2.0-2C 2.6m  

--------------------------------

## 重要

エンジン構造は変更しない

parser
groups
circuits
graph
layout
wirePaths

--------------------------------

## 次のCursor作業

wiring-diagram.js に

回路別材料長さ集計

を追加

新規関数

aggregateCableLengthsByCircuit(sceneModel)

renderCircuitCableLengthSummary(sceneModel)

---

## 現在の状態

3路回路生成の不具合は解消済み

確認済み

・3路複線図生成 正常  
・VVF1.6-3C 材料生成 正常  
・UI同期 正常  

## 修正内容

修正箇所

ui-panel.js  
threeway UI同期 dispatch 修正

index.js  
threeway group生成修正

wiring-diagram.js  
parseGroupsFromDom() で switchType復元

## 現在の材料エンジン

材料一覧は

簡略材料計算

であり

回路単位で材料を数えている

例

3路1灯

VVF1.6-2C ×1  
VVF1.6-3C ×1  

※現場材料数とは一致しない

## 今後の方針

材料計算を

node → node

配線区間ベース

に変更予定

例

power → switch  
switch → switch  
switch → light  

## 次の開発タスク

優先順位

1 複線図生成安定化  
2 材料エンジン改善  
3 分岐チェック（施工ミス防止）  
4 施工支援機能  

---

## テスト

3路選択
↓
生成

確認

・複線図が3路
・VVF1.6-3C 出力
・UI同期正常

---

## 作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・3路回路生成修正
・材料生成修正
・UI同期確認

現在の状態

・3路回路生成正常
・材料表示正常

次回やること

・材料エンジン改善
・分岐ミス検知設計

--------------------------------

## 現在の開発フェーズ

フェーズ1

複線図エンジン安定化

--------------------------------

現在の状態

複線図生成エンジンは基本動作確認済み。

確認済み

・片切回路生成  
・3路回路生成  
・材料一覧表示  
・UI同期  

--------------------------------

現在の材料エンジン

材料生成は

簡略材料計算

であり

回路単位材料。

例

3路1灯

VVF1.6-2C ×1  
VVF1.6-3C ×1  

現場材料とは一致しない。

--------------------------------

今後の方針

材料計算は

node → node

配線区間材料

に変更予定。

--------------------------------

現在の防御構造

rules.md
context.md
status.md
handoff.md
logic.md

さらに

Engine Layer 保護

を rules.md に追加。

--------------------------------

## テスト

handoff.md 更新のみ

--------------------------------

## 作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・Engine Layer 保護追加
・AI開発防御整理

現在の状態

・複線図生成正常

次回やること

・複線図エンジン安定化

---

## Current Debug Phase

ChromeDriver execute script timeout investigation

### Confirmed

navigation works
DevTools communication works
execute script hangs

### Next Step

bare minimum WebDriver session を作成して
execute/sync の挙動を比較する

### Goal

current session capability が原因か
ChromeDriver 145 系の挙動かを切り分ける

---

## E2E診断メモ（2026-03-10）

### 今回確定したこと

- ChromeDriver `/status` は `ready:true`
- `/sessions` に `checkedSessionId` が存在
- `sessionsExtractedIds` に `checkedSessionId` が含まれ、`sessionIdFoundInExtractedIds = true`
- ChromeDriver本体とsessionは生存
- それでも `ui-init timeout` は継続
- `executeSyncErrorClass = timeout`
- `hrefBeforeUiInit = ""`
- `elementCheckSucceeded = false`

### 現時点の技術的な解釈

- 主原因候補は session 消失ではなく、`execute/sync` 系またはウィンドウ未生成/無効
- Claude見解: ページが何もロードされていない、または実ウィンドウが無効な状態で `executeScript` が timeout している可能性が高い
- 次の最小確認は `GET /session/{id}/window` による window handle 確認

### 直近の関連コミット

- `cb3347f` test: classify execute sync diagnostic errors
- `3fa3a85` test: persist ui-init execute sync diagnostics
- `c5add48` test: extract session ids from sessions response
- `5405709` test: use w3c sessions check for health diagnostic
- `0aee900` test: persist chromedriver and session health checks

### 次にやるべき1手

- `stability-test.ps1` の e2e-only 分岐で minimal session 作成直後に `GET /session/{sessionId}/window` を1回追加し、`windowHandleFound / windowHandleValue` を `preUiInitDiagnostic` に保存する
