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

---

## 2026-03-10 E2E UI init timeout diagnostics

現在フェーズ  
複線図エンジン安定化 → E2E検証

診断結果

ChromeDriver  
/status → ready:true

session  
/sessions に checkedSessionId 存在

window  
windowHandleFound = true

current URL  
currentUrlFound = true  
currentUrlValue = data:,

navigate  
navigateAttempted = true  
navigateResponseReceived = false  
navigateErrorClass = timeout

post navigate URL  
postNavigateUrlFound = false  
postNavigateUrlErrorClass = timeout

結論

window は生成されているが  
navigate がタイムアウトしている。

次の診断

GET /session/{sessionId}/window/handles  
を minimal session 作成直後に1回追加して  
window handles の存在を確認する。

【2026-03-10 作業終了時点】

本日やったこと  
window handle 診断追加  
current URL 診断追加  
navigate 応答診断追加

現在の状態  
window生成成功  
URL = data:,  
navigate timeout

次回やること  
window handles 診断追加

---

## 2026-03-11 internal junction normalization verification

対象  
js/engine/circuit-engine.js  
createCircuitGraphFromCircuit()

結論  
現段階の実装は維持OK。  
internal junction を内部利用しつつ、返却 public graph は従来互換の意味を維持している。

検証ケース
- 片切1灯
- 片切+コンセント
- 3路1灯

確認結果
- 片切1灯
  - role set = line, neutral, switch_return
  - edge数 = 3
- 片切+コンセント
  - role set = line, line_load, neutral, switch_return
  - edge数 = 5
- 3路1灯
  - role set = line, neutral, switch_return, traveler_1, traveler_2
  - edge数 = 5

確認できたこと
- source/device 中心の public graph 形を維持
- role 名と接続意味は代表ケースで従来互換
- createDiagramLayoutsFromGraphs()
- createWirePathsFromLayouts()
の前提は破壊していない

将来の注意点
- 縮約処理の visitedJunctions は、複雑分岐で同一junctionへの異role経路を厳密保持したい場合に再点検が必要
- branchCount は現状 0 固定で、将来の分岐表現拡張時に見直し候補
- 現時点では互換性優先の内部正規化として採用

次の推奨
- 現実装は維持
- 次は E2E / 表示確認か、複雑分岐ケース追加検証へ進む

【2026-03-11 作業終了時点】
本日やったこと：
- internal junction 正規化後の public graph 意味検証を実施
- 代表3ケースで role set / edge数 / public graph 互換を確認
現在の状態：
- 実装は維持OK
- 将来は縮約ロジックと branchCount の扱いを再点検予定
次回やること：
- E2E / 表示確認または複雑分岐ケースの追加検証

---

## 2026-03-12 downstream_contract_pass gate 運用

適用対象: `stability-test.ps1` が出力する `.tmp_case_results.json`。

目的  
internal junction 正規化の回帰を、固定ケース群で毎回検知する。

前提  
CI workflow は未導入。  
そのため当面はローカル必須ゲートとして運用する。

必須手順（変更ごとに毎回実行）
1. `powershell -ExecutionPolicy Bypass -File .\stability-test.ps1`
2. `.tmp_case_results.json` を確認し、以下をすべて満たすこと
   - `downstream_contract.all_pass = true`
   - `assertions.downstream_contract_pass = true`
   - `assertions.overall_pass = true`

判定基準（固定ケース）
- 片切1灯
- 片切+コンセント
- 3路1灯
- 3路2灯
- 3路2灯+コンセント

各ケースで確認される項目
- role set
- edge数
- layout.nodes の junction leak なし
- wirePaths / SVG 描画あり

失敗時
- `.tmp_case_results.json` の `downstream_contract.cases[].failedChecks` を一次原因として確認
- `expected` と `observed` の差分を優先して修正箇所を切り分ける

visitedJunctions 再検討トリガー
- 複数分岐ケース（3路2灯+コンセント など）で `edge_count_match` の失敗が継続発生した場合、visitedJunctions 再設計を検討する。
- 継続発生の定義: 直近3回の実行で、複数分岐ケースの `edge_count_match` が2回以上失敗。
- 「直近3回」は、最新結果から連続した3実行（欠番なし）を指す。
- 欠番がある場合は当該3回集計を無効とし、連続3実行が揃うまで集計をやり直す。
- 欠番判定の単位は `.tmp_case_results.json` の実行記録をタイムスタンプ順で確認して判断する。
- タイムスタンプが同一の場合は、`.tmp_case_results.json` のファイル更新時刻が新しい方を後順位（後勝ち）として扱う。
- run metadata を使った抽出手順: `runFinishedAt` を基準に新しい順へ整列し、同時刻は上記の後勝ち規則で順序確定する。
- その順序で欠番のない連続3実行を抽出して、`edge_count_match` 継続発生判定に用いる。
- 正式参照キー: `selectedRuns` / `edgeCountFailuresInSelectedRuns` / `shouldReviewVisitedJunctions` / `reason`
- 判定時は `shouldReviewVisitedJunctions=true` を最優先アラートとして扱う。
- `shouldReviewVisitedJunctions=true` の場合は新規変更を止め、`failedChecks` / `expected` / `observed` / `runHistory` を先に確認する。
- 再開条件: `failedChecks` の原因を特定・対処し、`shouldReviewVisitedJunctions=false` を確認してから新規変更を再開する。
- 補助参照キー: `runHistory`（最大20件、抽出根拠の確認用）
- `missingRoles` または `junction_not_exposed_in_layout` の失敗が1回でも出た場合は、優先度高で即時調査する。
- まず確認するログ項目: `failedChecks` / `expected` / `observed`

## 2026-03-12 次にやるべき1手（E2E切り分け継続）
- `stability-test.ps1` のみを最小差分で更新し、`Invoke-SessionNavigateViaCurl()` の結果から webdriver の `value.error` を明示キーとして保存する。
- `preUiInitDiagnostic` に `webdriverError / webdriverError1 / webdriverError2` を追加し、timeout run と value.error run を機械的に分岐できるようにする。
- 再実行して、純粋 timeout run か webdriverError 混在 run かを確定する。

判断基準
- `navigateHttpStatus=0` かつ `navigateStderrSummary` が curl timeout なら timeout run と扱う。
- JSON 内に `value.error` が存在する場合は webdriverError run として扱う。
- `downstream_contract.cases` に未到達の間は、`threeway_2light_plus_2outlets` の `expectedEdgeCount=11` を固定しない。
- `shouldReviewVisitedJunctions` の監視運用は維持するが、現段階では engine 改修判断より E2E 到達回復を優先する。

注意点
- `generateDiagram()` / `groupDevicesByControl()` / `judgeSleeve()` は変更しない。
- graph / layout / wirePaths の外部契約は変更しない。
- エンジン本体は変更せず、当面は `stability-test.ps1` のみで切り分ける。
- `threeway_2light_plus_2outlets` の運用基準固定は observed 実測取得後に行う。

---

## 2026-03-13 次にやるべき1手（repeat観測継続）
- `stability-test.ps1` を既存運用のまま再実行し、`.tmp_case_results_repeat.json` で `mixedWebdriverErrorDetected=true` の初回観測を狙う。
- 追加した `STABILITY_REPEAT_COUNT` を使って試行回数を外から増減し、`.tmp_case_results.json` の既存構造は変更しない。
- mixedが出たrunでは `webdriverError / webdriverError1 / webdriverError2` の少なくとも1つが非空で、`preUiInitDiagnostic.runType=mixed_webdriver_error` になっていることを確認する。

判断基準
- 最新repeat結果が `mixedWebdriverErrorDetected=false` かつ `allTimeoutOnly=true` の場合は「現時点では all timeout_only 継続」と判定する。
- `mixedWebdriverErrorDetected=true` が1回でも出た場合は、該当runの `webdriverError*` 非空と `runType=mixed_webdriver_error` の一致を確認して運用を固定する。
- `runType` 判定仕様は変更しない（webdriverError系が全部 null/空なら `timeout_only`、いずれか非空なら `mixed_webdriver_error`）。

注意点
- 変更は `stability-test.ps1` のみを優先し、エンジン本体（parser / groups / circuits / graph / layout / wirePaths）は変更しない。
- `generateDiagram()` / `groupDevicesByControl()` / `judgeSleeve()` は変更しない。
- 追加集計は `.tmp_case_results_repeat.json` 側に閉じ、`.tmp_case_results.json` の外部契約を維持する。

---

## 2026-03-16 次にやるべき1手（repeat観測継続）
- `stability-test.ps1` の既存repeatラッパーをそのまま使い、`STABILITY_REPEAT_COUNT=5` を次の観測値として実行する（コード変更なし）。

判断基準
- `.tmp_case_results_repeat.json` の `mixedWebdriverErrorDetected=true` が1回でも出れば、該当runの `runIndex` と `runType`（= `preUiInitDiagnostic.runType`）、`webdriverError*` を記録して初回観測成立とする。
- `mixedWebdriverErrorDetected=false` かつ `allTimeoutOnly=true` の場合は、all timeout_only 継続として次段階に進む。
- 既存確認済み（`repeatCount=1/2/3`）はいずれも `mixedCount=0` / `timeoutOnlyCount=repeatCount`。

注意点
- `STABILITY_REPEAT_COUNT=10` は現環境で長時間停止傾向があるため、まずは完走性の高い段階値（5前後）を優先する。
- エンジン本体は変更しない。`stability-test.ps1` も今回は未変更のまま運用する。
- `.tmp_case_results.json` の既存構造は維持し、追加観測は `.tmp_case_results_repeat.json` 側のみで扱う。

---

## 2026-03-16 次にやるべき1手（repeat観測継続2）
- `STABILITY_REPEAT_COUNT=8` をコード変更なしで実行し、`mixedWebdriverErrorDetected=true` の初回観測有無を継続確認する。

判断基準
- `mixedWebdriverErrorDetected=true` が出たら、該当runの `runIndex` / `runType`（= `preUiInitDiagnostic.runType`）/ `webdriverError*` を固定記録して初回観測成立とする。
- `mixedWebdriverErrorDetected=false` かつ `allTimeoutOnly=true` の場合は、all timeout_only 継続として次段階へ進む。
- 本日時点の確定値（`repeatCount=5`）は `mixedCount=0` / `timeoutOnlyCount=5` / `allTimeoutOnly=true`。

注意点
- エンジン本体（parser / groups / circuits / graph / layout / wirePaths）は変更しない。
- `generateDiagram()` / `groupDevicesByControl()` / `judgeSleeve()` は変更しない。
- `.tmp_case_results.json` の既存構造は維持し、追加集計は `.tmp_case_results_repeat.json` 側に閉じる。

---

## 2026-03-16 次にやるべき1手（repeat観測継続3）
- `STABILITY_REPEAT_COUNT=10` をコード変更なしで再実行し、`mixedWebdriverErrorDetected=true` の初回観測有無を継続確認する。

判断基準
- `mixedWebdriverErrorDetected=true` が出た場合は、該当runの `runIndex` / `runType`（= `preUiInitDiagnostic.runType`）/ `webdriverError*` を固定記録して初回観測成立とする。
- `mixedWebdriverErrorDetected=false` かつ `allTimeoutOnly=true` の場合は、all timeout_only 継続として次段階を検討する。
- 本日時点の確定値（`repeatCount=8`）は `mixedCount=0` / `timeoutOnlyCount=8` / `allTimeoutOnly=true`。

注意点
- エンジン本体（parser / groups / circuits / graph / layout / wirePaths）は変更しない。
- `generateDiagram()` / `groupDevicesByControl()` / `judgeSleeve()` は変更しない。
- `.tmp_case_results.json` の既存構造は維持し、追加集計は `.tmp_case_results_repeat.json` 側に閉じる。

---

## 2026-03-16 次にやるべき1手（repeat観測継続4）
- コード変更なしで `STABILITY_REPEAT_COUNT=10` を再度実行し、`mixedWebdriverErrorDetected=true` の初回観測有無を継続監視する。

判断基準
- `mixedWebdriverErrorDetected=true` が出た場合は、該当runの `runIndex` / `runType`（= `preUiInitDiagnostic.runType`）/ `webdriverError*` を固定記録して初回観測成立とする。
- `mixedWebdriverErrorDetected=false` かつ `allTimeoutOnly=true` の場合は、all timeout_only 継続として観測継続とする。
- 本日時点の確定値（`repeatCount=10`）は `mixedCount=0` / `timeoutOnlyCount=10` / `allTimeoutOnly=true`。
- 実行判定は必ず「完走 / 中断」で記録し、今回10回は完走（summary 更新あり）を確認済み。

注意点
- エンジン本体（parser / groups / circuits / graph / layout / wirePaths）は変更しない。
- `generateDiagram()` / `groupDevicesByControl()` / `judgeSleeve()` は変更しない。
- `.tmp_case_results.json` の既存構造は維持し、追加集計は `.tmp_case_results_repeat.json` 側に閉じる。
