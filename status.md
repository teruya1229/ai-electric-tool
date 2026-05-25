# status

## 2026-05-25 片切2 + 照明6灯同時点灯 representative compatibility 完了

### 完了したこと
- 片切スイッチ2個 + 照明6灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_2switches_6lights_diagram_two` を追加済み。
- 今回は 6灯全体解禁ではなく、「片切2 + 6灯同時点灯」1ケース限定で対応した。
- 片切3/4 + 6灯には広げていない。
- 複数コンセント付き6灯には広げていない。
- 実ブラウザ入力「片切スイッチ2個、照明6灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 6灯
- 同時点灯: あり
- コンセント数: なし
- `controlCount`: 2
- エラー: なし
- `confidence`: 85
- `matchedRules`: `circuit:single`, `control:single_switch_count`, `light:6`, `sameTime:true`
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 6` / `compatibility.renderLightCount: 2` を確認済み。
- devices は `sw1/sw2/light1/light2` の2灯代表として記録。
- `light3〜light6` は完全描画されず補助情報扱い。
- `outlet-extra-2` はコンセントなしのため存在しない。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- DOM上で `single_2switches_6lights_diagram_two` が表示されない件も、reasonCode表示未接続の既知差分として今回は追わない。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な6灯描画には進んでいない。
- `sw2` は devices に記録されるが、描画は代表1個のまま（既存の代表表示方針どおり）。
- 片切1 + 6灯ケースと同等の合格基準を満たしている。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `13e9c0b`: `single_2switches_6lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切2 + 6灯同時点灯は限定対応として完了扱い。
- 片切1 + 6灯同時点灯も限定対応として完了扱い。
- 片切1/2/3/4 + 5灯同時点灯は限定対応として完了扱い。
- ただし、6灯全体拡張は未解禁。
- 片切3/4 + 6灯は未対応のまま。
- 複数コンセント付き5灯/6灯は未対応のまま。
- 片切1/2/3/4系の複数コンセント partial は既存完了扱い。
- 3路+コンセントは parser 側エラー停止として別タスク扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な6灯描画には進めない。
- 片切3/4 + 6灯には広げない。
- 複数コンセント付き6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-25 片切1 + 照明6灯同時点灯 representative compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明6灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_6lights_diagram_two` を追加済み。
- 今回は 6灯全体解禁ではなく、「片切1 + 6灯同時点灯」1ケース限定で対応した。
- 片切2/3/4 + 6灯には広げていない。
- 複数コンセント付き6灯には広げていない。
- 実ブラウザ入力「片切スイッチ1個、照明6灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 6灯
- 同時点灯: あり
- コンセント数: なし
- `controlCount`: 1
- エラー: なし
- `confidence`: 85
- `matchedRules`: `circuit:single`, `control:single_switch_count`, `light:6`, `sameTime:true`
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 6` / `compatibility.renderLightCount: 2` を確認済み。
- devices は `sw1/light1/light2` の2灯代表として記録。
- `light3〜light6` は完全描画されず補助情報扱い。
- `outlet-extra-2` はコンセントなしのため存在しない。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- DOM上で `single_6lights_diagram_two` が表示されない件も、reasonCode表示未接続の既知差分として今回は追わない。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な6灯描画には進んでいない。
- 5灯テストと同一レイアウト・同一構造で合格。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `47e426d`: `single_6lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切1 + 6灯同時点灯は限定対応として完了扱い。
- 片切1/2/3/4 + 5灯同時点灯は限定対応として完了扱い。
- ただし、6灯全体拡張は未解禁。
- 片切2/3/4 + 6灯は未対応のまま。
- 複数コンセント付き5灯/6灯は未対応のまま。
- 片切1/2/3/4系の複数コンセント partial は既存完了扱い。
- 3路+コンセントは parser 側エラー停止として別タスク扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な6灯描画には進めない。
- 片切2/3/4 + 6灯には広げない。
- 複数コンセント付き6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切1 + 照明5灯同時点灯 representative compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明5灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_5lights_diagram_two` を追加済み。
- 使用テンプレートは既存の `single_switch_2lights_same_time` を流用。
- 今回は 5灯/6灯全体解禁ではなく、「片切1 + 5灯同時点灯」1ケース限定で対応した。
- 実ブラウザ入力「片切スイッチ1個、照明5灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 5灯
- 同時点灯: あり
- `controlCount`: 1
- エラー: なし
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 5` / `compatibility.renderLightCount: 2` を確認済み。
- devices は `sw1` のみ記録。
- `light3〜light5` は完全描画せず補助情報扱い。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な5灯描画には進んでいない。
- ファイル変更なしの確認のみ（docs追記のみ実施）。

### 主な到達コミット
- `fb7d935`: `single_5lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切1/2/3/4 + 5灯同時点灯は限定対応として完了扱い。
- 5灯/6灯全体拡張は未解禁。
- 6灯は未対応のまま。
- 複数コンセント付き5灯は未対応のまま。
- 3路+コンセントは別タスクのまま。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な5灯描画には進めない。
- 6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-25 docs区切り: 片切4+照明5灯同時点灯 representative compatibility 完了確認

### 完了したこと
- 片切スイッチ4個 + 照明5灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_4switches_5lights_diagram_two` を追加済み。
- 今回は 5灯/6灯全体解禁ではなく、「片切4 + 5灯同時点灯」1ケース限定で対応した。
- 6灯には広げていない。
- 複数コンセント付き5灯には広げていない。
- 実ブラウザ入力「片切スイッチ4個、照明5灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 5灯
- 同時点灯: あり
- `controlCount`: 4
- エラー: なし
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 5` / `compatibility.renderLightCount: 2` を確認済み。
- devices に `sw1/sw2/sw3/sw4` が記録されることを確認済み。
- `light3〜light5` は完全描画せず補助情報扱い。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な5灯描画には進んでいない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `3aa8621`: `single_4switches_5lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切4 + 5灯同時点灯は限定対応として完了扱い。
- 片切2 + 5灯同時点灯、片切3 + 5灯同時点灯も限定対応として完了扱い。
- 5灯/6灯全体拡張は未解禁。
- 6灯は未対応のまま。
- 複数コンセント付き5灯は未対応のまま。
- 片切1/2/3/4系の複数コンセント partial は既存完了扱い。
- 3路+コンセントは parser 側エラー停止として別タスク扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な5灯描画には進めない。
- 6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切3+照明5灯同時点灯 representative compatibility 完了確認

### 完了したこと
- 片切スイッチ3個 + 照明5灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_3switches_5lights_diagram_two` を追加済み。
- 今回は 5灯/6灯全体解禁ではなく、「片切3 + 5灯同時点灯」1ケース限定で対応した。
- 6灯には広げていない。
- 複数コンセント付き5灯には広げていない。
- 実ブラウザ入力「片切スイッチ3個、照明5灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 5灯
- 同時点灯: あり
- `controlCount`: 3
- エラー: なし
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 5` / `compatibility.renderLightCount: 2` を確認済み。
- devices に `sw1/sw2/sw3` が記録されることを確認済み。
- `light3〜light5` は完全描画せず補助情報扱い。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な5灯描画には進んでいない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `2a5df11`: `single_3switches_5lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切3 + 5灯同時点灯は限定対応として完了扱い。
- 片切2 + 5灯同時点灯も限定対応として完了扱い。
- 5灯/6灯全体拡張は未解禁。
- 6灯は未対応のまま。
- 複数コンセント付き5灯は未対応のまま。
- 片切1/2/3/4系の複数コンセント partial は既存完了扱い。
- 3路+コンセントは parser 側エラー停止として別タスク扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な5灯描画には進めない。
- 6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切2+照明5灯同時点灯 representative compatibility 完了確認

### 完了したこと
- 片切スイッチ2個 + 照明5灯同時点灯を、既存の2灯代表図へ寄せる限定 compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_2switches_5lights_diagram_two` を追加済み。
- 今回は 5灯/6灯全体解禁ではなく、「片切2 + 5灯同時点灯」1ケース限定で対応した。
- 6灯には広げていない。
- 複数コンセントには広げていない。
- 実ブラウザ入力「片切スイッチ2個、照明5灯同時点灯」を確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 5灯
- 同時点灯: あり
- コンセント数: なし
- `controlCount`: 2
- エラー: なし
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 5` / `compatibility.renderLightCount: 2` を確認済み。
- devices は `sw1/sw2/light1/light2` の2灯代表として記録。
- `sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知差分として今回は追わない。
- `light3〜light5` は完全描画せず補助情報扱い。
- 警告は「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図で崩れなし。完全な5灯描画には進んでいない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `8b76c8e`: `single_2switches_5lights_diagram_two` を追加した実装コミット

### 現在の状態
- 片切2 + 5灯同時点灯は限定対応として完了扱い。
- 5灯/6灯全体拡張は未解禁。
- 6灯は未対応のまま。
- 複数コンセント付き5灯は未対応のまま。
- 片切2系 1〜4灯 + 複数コンセント partial は回帰確認済み。
- 片切1/3/4系の複数コンセント partial は既存完了扱い。
- 3路+コンセントは parser 側エラー停止として別タスク扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な5灯描画には進めない。
- 6灯には広げない。
- 複数コンセント付き5灯には広げない。
- 3路+コンセントには触らない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 調査メモ: 3路+コンセントは現状 compatibility 横展開対象外

### 調査したこと
- 確認入力: 「3路スイッチ2個、照明1灯、コンセント2個」
- 実ブラウザ結果は解析失敗で、図描画は停止。
- 判定詳細は 回路種別: 3路 / 灯数: 1灯 / コンセント数: 2個 / `controlCount: 1` / `confidence: 70` / `matchedRules: circuit:threeway, light:1, outlet:2`。
- エラーは「3路 + コンセントは現行描画仕様で未対応です。」が2件表示。
- 図エリアは「複線図を表示できません / 回路情報が不足しています」を表示。
- `templateId` は `single_switch_1light` のフォールバック値、`reasonCodes` は `control:1:single_1light` / `renderMode: blocked` / `parserReason: parse.error` を確認。
- `threeway_1light_multi_outlet_partial` は未実装扱い、`outlet-extra-2` 記録なし、`sceneParseErrors: []`。

### 判断
- 3路+コンセントは parser 側の未対応エラーで止まっており、`js/diagram/index.js` の compatibility 分岐追加だけでは解決しない。
- 今回の「1ファイル最小差分（diagramのみ）」対象外として扱い、別タスク化する。

### 主な注意点
- 3路+コンセントを `js/diagram/index.js` だけで無理に直さない。
- parser / UI / warning / `wiring-diagram.js` に広がるため、今は追わない。
- 片切 multi-outlet 系の完了済み合格状態は維持する。

## 2026-05-09 片切2系 1灯/2灯 + 複数コンセント partial 回帰確認完了

### 完了したこと
- 既存対応済みの片切スイッチ2個 + 複数コンセント partial について、実ブラウザで 1灯/2灯ケースの回帰確認を実施した。
- 対象2ケースはいずれも解析成功・エラーなし・図崩れなしで合格した。
- 今回は確認のみで、実装変更・新規コミット追加は行っていない。

### 実ブラウザ確認結果
- ケース1: 「片切スイッチ2個、照明1灯、コンセント2個」
- 判定は 解析成功 / 回路種別: 片切 / 灯数: 1灯 / 同時点灯: なし / コンセント数: 2個 / `controlCount: 2` / エラーなし。
- 内部JSONは `templateId: "single_switch_1light"`、`compatibility.originalLightCount: 1` / `compatibility.renderLightCount: 1`、`sw1/sw2/light1` 記録、`outlet-extra-2` 補助情報、`sceneParseErrors: []` を確認済み。
- 図は 1灯代表図 + コンセント1個代表表示で崩れなし。警告は「片切スイッチ2個 ＋ 複数コンセントは、図では代表形にまとめて表示しています」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。
- ケース2: 「片切スイッチ2個、照明2灯同時点灯、コンセント2個」
- 判定は 解析成功 / 回路種別: 片切 / 灯数: 2灯 / 同時点灯: あり / コンセント数: 2個 / `controlCount: 2` / エラーなし。
- 内部JSONは `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 2` / `compatibility.renderLightCount: 2`、`sw1/sw2/light1/light2` 記録、`outlet-extra-2` 補助情報、`sceneParseErrors: []` を確認済み。
- 図は 2灯代表図 + コンセント1個代表表示で崩れなし。警告は「片切スイッチ2個 ＋ 複数コンセントは、図では代表形にまとめて表示しています」「片切の多灯+コンセントは図を簡略表示します。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。

### 現在の状態
- 片切2 + 照明1灯/2灯 + 複数コンセント partial は実ブラウザで回帰なし確認済み。
- 既存記録どおり、片切2 + 照明3灯/4灯 + 複数コンセント partial も完了扱い。
- docs上では、片切2系の 1〜4灯 + 複数コンセント partial は確認済みとして扱える状態。
- UIデバッグ欄の `reasonCodes: n/a` または `control:1:single_1light` は既知差分として今回は追わない。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-24 docs区切り: 片切4+照明4灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ4個 + 照明4灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_4switches_4lights_multi_outlet_partial` を追加済み。
- 実ブラウザ入力「片切スイッチ4個、照明4灯同時点灯、コンセント2個」で確認済み。

### 実ブラウザ確認結果
- 判定結果: 解析成功
- 回路種別: 片切
- 灯数: 4灯
- 同時点灯: あり
- コンセント数: 2個
- `controlCount`: 4
- エラー: なし
- 警告は「片切の多灯+コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な4スイッチ描画・完全な4灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 4` / `compatibility.renderLightCount: 2`、`sw1/sw2/sw3/sw4`、`light1/light2`、`outlet1/outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知の問題文入力フローの debug 表示未接続として、今回は追わない。
- `stability-test.ps1` は今回一切触っていない。

### スモーク確認
- 入力「片切スイッチ4個、照明3灯同時点灯、コンセント2個」で解析成功を確認済み。
- 回路種別 / 灯数 / `controlCount`: 片切 / 3灯 / 4
- エラーなし、警告5件表示あり、退行なしを確認済み。

### 主な到達コミット
- `1f74bfb`: `single_4switches_4lights_multi_outlet_partial` を追加した実装コミット

### 現在の状態
- 片切4 + 照明4灯 + 複数コンセント partial 対応は完了扱い。
- 片切4 + 照明1灯 / 2灯 / 3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯 / 2灯 / 3灯 / 4灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切1個系の複数コンセント partial 全般は完了扱い。
- 片切2 + 照明3灯 / 4灯 + 複数コンセント partial 対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切4+照明3灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ4個 + 照明3灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_4switches_3lights_multi_outlet_partial` を追加済み。
- 実ブラウザ入力「片切スイッチ4個、照明3灯同時点灯、コンセント2個」で確認済み。
- 判定結果は、解析成功 / 回路種別: 片切 / 灯数: 3灯 / 同時点灯: あり / コンセント数: 2個 / `controlCount: 4` / エラーなし / `confidence: 85`。
- `matchedRules` は `circuit:single`, `control:single_switch_count`, `light:3`, `outlet:2`, `sameTime:true` を確認済み。
- 警告は「片切の多灯+コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な4スイッチ描画・完全な3灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 3` / `compatibility.renderLightCount: 2`、`sw1/sw2/sw3/sw4`、`outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知の問題文入力フローの debug 表示未接続として、今回は追わない。
- `stability-test.ps1` は今回一切触っていない。

### スモーク確認
- 入力「片切スイッチ4個、照明2灯同時点灯、コンセント2個」で解析成功を確認済み。
- `templateId: "single_switch_2lights_same_time"` を確認済み。
- `compatibility.originalLightCount: 2` / `compatibility.renderLightCount: 2` を確認済み。
- `sw4` 記録あり、`outlet-extra-2` 補助記録あり、`sceneParseErrors: []`、エラーなし、退行なしを確認済み。

### 主な到達コミット
- `7e5c273`: `single_4switches_3lights_multi_outlet_partial` を追加した実装コミット

### 現在の状態
- 片切4 + 照明3灯 + 複数コンセント partial 対応は完了扱い。
- 片切4 + 照明2灯 + 複数コンセント partial 対応も退行なし確認済み。
- 片切4 + 照明1灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明1灯/2灯/3灯/4灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切1個系の複数コンセント partial 全般は完了扱い。
- 片切2 + 照明3灯/4灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切4+照明2灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ4個 + 照明2灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility を完了扱いにした。
- `js/diagram/index.js` の reasonCode `single_4switches_2lights_multi_outlet_partial` は実装済みで、既存テンプレ `single_switch_2lights_same_time` を流用する方針を維持した。
- 実ブラウザ確認では、解析成功 / 回路種別: 片切 / 灯数: 2灯 / コンセント数: 2個 / `controlCount: 4` / エラーなしを確認済み。
- 警告は「片切の多灯+コンセントは図を簡略表示します。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は2灯代表図 + コンセント1個代表表示（電源 / SW（イ）/ R1（イ）/ R2（イ）/ C1）で崩れなし。完全な4スイッチ描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 2` / `compatibility.renderLightCount: 2`、`sw1/sw2/sw3/sw4`、`outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- 既知差分として UIデバッグ欄の `reasonCodes: n/a` は今回は追わない。

### 主な到達コミット
- `aff652f`: `single_4switches_2lights_multi_outlet_partial` を追加した実装コミット

### 現在の状態
- 片切4 + 照明2灯 + 複数コンセント partial 対応は完了扱い。
- 片切4 + 照明1灯 + 複数コンセント partial、片切3 + 照明1灯/2灯/3灯/4灯 + 複数コンセント partial、片切3 + 照明なし + 複数コンセント partial、片切1個系の複数コンセント partial（0灯補完/1灯/2灯/3灯/4灯）は完了扱い。
- 片切2 + 照明3灯/4灯 + 複数コンセント partial、片切4系（照明なし複数コンセント / 照明なしコンセントあり / 照明1〜4灯）、片切1 + 4灯、2スイッチ + 複数コンセント partial も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- UIデバッグ欄の `reasonCodes: n/a` は今は追わない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切4+照明1灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ4個 + 照明1灯 + 複数コンセントを、既存の1灯代表図 + コンセント1個代表表示へ寄せる partial compatibility を完了扱いにした。
- `js/diagram/index.js` の reasonCode `single_4switches_1light_multi_outlet_partial` は実装済みで、実ブラウザ入力「片切スイッチ4個、照明1灯、コンセント2個」で合格を確認済み。
- 実ブラウザ確認では、解析成功 / 回路種別: 片切 / 灯数: 1灯 / コンセント数: 2個 / `controlCount: 4` / エラーなしを確認済み。
- 警告は「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」を確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。完全な4スイッチ描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_1light"`、`compatibility.originalLightCount: 1` / `compatibility.renderLightCount: 1`、`sw1/sw2/sw3/sw4`、`outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: control:1:single_1light` は既知の表示未接続/代表表示変換都合として今回は追わず、`stability-test.ps1` も未実施。

### 主な到達コミット
- `faf29ea`: `single_4switches_1light_multi_outlet_partial` を追加した実装コミット

### 現在の状態
- 片切4 + 照明1灯 + 複数コンセント partial 対応は完了扱い。
- 片切3 + 照明1灯/2灯/3灯/4灯 + 複数コンセント partial、片切3 + 照明なし + 複数コンセント partial、片切1個系の複数コンセント partial（0灯補完/1灯/2灯/3灯/4灯）は完了扱い。
- 片切2 + 照明3灯/4灯 + 複数コンセント partial、片切4系（照明なし複数コンセント / 照明なしコンセントあり / 照明1〜4灯）、片切1 + 4灯、2スイッチ + 複数コンセント partial も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切3+照明4灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ3個 + 照明4灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility を完了扱いにした。
- `js/diagram/index.js` に reasonCode `single_3switches_4lights_multi_outlet_partial` を追加済み（実装コミット: `16f4f4b`）。
- 実ブラウザ入力「片切スイッチ3個、照明4灯同時点灯、コンセント2個」で、解析成功 / 回路種別: 片切 / 灯数: 4灯 / 同時点灯: あり / コンセント数: 2個 / `controlCount: 3` / エラーなしを確認済み。
- 警告は簡略表示方針どおりに表示され、図は2灯代表図 + コンセント1個代表表示で崩れないことを確認済み。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 4` / `compatibility.renderLightCount: 2`、`sw1/sw2/sw3`、`outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知の表示未接続差分として今回は追わず、`stability-test.ps1` も未実施。

### 現在の状態
- 片切3 + 照明4灯 + 複数コンセント partial 対応は完了扱い。
- 片切3 + 照明1灯/2灯/3灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切1個系の複数コンセント partial（0灯補完 / 1灯 / 2灯 / 3灯 / 4灯）は完了扱い。
- 片切2 + 照明3灯/4灯 + 複数コンセント partial、片切4系（照明なし複数コンセント / 照明なしコンセントあり / 照明1〜4灯）、片切1 + 4灯、2スイッチ + 複数コンセント partial も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-24 docs区切り: 片切3+照明3灯+複数コンセント partial compatibility 完了確認

### 完了したこと
- 片切スイッチ3個 + 照明3灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility を完了扱いにした。
- `js/diagram/index.js` の reasonCode `single_3switches_3lights_multi_outlet_partial` は実装済みで、実ブラウザ入力「片切スイッチ3個、照明3灯同時点灯、コンセント2個」で合格を確認済み。
- 実ブラウザ確認では、解析成功 / 回路種別: 片切 / 灯数: 3灯 / 同時点灯: あり / コンセント数: 2個 / `controlCount: 3` / エラーなしを確認済み。
- 警告は簡略表示方針どおりに表示され、図は2灯代表 + コンセント1個代表表示で崩れないことを確認済み。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 3` / `compatibility.renderLightCount: 2`、`sw1/sw2/sw3`、`outlet-extra-2`、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄の `reasonCodes: n/a` は既知の表示未接続差分として今回は追わず、`stability-test.ps1` も未実施。

### 主な到達コミット
- `40177a4`: `single_3switches_3lights_multi_outlet_partial` を追加した実装コミット

### 現在の状態
- 片切3 + 照明3灯/2灯/1灯/なし + 複数コンセント partial は完了扱い。
- 片切1個系の複数コンセント partial（0灯補完/1灯/2灯/3灯/4灯）は完了扱い。
- 片切2 + 照明3灯/4灯 + 複数コンセント partial は完了扱い。
- 片切4 + 照明なし + 複数コンセント partial、片切4 + 照明なし + コンセントあり、片切4 + 照明1〜4灯は完了扱い。
- 片切1 + 4灯、および2スイッチ + 複数コンセント partial も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは継続して残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画、完全な3灯/4灯/5灯/6灯描画、完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切3+照明3灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ3個 + 照明3灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_3switches_3lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ3個、照明3灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は3灯、同時点灯あり、コンセント数は2個、`controlCount: 3`、エラーなし。
- 警告に「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な3スイッチ描画・完全な3灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 3` / `compatibility.renderLightCount: 2` を確認済み。devices に `sw1` / `sw2` / `sw3` が記録されていること、`outlet-extra-2` が補助情報として記録されていること、`sceneParseErrors: []` を確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `40177a4`: 片切3 + 照明3灯 + 複数コンセントを `single_3switches_3lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切3 + 照明3灯 + 複数コンセント partial 対応は完了扱い。
- 片切3 + 照明1灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明2灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切1個系の複数コンセント partial は、0灯補完 / 1灯 / 2灯 / 3灯 / 4灯まで一通り完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切3+照明1灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ3個 + 照明1灯 + 複数コンセントを、既存の1灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_3switches_1light_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ3個、照明1灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯、コンセント数は2個、`controlCount: 3`、エラーなし。
- 警告に「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。完全な3スイッチ描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_1light"`、`compatibility.originalLightCount: 1` / `compatibility.renderLightCount: 1` を確認済み。devices に `sw1` / `sw2` / `sw3` が記録されていること、`outlet-extra-2` が補助情報として記録されていることを確認済み。
- UIデバッグ欄では `reasonCodes` が `control:1:single_1light` になるが、問題文入力フローの debug 表示未接続 / 代表表示変換の都合という既知差分のため今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `796a7f1`: 片切3 + 照明1灯 + 複数コンセントを `single_3switches_1light_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切3 + 照明1灯 + 複数コンセント partial 対応は完了扱い。
- 片切3 + 照明2灯 + 複数コンセント partial 対応も完了扱い。
- 片切1個系の複数コンセント partial は、0灯補完 / 1灯 / 2灯 / 3灯 / 4灯まで一通り完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切3+照明2灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ3個 + 照明2灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_3switches_2lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ3個、照明2灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は2灯、同時点灯あり、コンセント数は2個、`controlCount: 3`、エラーなし。
- 警告に「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な3スイッチ描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 2` / `compatibility.renderLightCount: 2` を確認済み。devices に `sw1` / `sw2` / `sw3` が記録されていること、`outlet-extra-2` が補助情報として記録されていることを確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `0d6f9e1`: 片切3 + 照明2灯 + 複数コンセントを `single_3switches_2lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切3 + 照明2灯 + 複数コンセント partial 対応は完了扱い。
- 片切1個系の複数コンセント partial は、0灯補完 / 1灯 / 2灯 / 3灯 / 4灯まで一通り完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切1+照明4灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明4灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ1個、照明4灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は4灯、同時点灯あり、コンセント数は2個、`controlCount: 1`、エラーなし。
- 警告に「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な4灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 4` / `compatibility.renderLightCount: 2`、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `d0ecb44`: 片切1 + 照明4灯 + 複数コンセントを `single_4lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切1 + 照明4灯 + 複数コンセント partial 対応は完了扱い。
- 片切1個系の複数コンセント partial は、0灯補完 / 1灯 / 2灯 / 3灯 / 4灯まで一通り完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- `stability-test.ps1` は触らない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。
- 次回も1ファイル最小差分を基本にする。

## 2026-05-09 片切1+照明1灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明1灯 + 複数コンセントを、既存の1灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_1light_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ1個、照明1灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯、コンセント数は2個、`controlCount: 1`、エラーなし。
- 警告に「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_1light"`、`compatibility.originalLightCount: 1` / `compatibility.renderLightCount: 1`、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では reasonCodes が `control:1:single_1light` になるが、既知の代表表示変換/デバッグ表示差分のため今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `63285dd`: 片切1 + 照明1灯 + 複数コンセントを `single_1light_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切1 + 照明1灯 + 複数コンセント partial 対応は完了扱い。
- 片切1 + 照明2灯 + 複数コンセント partial 対応も完了扱い。
- 片切1 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切1 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- 5灯・6灯など灯数バリエーション拡張は今は追わない。
- UIデバッグ欄の `reasonCodes: n/a` / `single_1light` 表示差分も今は追わない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-09 片切1+照明2灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明2灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_2lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ1個、照明2灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は2灯、同時点灯あり、コンセント数は2個、`controlCount: 1`、エラーなし。
- 警告に「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 2` / `compatibility.renderLightCount: 2`、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため、今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `0f62b20`: 片切1 + 照明2灯 + 複数コンセントを `single_2lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切1 + 照明2灯 + 複数コンセント partial 対応は完了扱い。
- 片切1 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切1 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- 5灯・6灯など灯数バリエーション拡張は今は追わない。
- UIデバッグ欄の `reasonCodes: n/a` 問題も今は追わない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-09 片切1+照明3灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明3灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_3lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ1個、照明3灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は3灯、同時点灯あり、コンセント数は2個、`controlCount: 1`、エラーなし。
- 警告に「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な3灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 3` / `compatibility.renderLightCount: 2`、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため、今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `5848771`: 片切1 + 照明3灯 + 複数コンセントを `single_3lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切1 + 照明3灯 + 複数コンセント partial 対応は完了扱い。
- 片切1 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- 5灯・6灯など灯数バリエーション拡張は今は追わない。
- UIデバッグ欄の `reasonCodes: n/a` 問題も今は追わない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な複数コンセント描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-09 片切1+照明なし+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明なし + 複数コンセントを、既存の1灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_0light_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ1個、照明なし、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯（自然文入力では `light:default1` により補完）、コンセント数は2個、`controlCount: 1`、エラーなし。
- 警告に「灯数未指定のため1灯として扱います。」、「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_1light"` を確認し、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では reasonCodes が `control:1:single_1light` になるが、自然文入力で `lightCount=0` ではなく `lightCount=1` 補完として扱われるため。
- `single_0light_multi_outlet_partial` の実装はソースに存在し、今回の合格判定は「実表示・既存警告・描画・エラーなし」を優先する。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `29634aa`: 片切1 + 照明なし + 複数コンセントを `single_0light_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切1 + 照明なし + 複数コンセント partial 対応は完了扱い。
- 片切2 + 照明4灯 + 複数コンセント partial 対応も完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- 5灯・6灯など灯数バリエーション拡張は今は追わない。
- UIデバッグ欄の reasonCodes 表示差分も今は追わない。
- 自然文入力で `light:default1` 補完により 0light reason に到達しない件も、今は追わない。
- 完全な複数コンセント描画には進めない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-09 片切2+照明4灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ2個 + 照明4灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_2switches_4lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ2個、照明4灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は4灯、同時点灯あり、コンセント数は2個、`controlCount: 2`、エラーなし。
- 警告に「片切スイッチ2個 ＋ 複数コンセントは、図では代表形にまとめて表示しています」、「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な4灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"`、`compatibility.originalLightCount: 4` / `compatibility.renderLightCount: 2`、`outlet-extra-2` が補助情報として記録されることを確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため、今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `5bdc847`: 片切2 + 照明4灯 + 複数コンセントを `single_2switches_4lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切2 + 照明4灯 + 複数コンセント partial 対応は完了扱い。
- 片切2 + 照明3灯 + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- 5灯・6灯など灯数バリエーション拡張は今は追わない。
- UIデバッグ欄の `reasonCodes: n/a` 問題も今は追わない。
- 完全な3灯/4灯/5灯/6灯描画には進めない。
- 完全な複数コンセント描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-09 片切2+照明3灯+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ2個 + 照明3灯 + 複数コンセントを、既存の2灯代表図 + コンセント1個代表表示へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_2switches_3lights_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ2個、照明3灯同時点灯、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は3灯、同時点灯あり、コンセント数は2個、`controlCount: 2`、エラーなし。
- 警告に「片切スイッチ2個 ＋ 複数コンセントは、図では代表形にまとめて表示しています」、「片切の多灯＋コンセントは図を簡略表示します。」「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図 + コンセント1個代表表示で崩れなし。完全な3灯描画・完全な複数コンセント描画には進めていない。
- 内部JSONで `templateId: "single_switch_2lights_same_time"` と `compatibility.originalLightCount: 3` / `compatibility.renderLightCount: 2` を確認済み。
- UIデバッグ欄では `reasonCodes: n/a` だが、問題文入力フローの debug 表示未接続という既知差分のため、今回は追っていない。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `3849c81`: 片切2 + 照明3灯 + 複数コンセントを `single_2switches_3lights_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切2 + 照明3灯 + 複数コンセント partial 対応は完了扱い。
- 片切4 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり対応も完了扱い。
- 片切4 + 照明1〜4灯対応も完了扱い。
- 片切3 + 照明1灯対応も完了扱い。
- 片切1 + 4灯対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の `reasonCodes: n/a` 問題は、必要になったら別タスクで扱う。
- 完全な3灯/4灯描画には進めない。
- 完全な複数コンセント描画には進めない。
- 完全な3スイッチ/4スイッチ描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-08 片切4+照明なし+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明なし + 複数コンセントを、既存の1灯代表図へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_0light_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ4個、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯（灯数未指定のため補完）、コンセント数は2個、`controlCount: 4`、エラーなし。
- 警告に「灯数未指定のため1灯として扱います。」、「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」、「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。2個目のコンセントは補助情報扱いで、図には描画しない設計どおり。
- UIデバッグ欄では reasonCode が `control:1:single_1light` になるが、自然文入力フローで `lightCount=0` ではなく `lightCount=1` 補完として扱われるため。`single_4switches_0light_multi_outlet_partial` の実装はソースに存在し、今回の合格判定は実表示・既存警告・描画・エラーなしを優先する。
- 完全な4スイッチ描画・完全な複数コンセント描画は未対応で、意図的にスコープ外。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `8400ef6`: 片切4 + 照明なし + 複数コンセントを `single_4switches_0light_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切4 + 照明なし + 複数コンセント partial 対応は完了扱い。
- 片切3 + 照明なし + 複数コンセント partial 対応も完了扱い。
- 片切4 + 照明なし + コンセントあり compatibility 対応も完了扱い。
- 片切4 + 照明1〜4灯 compatibility 対応も完了扱い。
- 片切3 + 照明1灯 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の reasonCodes 表示差分は、必要になったら別タスクで扱う。
- 完全な4スイッチ描画、完全な複数コンセント描画、完全な3灯/4灯描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。
- 実ブラウザ確認済みの合格状態を壊さない。

## 2026-05-08 片切3+照明なし+複数コンセント partial compatibility 完了

### 完了したこと
- 片切スイッチ3個 + 照明なし + 複数コンセントを、既存の1灯代表図へ寄せる partial compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_3switches_0light_multi_outlet_partial` が追加済み。
- 実ブラウザで「片切スイッチ3個、コンセント2個」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯（灯数未指定のため補完）、コンセント数は2個、`controlCount: 3`、エラーなし。
- 警告に「灯数未指定のため1灯として扱います。」、「現行SVGはコンセント1個まで描画対応。残りコンセントは補助情報扱いです。」、「コンセント2個以上は1個まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセント1個代表表示で崩れなし。2個目のコンセントは補助情報扱いで、図には描画しない設計どおり。
- UIデバッグ欄では reasonCode が `control:1:single_1light` になるが、自然文入力フローで `lightCount=0` ではなく `lightCount=1` 補完として扱われるため。`single_3switches_0light_multi_outlet_partial` の実装はソースに存在し、今回の合格判定は実表示・既存警告・描画・エラーなしを優先する。
- 完全な3スイッチ描画・完全な複数コンセント描画は未対応で、意図的にスコープ外。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `09034e2`: 片切3 + 照明なし + 複数コンセントを `single_3switches_0light_multi_outlet_partial` へ寄せる diagram compatibility を追加

### 現在の状態
- 片切3 + 照明なし + 複数コンセント partial 対応は完了扱い。
- 片切4 + 照明なし + コンセントあり compatibility 対応も完了扱い。
- 片切4 + 照明1〜4灯 compatibility 対応も完了扱い。
- 片切3 + 照明1灯 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の reasonCodes 表示差分は、必要になったら別タスクで扱う。
- 完全な3スイッチ描画、完全な複数コンセント描画、完全な3灯/4灯描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-08 片切4+照明なし+コンセントあり compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明なし + コンセントありを、既存の1灯代表図へ寄せる compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_0light_outlet_bus` が追加済み。
- 実ブラウザで「片切スイッチ4個、コンセントあり」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯（灯数未指定のため補完）、コンセント数は1個、`controlCount: 4`、エラーなし。
- 警告に「灯数未指定のため1灯として扱います。」が表示されることを確認済み。
- 図は1灯代表図 + コンセントで崩れなし。
- UIデバッグ欄では reasonCode が `control:1:single_1light` になるが、自然文入力フローで `lightCount=0` ではなく `lightCount=1` 補完として扱われるため。`single_4switches_0light_outlet_bus` の実装はソースに存在し、今回の合格判定は実表示・描画・エラーなしを優先する。
- 完全な4スイッチ描画・完全な複数コンセント描画は未対応で、意図的にスコープ外。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `230f427`: 片切4 + 照明なし + コンセントありを1灯代表図へ寄せる diagram compatibility を追加

### 現在の状態
- 片切4 + 照明なし + コンセントあり compatibility 対応は完了扱い。
- 片切4 + 照明4灯 compatibility 対応も完了扱い。
- 片切4 + 照明3灯 compatibility 対応も完了扱い。
- 片切4 + 照明2灯 compatibility 対応も完了扱い。
- 片切4 + 照明1灯 compatibility 対応も完了扱い。
- 片切3 + 照明1灯 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の reasonCodes 表示差分は、必要になったら別タスクで扱う。
- 完全な4スイッチ描画、完全な複数コンセント描画、完全な3灯/4灯描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-08 片切4+照明4灯 compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明4灯を、既存の2灯代表図へ寄せる compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_4lights_diagram_two` が追加済み。
- 実ブラウザで「片切スイッチ4個、照明4灯同時点灯」を確認済み。結果は解析成功、回路種別は片切、灯数は4灯、同時点灯あり、`controlCount: 4`、エラーなし。
- 既存警告として「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」と「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図として崩れなし。補助情報 JSON で `templateId: "single_switch_2lights_same_time"` と `compatibility: { originalLightCount: 4, renderLightCount: 2 }` を確認済み。
- UIデバッグ欄では `reasonCodes: n/a` のままだが、問題文入力フローの debug 表示が compatibility 推定に未接続なためで、今回は追わない。
- 完全な4スイッチ描画・完全な4灯描画は未対応で、意図的にスコープ外。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `43faeff`: 片切4 + 照明4灯を2灯代表図へ寄せる diagram compatibility を追加

### 現在の状態
- 片切4 + 照明4灯 compatibility 対応は完了扱い。
- 片切4 + 照明3灯 compatibility 対応も完了扱い。
- 片切4 + 照明2灯 compatibility 対応も完了扱い。
- 片切4 + 照明1灯 compatibility 対応も完了扱い。
- 片切3 + 照明1灯 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の `reasonCodes: n/a` 問題は、必要になったら別タスクで扱う。
- 完全な4スイッチ描画、完全な3灯/4灯描画、完全な複数コンセント描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-08 片切4+照明3灯 compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明3灯を、既存の2灯代表図へ寄せる compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_3lights_diagram_two` が実装済み。
- 実ブラウザで「片切スイッチ4個、照明3灯同時点灯」を確認済み。結果は解析成功、回路種別は片切、灯数は3灯、同時点灯あり、`controlCount: 4`、エラーなし。
- 既存警告として「現行SVGは照明2灯まで描画対応。残り照明は補助情報扱いです。」と「照明3灯以上は2灯まで図示し、残りは補助情報として扱います。」が表示されることを確認済み。
- 図は2灯代表図として崩れなし。
- UIデバッグ欄では `reasonCodes: n/a` のままだが、問題文入力フローの debug 表示が compatibility 推定に未接続なためで、今回は追わない。
- 完全な4スイッチ描画・完全な3灯描画は未対応で、意図的にスコープ外。
- `stability-test.ps1` は今回一切触っていない。

### 現在の状態
- 片切4 + 照明3灯 compatibility 対応は完了扱い。
- 片切4 + 照明2灯 compatibility 対応も完了扱い。
- 片切4 + 照明1灯 compatibility 対応も完了扱い。
- 片切3 + 照明1灯 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

### 主な注意点
- UIデバッグ欄の `reasonCodes: n/a` 問題は、必要になったら別タスクで扱う。
- 完全な4スイッチ描画、完全な3灯/4灯描画、完全な複数コンセント描画には進めない。
- 代表表示 + compatibility reason + ユーザー向け短文/警告の整合を維持する。

## 2026-05-08 片切4+照明2灯 compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明2灯を、既存の2灯代表図へ寄せる compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_2lights_diagram_two` が追加済み。
- `js/parser/index.js` 側で、黒い解析結果欄の「警告:」に補助文が出るよう対応済み。
- 実ブラウザで「片切スイッチ4個、照明2灯同時点灯」を確認済み。結果は解析成功、回路種別は片切、灯数は2灯、同時点灯あり、コンセント数なし、`controlCount: 4`、エラーなし。
- 警告に「片切スイッチ4個 + 照明2灯は、図では2灯の形にまとめて表示しています」が表示されることを確認済み。
- 5504 で最新版読み込みを確認し合格。
- 完全な4スイッチ描画は未対応で、意図的にスコープ外。代表表示 + compatibility reason + ユーザー向け短文の方針を維持。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `976dbf5`: 片切4 + 照明2灯を2灯代表図へ寄せる diagram compatibility を追加
- `40980c1`: parser warnings に片切4 + 照明2灯の補助文を直接追加

### 現在の状態
- 片切4 + 照明2灯 compatibility 対応は完了扱い。
- 片切4 + 照明1 compatibility 対応も完了扱い。
- 片切3 + 照明1 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

## 2026-05-08 片切4+照明1 compatibility 完了

### 完了したこと
- 片切スイッチ4個 + 照明1灯を、既存の1灯代表図へ寄せる compatibility 対応として完了扱いにした。
- `js/diagram/index.js` には reasonCode `single_4switches_1light_diagram_one` が追加済み。
- `js/ui/index.js` / `js/parser/index.js` 側で、黒い解析結果欄の「警告:」に補助文が出るよう対応済み。
- 実ブラウザで「片切スイッチ4個、照明1灯」を確認済み。結果は解析成功、回路種別は片切、灯数は1灯、同時点灯なし、コンセント数なし、`controlCount: 4`、エラーなし。
- 警告に「片切スイッチ4個 + 照明1灯は、図では1灯の形にまとめて表示しています」が表示されることを確認済み。
- 5503 ではブラウザ/モジュールキャッシュにより古い表示が残ったが、別ポート 5504 で最新版読み込みを確認し合格。
- 完全な4スイッチ描画は未対応で、意図的にスコープ外。代表表示 + compatibility reason + ユーザー向け短文の方針を維持。
- `stability-test.ps1` は今回一切触っていない。

### 主な到達コミット
- `a31ffdb`: 片切4+照明1を1灯代表図へ寄せる diagram compatibility を追加
- `939f2c1` / `4b241ab`: `js/ui/index.js` 側で4スイッチ補助文表示を試行・補強
- `6bf5ef1`: parser warnings に片切4+照明1の補助文を直接追加
- 実ブラウザ確認は 5504 で合格

### 現在の状態
- 片切4 + 照明1 compatibility 対応は完了扱い。
- 片切3 + 照明1 compatibility 対応も完了扱い。
- 片切1 + 4灯 compatibility 対応も完了扱い。
- 2スイッチ + 複数コンセント partial 対応も完了扱い。
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている。

## 2026-05-06 片切2+照明4灯 compatibility 完了

### 完了したこと
- `js/diagram/index.js` のみを変更し、片切スイッチ2個 + 照明4灯を既存代表テンプレートへ寄せる compatibility 分岐を追加
- 追加した reasonCode は `single_2switches_4lights_diagram_two`
- 使用テンプレートは既存の `single_switch_2lights_same_time`
- 条件は「片切スイッチ数2 / 3路スイッチ数0 / 照明数4」
- `node --check js/diagram/index.js` は成功確認済み

### 主な到達コミット
- `c2a83d1`: `single_2switches_4lights_diagram_two` を追加
- `c2a83d1`: `main` へ push 済み（`main -> main`）

### 現在の状態
- 今回の commit / push 対象は `js/diagram/index.js` のみ
- `PROJECT_STATE.md` の既存変更は今回の commit に含めていない
- 大量の未追跡ファイル群も今回の commit に含めていない
- 本日はここで終了できる状態
- 次回は `control_template_unmatched` / `simplified` / `unsupported` の残件から、既存テンプレ流用で済む1ケースを選ぶ

### 文字コード注意
- `status.md` / `handoff.md` は UTF-8（BOMなし）
- PowerShell 5.1 では既定読み取りで文字化けするため、確認時は必ず `Get-Content -Encoding UTF8` を使う

## 2026-05-06 片切3+照明4灯 compatibility 完了

### 完了したこと
- `js/diagram/index.js` のみを変更し、片切スイッチ3個 + 照明4灯を既存代表テンプレートへ寄せる compatibility 分岐を追加
- 追加した reasonCode は `single_3switches_4lights_diagram_two`
- 使用テンプレートは既存の `single_switch_2lights_same_time`
- 条件は「片切スイッチ数3 / 3路スイッチ数0 / 照明数4」
- `node --check js/diagram/index.js` は Codex 側で成功確認済み

### 主な到達コミット
- `fe4e301`: `single_3switches_4lights_diagram_two` を追加
- `fe4e301`: `main` へ push 済み（`main -> main`）

### 現在の状態
- 今回の commit / push 対象は `js/diagram/index.js` のみ
- `PROJECT_STATE.md` の既存変更は今回の commit に含めていない
- 大量の未追跡ファイル群も今回の commit に含めていない
- 次回は `control_template_unmatched` / `simplified` / `unsupported` の残件から、既存テンプレ流用で済む1ケースを選ぶ

### 文字コード注意
- `status.md` / `handoff.md` は UTF-8（BOMなし）
- PowerShell 5.1 では既定読み取りで文字化けするため、確認時は必ず `Get-Content -Encoding UTF8` を使う

## 2026-05-06 片切3+照明3灯 compatibility 完了

### 完了したこと
- `js/diagram/index.js` のみを変更し、片切スイッチ3個 + 照明3灯を既存代表テンプレートへ寄せる compatibility 分岐を追加
- 追加した reasonCode は `single_3switches_3lights_diagram_two`
- 使用テンプレートは既存の `single_switch_2lights_same_time`
- 条件は「片切スイッチ数3 / 3路スイッチ数0 / 照明数3」
- `node --check js/diagram/index.js` で構文エラーがないことを確認

### 主な到達コミット
- `1b05f27`: `single_3switches_3lights_diagram_two` を追加
- `1b05f271f61b418f4542da5aac012ceeeea0bf78`: `main` へ push 済み

### 現在の状態
- 今回の commit / push 対象は `js/diagram/index.js` のみ
- `PROJECT_STATE.md` の既存変更は今回の commit に含めていない
- 大量の未追跡ファイル群も今回の commit に含めていない
- 次回は `control_template_unmatched` / `simplified` / `unsupported` の残件から、既存テンプレ流用で済む1ケースを再び選ぶ

### 文字コード注意
- `status.md` / `handoff.md` は UTF-8（BOMなし）
- PowerShell 5.1 では既定読み取りで文字化けするため、確認時は必ず `Get-Content -Encoding UTF8` を使う

## 2026-05-06 片切3+照明2灯 compatibility 完了

### 完了したこと
- `js/diagram/index.js` のみを変更し、片切スイッチ3個 + 照明2灯を既存代表テンプレートへ寄せる compatibility 分岐を追加
- 追加した reasonCode は `single_3switches_2lights_diagram_one`
- 使用テンプレートは既存の `single_switch_2lights_same_time`
- 条件は「片切スイッチ数3 / 3路スイッチ数0 / 照明数2」
- `node --check js/diagram/index.js` で構文エラーがないことを確認

### 主な到達コミット
- `48190e3`: `single_3switches_2lights_diagram_one` を追加
- `48190e3a0cbb79e84469b1d3745c571c6980929e`: `main` へ push 済み

### 現在の状態
- 今回の commit / push 対象は `js/diagram/index.js` のみ
- `PROJECT_STATE.md` の既存変更は今回の commit に含めていない
- 大量の未追跡ファイル群も今回の commit に含めていない
- 次回は `control_template_unmatched` / `simplified` / `unsupported` の残件から、既存テンプレ流用で済む1ケースを再び選ぶ

### 文字コード注意
- `status.md` / `handoff.md` は UTF-8（BOMなし）
- PowerShell 5.1 では既定読み取りで文字化けするため、確認時は必ず `Get-Content -Encoding UTF8` を使う

## 2026-05-06 片切3+コンセントあり+照明0灯 compatibility 完了

### 完了したこと
- `js/diagram/index.js` のみを変更し、片切スイッチ3個 + コンセントあり + 照明0灯を既存代表テンプレートへ寄せる compatibility 分岐を追加
- 追加した reasonCode は `single_3switches_0light_outlet_bus`
- 使用テンプレートは既存の `single_switch_1light`
- 条件は「片切スイッチ数3 / 3路スイッチ数0 / 照明数0 / コンセント1以上」
- 既存の `single_3switches_1light_diagram_one`、`single_4lights_diagram_two`、`single_2switches_0light_outlet_bus` が残っていることを確認
- `node --check js/diagram/index.js` で構文エラーがないことを確認

### 主な到達コミット
- `46155e3`: `single_3switches_0light_outlet_bus` を追加
- `46155e309717822ab4e2edb537a55a905bfa1f14`: `main` へ push 済み

### 現在の状態
- 今回の commit / push 対象は `js/diagram/index.js` のみ
- `PROJECT_STATE.md` の既存変更は今回の commit に含めていない
- 大量の未追跡ファイル群も今回の commit に含めていない
- 次回は `control_template_unmatched` / `simplified` / `unsupported` の残件から、既存テンプレ流用で済む1ケースを再び選ぶ

### 文字コード注意
- `status.md` / `handoff.md` は UTF-8（BOMなし）
- PowerShell 5.1 では既定読み取りで文字化けするため、確認時は必ず `Get-Content -Encoding UTF8` を使う

## 2026-04-26 片切3+照明1 compatibility 完了

### 完了したこと
- 片切スイッチ3個 + 照明1灯を、既存の1灯代表図へ寄せる compatibility 対応を完了（実ブラウザ確認まで実施）
- `js/diagram/index.js` に `single_3switches_1light_diagram_one` を追加済み
- `wiring-diagram.js` に同 reasonCode のユーザー向け短文を追加済み
- `js/ui/index.js` の `renderParseResult` で、黒い解析結果欄（`#parseResultPanel pre`）の「警告:」にも同短文が出るよう対応済み
- 実ブラウザで入力「片切スイッチ3個、照明1灯」を確認済み
  - 判定結果: 解析成功 / 回路種別: 片切 / 灯数: 1灯 / `controlCount: 3` / エラー: なし
  - `reasonCode`: `control:1:single_3switches_1light_diagram_one`
  - 短文「片切スイッチ3個 + 照明1灯は、図では1灯の形にまとめて表示しています」が表示される
- 完全な3スイッチ描画は未対応で意図的にスコープ外
- 代表表示 + compatibility reason + ユーザー向け短文の方針を維持
- `stability-test.ps1` は今回一切触っていない

### 主な到達コミット
- `99f12d9`: 片切3+照明1を1灯代表図へ寄せる diagram compatibility を追加
- `ade91da`: 片切3+照明1の解析結果パネル向け短文追加
- `a0917c8`: `renderParseResult` の `warnings` / `parsed.warnings` 同期を整理し、警告表示を安定化

### 現在の状態
- 片切3 + 照明1 compatibility 対応は完了扱い
- 片切1 + 4灯 compatibility 対応も完了扱い（次セクション）
- 2スイッチ + 複数コンセント partial 対応も完了扱い
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている

## 2026-04-26 片切1+4灯 compatibility 完了

### 完了したこと
- 片切スイッチ1個 + 照明4灯を、既存の2灯代表図へ寄せる compatibility 対応を完了（実ブラウザ確認まで実施）
- `js/diagram/index.js` に `single_4lights_diagram_two` を追加済み
- `js/parser/index.js` で `compatibility.originalLightCount` / `compatibility.renderLightCount` を保持
- `js/ui/index.js` で `built.compatibility` を `generateDiagram` に渡す導線を追加
- `wiring-diagram.js` で `single_4lights_diagram_two` のユーザー向け短文を追加済み
- 実ブラウザで入力「片切スイッチ1個、照明4灯同時点灯」を確認済み
  - 判定結果: 解析成功 / 回路種別: 片切 / 灯数: 4灯 / 同時点灯: あり / `controlCount: 1` / エラー: なし
  - `matchedRules` に `light:4` / `sameTime:true` が出る
  - `reasonCode`: `control:1:single_4lights_diagram_two`
  - 短文「片切1 + 照明4灯は、図では2灯の形にまとめて表示しています」が表示される
- 既存の代表表示説明も維持（現行SVGは照明2灯まで／3灯以上は2灯まで図示し残りは補助情報）
- 完全な4灯描画は未対応で意図的にスコープ外
- `stability-test.ps1` は今回一切触っていない

### 主な到達コミット
- `d61b2ba`: `single_4lights_diagram_two` を diagram 側に追加
- `fbccc46`: `single_4lights_diagram_two` のユーザー向け短文を追加
- `a4313ca`: parser 側で `originalLightCount` / `renderLightCount` を保持
- `e82704c`: diagram 側で `compatibility.originalLightCount` を参照
- `daac944`: UI 経路で compatibility メタデータを `generateDiagram` に渡す

### 現在の状態
- 片切1 + 4灯 compatibility 対応は完了扱い
- 2スイッチ + 複数コンセント partial 対応も完了扱い（前セクション）
- 代表表示 + partial / compatibility reason の方針を維持
- `PROJECT_STATE.md` の既存変更と大量の未追跡ファイルは引き続き残っている

## 2026-04-26 2スイッチ+複数コンセント partial 完了

### 完了したこと
- 片切スイッチ2個 + 複数コンセント系は、parser → UI → diagram reason → ユーザー向け警告表示まで接続完了
- 実ブラウザで以下3入力を確認済み
  1. 片切スイッチ2個、コンセント2個
  2. 片切スイッチ2個、照明1灯、コンセント2個
  3. 片切スイッチ2個、照明2灯同時点灯、コンセント2個
- 3ケースとも `controlCount: 2` / `コンセント数: 2個` / `エラー: なし` を確認
- 3ケースとも期待短文が警告欄に1回だけ表示されることを確認
  - `片切スイッチ2個 + 複数コンセントは、図では代表形にまとめて表示しています`
- 既存警告（コンセント補助情報2文）と、3ケース目の多灯コンセント簡略表示警告は維持
- 代表図 outlet 1個表示の方針を維持し、複数コンセント完全描画は意図的にスコープ外

### 主な到達コミット
- `1b17a4e`: parsed light/outlet count を active group に反映
- `2a32ed0`: parsed controlCount を switch_single 数量へ反映し図入力へ補正
- `d47b571`: parser で片切スイッチ数を controlCount に反映
- `9c59de6`: multi-outlet count を compatibility reasoning に保持
- `0ff0d25`: 接頭辞付き multi-outlet reason を短文判定で拾う
- `d2ce1d5` / `9d18e68` / `ddb1b90` / `6805e3e`: warning 表示経路の調整
- `976a98f`: `renderParseResult` 側で2スイッチ+複数コンセント短文を安定表示
- `976a98f` 反映後の実ブラウザ確認で3ケース合格

### 現在の状態
- 2スイッチ + 複数コンセント partial 対応は完了扱い
- `stability-test.ps1` は今回未実施
- `PROJECT_STATE.md` の既存変更と多数未追跡ファイルは継続して残っている

## 2026-04-26 parser→UI→diagramReasonCodes→wiring短文 到達点

### 今日やったこと
- `js/ui/index.js` で `parsed.lightCount` / `parsed.outletCount` を active `group.devices` に反映する修正を反映済み
- `js/ui/index.js` で `parsed.controlCount` を `switch_single` 数量へ反映し、図入力へ `sw2...` を差し込める修正を反映済み
- `js/parser/index.js` で「片切スイッチ2個」「片切2」「片切スイッチが2つ」などを `parsed.controlCount=2` として返す修正を反映済み
- `js/ui/index.js` で group 側 `outlet>=2` 情報を compatibility 判定まで保持する修正を反映済み
- `wiring-diagram.js` で `control:1:` 接頭辞付き `*_multi_outlet_partial` reasonCode でも短文判定に入る修正を反映済み

### 現在の状態
- 片切スイッチ2個 + コンセント2個系は Node/同等経路で次へ到達確認済み
  - `control:1:single_2switches_1light_multi_outlet_partial`
  - `control:1:single_2switches_2lights_multi_outlet_partial`
  - `diagram:single_multi_outlet_partial`
- ユーザー向け短文 `片切スイッチ2個 + 複数コンセントは、図では代表形にまとめて表示しています` は接頭辞付き reasonCode でも出る条件になった
- 代表図は outlet 1個表示のまま
- 複数コンセント完全描画は未対応で、意図的にスコープ外
- `stability-test.ps1` は今回未実施
- `PROJECT_STATE.md` の既存変更と多数未追跡ファイルは継続して残っている

### 直近コミット
- `1b17a4e`: parsed light/outlet count を active group に反映
- `2a32ed0`: parsed controlCount を switch_single 数量へ反映し図入力へ補正
- `d47b571`: parser で片切スイッチ数を controlCount に反映
- `9c59de6`: multi-outlet count を compatibility reasoning に保持
- `0ff0d25`: 接頭辞付き multi-outlet reason を短文判定で拾う

## 2026-04-24 parser→sceneModel 反映経路の切り分け（正本・追記）

### 今日わかったこと
- 自然文3入力（片切スイッチ2個 + 複数コンセント系）は **`parse.ok`** になるが、diagram 側の reasonCode は期待した `*_multi_outlet_partial` に到達しない
- `#parseResultPanel pre` には parser 認識値（例: `コンセント数: 2` / `灯数: 2` / `同時点灯: あり`）が表示される
- 一方で `#debug-result` / `#group-list` / diagram 入力は **`switch_single=1, light=1, outlet=0`** 相当に収束し、`diagramReasonCodes` はほぼ `control:1:single_1light` になる
- つまり、**parser 表示値**と**sceneModel/groups/devices の実体**に不一致がある
- 主因は `wiring-diagram.js` / `js/diagram/index.js` ではなく、**`js/ui/index.js` の `parseAndApplyProblemText` 経路**にある
- `parseAndApplyProblemText` は `parsed.lightCount` / `parsed.outletCount` を select に一時反映するが、active group の `devices` へ `_setGroupQuantity(...)` で反映していない
- その後 `renderAll` / `generateAndRender` が走るため、初期 `group.devices`（`light=1` / `outlet=0`）で再同期される
- switch 数 / controlCount については parser 側でも `controlCount` が実質固定 1 で、自然文から「スイッチ2個」を 2 switch device として保持する設計は未対応

### 現在の状態
- diagram 側では 2スイッチ系 multi-outlet partial reasonCode 群の追加は完了済み
- `resolveDiagramCompatibility` 側でも `*_multi_outlet_partial` → `diagram:single_multi_outlet_partial` の整理は完了済み
- `wiring-diagram.js` 側でも以下3 reasonCode のユーザー向け短文表示は追加済み
  - `single_2switches_0light_multi_outlet_partial`
  - `single_2switches_1light_multi_outlet_partial`
  - `single_2switches_2lights_multi_outlet_partial`
- ただし現状の自然文入力経路では、`js/ui/index.js` 側で値が潰れるため、上記 reasonCode まで到達できない

---

## 2026-04-23 single multi-light compatibility 拡張の反映（正本・追記）

### 今日やったこと
- `js/diagram/index.js` で **`single_3lights_diagram_two`** を追加し、**片切1 + 照明3灯**を既存の **`single_switch_2lights_same_time`** テンプレ互換へ寄せた（commit **`9f326d19e978846d9f2aa9151279446454dd7a09`**、`main` push 済み）
- `wiring-diagram.js` で上記の意味をユーザー向け補助文へ**1行だけ**反映した（commit **`3390f1a0998a4c85b51979aaaf54eb1dd0605dca`**、`main` push 済み）
- `wiring-diagram.js` 側の責務整理は一区切りで維持
  - **`finalRender` を正規契約**として維持
  - **`shouldRender` / `useCompatWarning` は返却契約から切り離し**済み
  - **`canContinueParser` / `canContinueDiagram`** は debug view 導出へ移行済み
- `js/diagram/index.js` 側の compatibility 拡張を継続し、既存の前進ケースとして
  - **`single_0light_outlet_bus`**
  - **`threeway_2lights_diagram_one`**
  - **`threeway_3lights_diagram_one`**
  - **`threeway_4lights_diagram_one`**
  - **`three_way_1light` 系 + コンセント1個**
  - **`single_3lights_diagram_two`**
  を反映済み

### 現在の状態
- **`wiring-diagram.js` の責務整理**はいったん一区切り
- 開発の主線は **`js/diagram/index.js` で未対応ケースを 1 つずつ削減**するフェーズを継続中
- **3路多灯だけでなく別ファミリーへの横展開**も進行中
- **次の主線**は **another non-threeway family で 1 ケース前進**（**1 ファイル最小差分・既存テンプレ流用優先**）

---

## 2026-04-23 diagram compatibility 拡張の反映（正本・追記）

### 今日やったこと
- `js/diagram/index.js` で **`three_way_1light` 系 + コンセント1個**を通常描画側へ寄せる互換拡張を反映した（commit **`94a66a8070c0212c7b9e75cd82f608b52aef636c`**、`main` push 済み）
- `wiring-diagram.js` で上記の意味をユーザー向け補助文へ**1行だけ**反映した（commit **`d2409dbd1a3ad307dea3b7ae5036818b88a8a824`**、`main` push 済み）
- `wiring-diagram.js` 側の責務整理は一区切りで維持
  - **`finalRender` を正規契約**として維持
  - **`shouldRender` / `useCompatWarning` は返却契約から切り離し**済み
  - **`canContinueParser` / `canContinueDiagram`** は debug view 導出へ移行済み
- `js/diagram/index.js` 側の compatibility 拡張を継続し、既存の前進ケースとして
  - **`single_0light_outlet_bus`**
  - **`threeway_2lights_diagram_one`**
  - **`threeway_3lights_diagram_one`**
  - **`threeway_4lights_diagram_one`**
  - **`three_way_1light` 系 + コンセント1個の通常描画寄せ**
  を反映済み

### 現在の状態
- **`wiring-diagram.js` の責務整理**はいったん一区切り
- 開発の主線は **「責務整理フェーズ」から「diagram で未対応ケースを 1 つずつ減らすフェーズ」へ移行済み**
- 主線は **`js/diagram/index.js` で未対応ケースを 1 つずつ減らすこと**
- **3路多灯だけでなく別系統への横展開**も開始済み
- **次の主線**は **another diagram family で 1 ケース前進**（**1 ファイル最小差分・既存テンプレ流用優先**）

---

## 2026-04-19 parse／図互換の責務整理完了と diagram compatibility 前進（正本・追記）

### 今日やったこと
- `wiring-diagram.js` 側の責務整理は一区切りついた
  - **`finalRender` を正規契約**として維持
  - **`shouldRender` / `useCompatWarning` は返却契約から切り離し**、結合ロジックは `resolveParseToRenderDecision` / `resolveFinalRenderDecision` 内のローカル導出に閉じた
  - **`canContinueParser` / `canContinueDiagram`** は `resolveParseToRenderDecision` の戻りから外し、**開発者互換サマリ（debug view）導出**へ寄せ済み
- `js/diagram/index.js` で **diagram compatibility をさらに 2 ケース前進**した（**`main` に push 済み**）
  - **`single_0light_outlet_bus`**（片切1＋照明0＋コンセントありを単灯バス配線テンプレへ寄せる）— commit **`fcdeaebc51063c0ff206839d512de457be611eaa`**
  - **`threeway_2lights_diagram_one`**（**3路スイッチ2個＋照明2個（同一 `controlId`）**を **`three_way_1light`** 系互換へ載せ、**既存図では1灯相当**で扱う）— commit **`27f920ee3e7075277b348a5efc6669326120a82c`**
- `wiring-diagram.js` では **`diagramReasonCodes`** のうち上記に紐づく旨を、ユーザー向け補助文に**短文で一段だけ**反映（commit **`68fd5a7be2e0d76f57fd347f4ef3152c3d884c71`**）

### 現在の状態
- **`wiring-diagram.js` の責務整理**はいったん十分な深度に達した
- 開発の主線は **「責務整理フェーズ」から「未対応ケースを 1 つずつ減らすフェーズ」へ移行済み**
- **次の主線**は **`js/diagram/index.js` で 3 つ目の simplified / unsupported を 1 ケース減らす**こと（**1 ファイル最小差分・既存テンプレ流用優先**）

---

## 2026-04-12 単発 run 固定と最低条件完走ログの取得（正本・追記）

### 今日やったこと
- `STABILITY_REPEAT_COUNT=1` を **`cmd /c "set STABILITY_REPEAT_COUNT=1&& ..."`** の形で子プロセスに渡し、**`repeat-run start index=1/1`** を確認できる実行方式に固定した
- 保存先 **`C:\dev\ai-electric-tool\.tmp_step5_run_146_timestamp_compare_final.txt`** に、**同一ファイルで最低条件 6 点が揃う** run を取得した  
  - `repeat-run start index=1/1`  
  - `step=wait start(ui init) phase=start`  
  - `wd-exec-script-head label=ui-init-precheck-exec-probe`  
  - `wd-exec-script-head label=ui-init-timeout-snapshot-exec-probe`  
  - `finally cleanup phase=done`  
  - `repeat-run summary written`  
- 最新の完走ログ束（`.tmp_step5_run_146_timestamp_compare_final.txt` / `cd.run-20260412-204940-810.log`）で証拠表を作成し、取得済み証拠（renderer timeout / `RESPONSE ExecuteScript ERROR script timeout` / ui-init precheck・timeout-snapshot / cleanup done / summary written）と未取得証拠（9517 系失敗の強い比較材料 / `Render process gone.`）を整理した
- 終端イベントは **最後の `RESPONSE ExecuteScript ERROR script timeout`** を最有力として固定した

### 現在の状態
- **実行条件の問題**（repeat が 1/5 のまま等）は解消し、**分析に必要な完走形ログは取得済み**
- **repeat 1/1** と **最低条件 6 点**は達成済みで、主因候補は **renderer timeout / ExecuteScript timeout 系**として維持
- **`Render process gone.`** と **9517 系失敗**は同一証拠束では未確定のため、**A/B は断定せず C 寄り**を維持
- 今後の比較は、**終端イベント（最後の `RESPONSE ExecuteScript ERROR script timeout`）固定**を前提に進める

---

## 2026-04-12 ChromeDriver ログ終端と precheck / timeout-snapshot の整理（正本）

### 今日やったこと
- バックグラウンド 1 回の run は**完走**し、`finally cleanup phase=done` および `repeat-run summary written` に到達した事実を整理した
- recovered post-nav 3 本（return-1 / ready-state / location-href）は**維持**し、ChromeDriver 側の `RESPONSE ExecuteScript ERROR script timeout` との対応付けは従来どおり有効
- 一方、`ui-init-precheck-exec-probe` / `ui-init-timeout-snapshot-exec-probe` は stability 側ログにはあるが、当該 ChromeDriver ログでは対応する `COMMAND ExecuteScript` が見えておらず、**1 対 1 対応は未確定**と整理した
- リカバリ後 ChromeDriver ログ `cd.run-20260410-213555-932.log` は **`COMMAND GetUrl` 直後で終端**しており、precheck / timeout-snapshot の execute に対応する追記がないことを再確認した

### 現在の状態
- **主因候補**は引き続き **timeout** が最も強い（レンダラ script timeout / curl 28 / 操作タイムアウト等）
- **404 / no such window / invalid session id** は今回のログ束では**主因として扱わない**
- **次の焦点**: ChromeDriver ログの**途中停止**、**別 `cd.run-*.log` への分岐**、**クライアント側 timeout 先行**の切り分け

---

## 2026-04-10 ChromeDriver 146 ui-init 観測・timeout 対応整理（正本）

### 今日やったこと
- ui-init precheck / timeout snapshot を含む完走ログを、Windows 正本でバックグラウンド 1 回取得（例: `.tmp_step5_run_146_confirm_uiinit_exec_mapping.txt`）
- stability 側で `ui-init-precheck-exec-probe` / `ui-init-timeout-snapshot-exec-probe` / 2 回の `ui-init timeout last` / `finally cleanup phase=done` / `repeat-run summary written` まで確認
- recovered post-nav 3 本（return-1 / ready-state / location-href）と、リカバリ後 ChromeDriver ログ（`cd.run-20260410-213555-932.log`）上の `RESPONSE ExecuteScript ERROR script timeout` をスクリプト本文ベースで対応付け
- 主因候補は **timeout** が最も強いことを確認（404 / no such window / invalid session id は今回のログ束では主因扱いしない）
- `ui-init-precheck-exec-probe` / `ui-init-timeout-snapshot-exec-probe` は stability 側ログにはあるが、当該 ChromeDriver ログには対応する `COMMAND ExecuteScript`（例: `return 1;` の追加分）が現れず、**script timeout との 1 対 1 対応は今回ログだけでは確定不能**と確認
- 使用したリカバリ後ログ `cd.run-20260410-213555-932.log` は **`COMMAND GetUrl` 直後で終端**しており、precheck / timeout-snapshot の execute に対応する追記がない

### 現在の状態
- 当該 run は `finally cleanup phase=done` / `repeat-run summary written` まで**完走**
- recovered post-nav 3 本は**維持**（従来どおり ok=False 系）
- 主因は **timeout 寄り**（レンダラ script timeout / curl 28 / 操作タイムアウト等）
- 404 / no such window / invalid session id は今回ログ束では**主因として扱わない**
- **未確定**: precheck / timeout-snapshot の execute と ChromeDriver 側 `RESPONSE ExecuteScript ERROR script timeout` の対応
- **次の主題**: ChromeDriver ログが途中で止まっているのか / 別ログへ出ているのか / クライアント側 timeout が先行しているのかの切り分け

---

## 2026-04-01 ChromeDriver 146 再計測・cleanup（正本）

### 今日やったこと
- status.md / handoff.md を更新し、commit **94bf7ed** を **main** へ push 済み
- Windows 正本で chromedriver.exe 実ファイルの差し替え後確認を実施
- 実ファイルの現行 chromedriver.exe は **146.0.7680.167**
- Windows 正本で repeat カウント 1 の単発設定で `stability-test.ps1` の再実行を実施
- この再実行では、実行ログ先頭で chromedriver-version=**146.0.7680.167**、chrome-version=**146.0.7680.167** を確認
- port 5500 / 5501 が使用中のため **5502** で静的サーバ起動
- 先頭の pageLoadStrategy=none セッションでは direct webdriver navigate が httpStatus=200 で成功
- ただし e2e-only mode の直後、finally cleanup 中の Invoke-RestMethod 接続失敗（`stability-test.ps1` 1236 付近）で run 後半観測が阻害された
- 実行後、暴走気味の再実行状態になったため、chromedriver と stability-test 実行中 PowerShell を手動停止
- 停止確認では chromedriver / stability-test 該当 PowerShell ともに残プロセスなしを確認

### 現在の状態
- Windows 正本の `stability-test.ps1` には transport 比較ログが反映済み
- **145 run** では recovered post-nav の execute/sync が curl / PS 両方 timeout を確認済み
- **146 run** では実行ログ先頭の chromedriver-version も 146 系になり、Chrome 146 との不整合は解消済み
- ただし **146 run は cleanup 接続失敗で後半観測が欠けており**、145/146 差分の fully observed 比較は未完了
- 現在は関連プロセスを停止済みで、再実行していない

---

## 2026-03-29 stability-test（ChromeDriver / E2E 診断）

### 今日やったこと
- navigate timeout 後の recovery で ChromeDriver プロセス自体を再起動する分岐を追加した
- recovered minimal session を pageLoadStrategy=none で作るように変更した
- recovered の direct navigate 成功直後に execute/sync の軽量プローブを入れる変更を追加した

### 現在の状態
- 通常 minimal session（pageLoadStrategy=normal）は direct /url が timeout する
- driver recycle を入れても recovered session で再発したため、同一 driver 使い回しだけが主因ではない
- recovered session を pageLoadStrategy=none にしたことで、最初の direct navigate は httpStatus=200 で成功した
- ただしその直後の execute/sync 系は exec-error に落ちるため、問題の中心は navigate 後の execute/sync 側にもある
- 次回は recovered post-nav probe（return-1 / ready-state / location-href）の結果確認が主目的

---

## ?????????

- ???? **handoff.md** ?????????????
- ?????Windows / Linux / git / worktree????????

## AI�?��?�?�工�?��?��?��?��?��??�?�?��?�: 108107e�?

## 2026-03-21 �?�?�??�?��?windowHandles probe �?�?�?��?�?��??�?�?commit: pending�?

### �?�?��??っ�?�?と
- `tools/run-window-handles-only.ps1` �?? compare �?�?�?�?��?�?? **probe �?�?�?�?�** に�??�??�?��?�?�??
- `stability-test.ps1` に `STABILITY_IS_PROBE` / `STABILITY_REPEAT_CHILD` �??使っ�?�??小�??�?��?��??�?��?��??�??追�?��?�?�?5�??15�?で�?結�?�Wait-BrowserReady �??�?�で�?��?��?止�?�??
- `$script:probePath` �?? `$PSScriptRoot` �??�?��?�に修正�?�?�`Start-Process` �?�?�での�??�?�不正�??解�?�?�?�??
- intentional stop の `exit 0` �?? `throw "probe_intentional_stop"` に�?�?��?�?�`finally {}` �?�?�?�?�?�?�??�??�??�?に�?�?�??
- 失�??�??の診�?�表示�?`childExitCode` / `probeFileExists` / `probePath` / `childErrTail` / `childLogTail`�?�?? `run-window-handles-only.ps1` の�?��??�??�?��??�?�に追�?��?�?�??

### 現�?�の�?��??
- �?��?��?��?��?�?�?��??�?��??は�?��?:
  ```
  Set-Location C:\dev\ai-electric-tool
  powershell -ExecutionPolicy Bypass -File .\tools\run-window-handles-only.ps1
  ```
- �?�?�?に�?��?��??�??�?��??�?の `[window-handles-probe]` �??�?��??�?�だ�?確認�?�??�??
- �??�?��?�?結�??:
  - `status: error` / `elapsedSec: 2` / `childExitCode: 1`
  - `probeFileExists: True` / `probePath: C:\dev\ai-electric-tool\.tmp_probe_result.json`
  - `childErrTail` に `probe_intentional_stop`
  - `childLogTail` は `finally cleanup phase=done` まで�?��?
- **probe �??�?��?��?��?��?は�?��?�??て�?�??**�??`run-window-handles-only.ps1` 側の読み�?�??/JSON 解�??に�?��?��?�?って�?�??可�?��?��?�?�?�??
- 次�??: `tools/run-window-handles-only.ps1` の `.tmp_probe_result.json` 読み�?�??�?��??�??確認�?��??小差�??で修正�??

## 2026-03-19 �?�?�??�?��?windowHandles compare �?�?�?��?�?��??�?�?commit: pending�?

### �?�?��??っ�?�?と
- `stability-test.ps1` の child �?�?�?路で `Make-Japanese` �?��?義�?��?��?��??解�?�?�?�?�?義�??�?��?��?��??�??�??頭へ移�??�?�??
- `stability-test.ps1` の finally cleanup の bare call 4�?�??�?? `try {} catch {}` で�?�み�?�cleanup �?�?で compare �?��?�?�?�??な�?�??�?に�?�?�??
- `stability-test.ps1` の child �?�?で `Wait-BrowserReady` �?��?義�?��?��?��??解�?�?�?�?�?義�??�?��?��?��??�??�??頭へ移�??�?�??
- child の `childExitCode` / `childStdoutTail` / `childStderrTail` / `childExceptionSummary` / `childTimedOut` / `childKilled` / `childPid` / `childResultExists` / `childResultLength` / `diagnosticSourceFound` �?? compare summary に追�?��?�?�??
- child 起�??�?�式�?? `-File` �?�?? `-Command "& 'script' *>&1 | Out-File ..."` + `-WindowStyle Hidden` に�?�?��?�?�`Write-Host`�?stream 6�?�??含�??�?��?��??�?��?��?��??�?��?��??�?��?�でき�??�??�?に�?�?�??
- `tools/run-window-handles-only.ps1` �??�?��?��?�?�compare �?�?�?に `.tmp_case_results_compare.json` �??�?��??で�?�形表示�?�??�??�?に�?�?�??

### 現�?�の�?��??
- �?��?��??は�?� commit�?pending�?�??
- `.\tools\run-window-handles-only.ps1` の1�??�?�?で compare �?�?�?�?�形表示�?�?結�?�??�??
- �?��?��?��?��? JSON �??�??読み�?�?�?? `Select-Object` �??�??�??ち�?�??�?�?�は不要になっ�?�??
- 次�??は `.\tools\run-window-handles-only.ps1` �??�?�?�?�?�`[window-handles-only]` �??�?��??�?�の `childResultExists` / `diagnosticReadState` �??確認�?�??�??

## 2026-03-18 �?�?�??�?��?windowHandles child読み�?�??�?路�?�?commit: 5ae0e8e�?

### �?�?��??っ�?�?と
- windowHandles-only compare の child �?�?�?読み�?�??�?路�??�?�確認�?�?�??
- `diagnostic=null` �?��?�?�?路�?child �?�?�読�?��?��??で�??�?まで null の場�?にそのまま�?却�?�??�?��?�?�?�??
- `stability-test.ps1` に�?�`diagnostic` �? null にな�??な�?�??小 fallback と `diagnosticReadState`�?`missing` / `empty` / `unreadable` / `unreadable-or-unexpected-json`�?�??追�?��?�?�??
- commit / push �??�?�?�?�?�?`5ae0e8e`�?�??

### 現�?�の�?��??
- 修正は `origin/main` に反�?��?み�??
- �?�??�?��?��?�への�?�?�波�?な�?�?�?�??�?業�??�?�??
- �?�?は�?��?�?��??
- 次�??は `.tmp_case_results_compare.json` の `diagnosticReadState` 確認�?�??�?��??�?�??�??

## 2026-03-17 確�?�?�?反�?��?�?��?��?�?��?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?��?�??�?��?��??�??で確�?�?�?�?��?�?�?��?��?��?�と�??�?結�?のみ�??反�?��?�?�??
- �?��?��??編�??�?�追�?��?�?は�?�?��?�?��?�?��?��?�のみに�?��?�?�?�??

### 現�?�の�?��??
- �?��?�?�?��?��?��?�
  - Cursorは編�??�?��?��?��?�?�
  - �?�?はCursorに�??�??�?な�?
  - �?�?系はGPT�?�?��?PowerShell�?��??�?��??�??�?��?��?��?��?貼って�?�?�?�??
  - `1�?話 = 1役�?�`
  - �?��?��?��??�?��?��??�?き�?�?�??�?�EOFっぽ�?崩�??�?��?��??�??混�?��?��?き�?�?�?�?��?�?��?�??その�?�?は破�?�?て�?��?��?��??�??�??�?に�?�??
- �??�?結�?�?確�?�?
  - windowHandles �?�?� compare で差�??�?�??
  - withWindowHandlesProbe:
    - `runType = mixed_webdriver_error`
    - `webdriverError2 = invalid session id`
    - `windowHandlesSucceeded = true`
    - `windowHandlesCount = 1`
  - withoutWindowHandlesProbe:
    - `runType = timeout_only`
    - `webdriverError2 = null`
  - 現�??�?�の�??�??�??仮説は�?�windowHandles �?�?�? invalid session id 側の表面�??に強く�?��?�?て�?�??�?と

## 2026-03-17 Cursor�?�?��?��?��?��?��?�?編�??/�?��?��?�?��?�?commit: pending�?

### �?�?��??っ�?�?と
- �?��??�?�?��?�の Cursor �?�?��?��?��?��??確�?�?�?�??
- �?�?系�?? Cursor �?�??�?�?�?�GPT �? PowerShell �?��??�?��??�??提示�?て�?��?��?��?��?�?�?�??�?��?��??�?��?�?�?�??
- 1�?話1役�?�と�?��?��?��?��??�??移�?�??�??�?��?��?��?�ではなく�??�?��?�で�?��?��?�??�?��?�??�?��?�?�?�??

### 現�?�の�?��??
- �?�?は `Cursor=編�??/�?��?��?�?�`�?�`�?�?=GPTのPowerShell�?��??�?��??�?�式` で�?��?��??�??
- 軽�?��?�?��?`status.md` / `handoff.md` 中�?�?は維�?��?�??�??
- �?�?系の崩�??�?�?��?��?��??�?��?��??�?き�?�?�??�?�EOFっぽ�?崩�??�?��?��??�??混�?��?��?き�?�?�?�?��?は Cursor �?�?�設�?で吸�?�?�??�?��?�に�?�?��?�?�??

## 2026-03-17 現�?��?��?�?�?��?��?�?��?��?��??�??反�?��?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?��?��?�?�?�と�??�?結�?�??�?�確認�?�?�??
- �?��?��?�?��?��?��??�??の�?��?�?��?��?��?役�?�/対象�??�?��?��?�/禁止�?�?の3�?�?��?�?�Cursorは編�??�?�?��?��?�?は�?��?��?��?��?�?�?�??�??�??�??�?�?�??
- window compare 系の確�?�?�?�??�?�次�?��?��??�??で修正に�?��?でき�??形に�??�?�?�?�??

### 現�?�の�?��??
- �?��?�?�?�
  - `1�?話 = 1役�?�` �??維�?�
  - Cursor は編�??/�?��?��?�?��?追�?��?�?は�?な�?�?
  - �?�?は GPT �?提示�?�?? PowerShell �?��??�?��??�??�?��?��?��?��?貼�??�?�?�?�?
  - �?��?��?��??�??�??頭は `役�?� / 対象�??�?��?��?� / 禁止�?�?` の3�?�??�?��?
  - �?��?��?�?�は `status.md` / `handoff.md`�?�`PROJECT_STATE.md` / `rules.md` は�?要�??のみ
- �??�?結�?�?確�?�?
  - `repeatCount=10` �?走で�?? `allTimeoutOnly=true`
  - `navigate �?�??/な�?` compare は�?�質差な�?
  - `execute �?�??/な�?` compare は�?��??のみ差�??�?�以�?は�?�?�現�?�?�?�差�??�?�??�?
  - `window probe �?�??/な�?` compare では差�??�?�??
  - `currentWindowHandle` �?�?� compare は1�??差�??�?に�?�?�現で決�?�??ではな�?
  - `windowHandles` �?�?� compare は�??確差�??�?�??
    - with: `runType=mixed_webdriver_error`, `webdriverError2=invalid session id`, `windowHandlesSucceeded=true`, `windowHandlesCount=1`
    - without: `runType=timeout_only`, `webdriverError2=null`
  - 現�??�?�の�??�??�??仮説: `windowHandles` �?�?�? `invalid session id` 側の表面�??に強く�?��?

## 2026-03-17 E2E compare観測�?windowHandles�?�??/な�?�?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�提�??確認
- `.tmp_case_results_compare.json` の `withWindowHandlesProbe` / `withoutWindowHandlesProbe` / `diffSummary` �??確認�?�?��?�??結�??�??�?��?
- �?�??は `stability-test.ps1` �??編�??�?�?�?�追�?�観測�??�?�?��?�?��?�?��?��?�のみに�?��?

### 現�?�の�?��??
- compare �?��??: `.tmp_case_results_compare.json`
- `withWindowHandlesProbe`
  - `runType=mixed_webdriver_error`
  - `webdriverError2="invalid session id"`
  - `windowHandlesSucceeded=true`
  - `windowHandlesCount=1`
- `withoutWindowHandlesProbe`
  - `runType=timeout_only`
  - `webdriverError2=null`
  - `windowHandlesSucceeded=false`
  - `windowHandlesCount=null`
- `diffSummary`
  - `runTypeChanged=true`
  - `webdriverError2Changed=true`
  - `windowHandlesSucceededChanged=true`
  - `windowHandlesCountChanged=true`
- �?�??1�??観測では�?�windowHandles �?�?� compare で mixed 側へ�?�??差�??�??確認

## 2026-03-17 E2E compare観測�?currentWindowHandle�?�??/な�?�?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?�window probe �??解の�?�提�??確認
- `stability-test.ps1` �??�??小差�??で�?��?��?�?�`STABILITY_COMPARE_CURRENT_WINDOW_MODES=1` の compare 軸�?`withCurrentWindowProbe` / `withoutCurrentWindowProbe`�?�??追�?�
- `withCurrentWindowProbe` では currentWindowHandle のみ�?�?�?�?�`withoutCurrentWindowProbe` では window 系 probe �??�?�?�?な�?�??�?に�?�?�?windowHandles probe は�?�??軸に含�?�な�?�?
- compare �??1�??�?�?�?�?�`.tmp_case_results_compare.json` で差�??�??確認

### 現�?�の�?��??
- compare �?��??: `.tmp_case_results_compare.json`
- `withCurrentWindowProbe`
  - `runType=timeout_only`
  - `webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `currentWindowProbeAttempted=true`
  - `currentWindowHandleSucceeded=true`
  - `currentWindowHandleErrorClass=null`
- `withoutCurrentWindowProbe`
  - `runType=mixed_webdriver_error`
  - `webdriverError / webdriverError1 / webdriverError2 = null / null / "invalid session id"`
  - `currentWindowProbeAttempted=false`
  - `currentWindowHandleSucceeded=false`
  - `currentWindowHandleErrorClass=null`
- `diffSummary`
  - `runTypeChanged=true`
  - `webdriverError2Changed=true`
  - `currentWindowHandleSucceededChanged=true`
  - `withCurrentWindowProbeAttempted=true`
  - `withoutCurrentWindowProbeAttempted=false`
- �?�??1�??観測では�?�currentWindowHandle probe �?�?�軸で�?? runType / webdriverError2 に差�??�?�?��?

## 2026-03-17 E2E execute compare�?�現�?�確�?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?�execute compare �?�現確認の�?�提�??確認
- �?��?��??�?�?�な�?で `STABILITY_COMPARE_EXECUTE_MODES=1` �??�?条件で�?��?�?�?追�?�1�??�?
- `.tmp_case_results_compare.json` �?�?? `withExecute` / `withoutExecute` / `diffSummary` �??確認
- �?��??�?��?��??�?��?�??の3�??�??�??並べて�?�現�?��??�?��?�?�?�結�?�??�?��?

### 現�?�の�?��??
- �?�??�?3�??�?��?の compare 結�??
  - `withExecute.runType=timeout_only`
  - `withExecute.webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `withExecute.executeAttempted=true, executeSucceeded=true, executeResult="1", executeErrorClass=null`
  - `withoutExecute.runType=timeout_only`
  - `withoutExecute.webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `withoutExecute.executeAttempted=false, executeSucceeded=false, executeResult=null, executeErrorClass=null`
  - `diffSummary.runTypeChanged=false`
  - `diffSummary.webdriverError2Changed=false`
- 3�??�?��?
  - �?��??: `withoutExecute=mixed_webdriver_error`, `webdriverError2=no such window` �??観測
  - �?��??: 両条件 `timeout_only`�?�?�?�現�?
  - �?�??: 両条件 `timeout_only`�?�?�?�現�?
- 現�??�?�結�?: �?��??差�??は�?��?�?�現�?�?�?��?�?�差�??の可�?��?��?�?�?

## 2026-03-17 E2E execute compare�?�現確認�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�execute compare �?�現確認の�?�提�??確認
- �?��?��??�?�?�な�?で `STABILITY_COMPARE_EXECUTE_MODES=1` �??�?条件�?��?�?
- `.tmp_case_results_compare.json` �??確認�?�?�`withExecute` / `withoutExecute` と `diffSummary` �??�?��??結�??と�?�?
- �?�現�??�?��??�?��?�?�??�?�?��?��?�??結�??�?? status/handoff に�?�?�

### 現�?�の�?��??
- �?�?? compare�?�?��?�?�?では以�?�??確認
  - `withExecute.runType=timeout_only`
  - `withoutExecute.runType=timeout_only`
  - `withExecute.webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `withoutExecute.webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `withExecute.executeAttempted=true, executeSucceeded=true, executeResult="1", executeErrorClass=null`
  - `withoutExecute.executeAttempted=false, executeSucceeded=false, executeResult=null, executeErrorClass=null`
  - `diffSummary.runTypeChanged=false`
  - `diffSummary.webdriverError2Changed=false`
- �?��??観測�?`withoutExecute=mixed_webdriver_error`, `webdriverError2=no such window`�?は�?�??は�?�現�?�?�?��?�?�差�??の可�?��?��??�?�?

## 2026-03-16 E2E compare観測�?�??小execute�?�??/な�?�?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?�timeout_only �?�提の次�??�??�??�?�?��?��??確認
- `stability-test.ps1` の compare �?��?��??�??�??小差�??で�?�張�?�?��?�?軸 `�??小 execute �?�?? / な�?` �??追�?�
- compare は親�?�?�??�?つ�??示�??�?��?��?`STABILITY_COMPARE_EXECUTE_MODES=1`�?�??のみ�??�?�?�??�??�?に�?�?
- �?��? `preUiInitDiagnostic` と�?�?�?�??�?�?�?�?��?`runType`, `webdriverError*`, `hrefBeforeUiInit`, `execute*`�?�??�?�?JSONへ�?��??
- compare �??1�??�?�?�?�?�`.tmp_case_results_compare.json` の結�??�??確認

### 現�?�の�?��??
- compare �?��??: `.tmp_case_results_compare.json`
- `withExecute`:
  - `runType=timeout_only`
  - `webdriverError / webdriverError1 / webdriverError2 = null / null / null`
  - `executeAttempted=true`
  - `executeSucceeded=true`
  - `executeResult="1"`
  - `executeErrorClass=null`
- `withoutExecute`:
  - `runType=mixed_webdriver_error`
  - `webdriverError / webdriverError1 / webdriverError2 = null / null / "no such window"`
  - `executeAttempted=false`
  - `executeSucceeded=false`
  - `executeResult=null`
  - `executeErrorClass=null`
- 差�??要�?は `runTypeChanged=true` と `webdriverError2Changed=true` �??確認

## 2026-03-16 E2E compare観測�?navigate�?�??/な�?�?�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?�?�timeout_only �?�提の次�??�??�??�?�?��?��??確認
- `stability-test.ps1` に�??小差�??で compare �?��?��??�??追�?��?親�?�? + �??示�??�?��?��??のみ�?
- �?�?軸�?? `navigate �?�?? / な�?` の1条件に�?��?�?�?��?��? `preUiInitDiagnostic` �?系統�?�?��??�?��?
- 追�?�結�??�?? `.tmp_case_results_compare.json` に�?��??�?�?��?��? `.tmp_case_results.json` �?�?��??維�?�
- compare �?�?�?て `withNavigate` / `withoutNavigate` の両条件�??�?�?

### 現�?�の�?��??
- compare �?��??: `.tmp_case_results_compare.json`
- `withNavigate`:
  - `runType=timeout_only`
  - `webdriverError / webdriverError1 / webdriverError2 = null`
  - `navigateAttempted=true`
  - `navigateHttpStatus=0`
  - `navigateErrorClass=timeout`
- `withoutNavigate`:
  - `runType=timeout_only`
  - `webdriverError / webdriverError1 / webdriverError2 = null`
  - `navigateAttempted=false`
  - `navigateHttpStatus=null`
  - `navigateErrorClass=skipped-by-compare`
- 差�??要�?は `navigateErrorClassChanged=true`�?�そ�??以�?�?runType / webdriverError系 / hrefBeforeUiInit�?は差�??な�?

## 2026-03-16 E2E repeat観測�?��?�??�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�提�??確認
- `.tmp_case_results_repeat.json` の�?��?結�??�??�?�?��?�?�`repeatCount=10` 観測�??�?�確認
- 追�?��?�?�?��?��?��??�?�?�は�?�?��?�?��?��?観測結�??の�?��?�??のみ�?�?�
- `repeatCount=10` �?走�?�`allTimeoutOnly=true`�?�mixed�?��?��??�??次の�??�??�??�?�?�提と�?て�?��?

### 現�?�の�?��??
- �?��?repeat結�??は `repeatCount=10`�?�?走�?み�?
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=10`
- `allTimeoutOnly=true`
- �?�runで `runType=timeout_only`�?`preUiInitDiagnostic.runType` �?��?�?
- `webdriverError / webdriverError1 / webdriverError2` は�?�runで `null`
- �?条件の観測では主�?�は timeout_only 側に�?って�?�??�?�提で次の�??�??�??�?へ�?��??

## 2026-03-16 E2E repeat観測�?��?�4�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�提�??確認
- `stability-test.ps1` の repeat�?�?�?`STABILITY_REPEAT_COUNT` と `.tmp_case_results_repeat.json` �??�?�?�??�?�確認
- �?��?��??�?�?�な�?で `STABILITY_REPEAT_COUNT=10` �??�?��?�?
- �?�?結�??�??�??�?走 / 中�?��?�で�?��?�?�?��?�??は�?走�??確認�?中�?�な�?�?
- `.tmp_case_results_repeat.json` の�?��?��??確認�?`generatedAt` �?��?��?�??�?

### 現�?�の�?��??
- �??�?�repeat結�??は `repeatCount=10`
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=10`
- `allTimeoutOnly=true`
- `runIndex=1..10` は�?べて `runType=timeout_only`�?`preUiInitDiagnostic.runType` �?��?�?
- `webdriverError / webdriverError1 / webdriverError2` は�?�runで `null`
- `mixed_webdriver_error` の�?��??観測runは�?��?�?�
- �?�??の10�??�?�?は�?走�?み�?summary �?��?��?�??�?

## 2026-03-16 E2E repeat観測�?��?�3�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�提�??確認
- `stability-test.ps1` の repeat�?�?�?`STABILITY_REPEAT_COUNT` と `.tmp_case_results_repeat.json` �??�?�?�??�?�確認
- �?��?��??�?�?�な�?で `STABILITY_REPEAT_COUNT=8` �??�?�?
- `.tmp_case_results_repeat.json` の `runs` �?? run�?位で確認

### 現�?�の�?��??
- �??�?�repeat結�??は `repeatCount=8`
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=8`
- `allTimeoutOnly=true`
- `runIndex=1..8` は�?べて `runType=timeout_only`�?`preUiInitDiagnostic.runType` �?��?�?
- `webdriverError / webdriverError1 / webdriverError2` は�?�runで `null`
- `mixed_webdriver_error` の�?��??観測runは�?��?�?�

## 2026-03-16 E2E repeat観測�?��?�2�?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??�?�読�?て�?�提�??確認
- `stability-test.ps1` の repeat�?�?�?`STABILITY_REPEAT_COUNT` で�??�?��??�?�?�`runs` �??�?�?? `.tmp_case_results_repeat.json` に�?��??�?�??�?�確認
- �?��?��??�?�?�な�?で `STABILITY_REPEAT_COUNT=5` �??�?�?
- �?�?�?に `.tmp_case_results_repeat.json` �??確認�?�?�run�?位の `runType` / `webdriverError*` �??確認

### 現�?�の�?��??
- �??�?�repeat結�??は `repeatCount=5`
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=5`
- `allTimeoutOnly=true`
- `runIndex=1..5` は�?べて `runType=timeout_only`�?`preUiInitDiagnostic.runType` �?��?�?
- `webdriverError / webdriverError1 / webdriverError2` は�?�runで `null`
- `mixed_webdriver_error` の�?��??観測runは�?��?�?�

## 2026-03-16 E2E repeat観測�?��?��?commit: pending�?

### �?�?��??っ�?�?と
- `status.md` / `handoff.md` �??読み�?�repeat観測の�?�提�??�?�確認
- `stability-test.ps1` の�?��?repeat�?��??�??�?��?`STABILITY_REPEAT_COUNT`�?�??�?��?��??�?�?�な�?で�?��?�?
- `STABILITY_REPEAT_COUNT=1 -> 2 -> 3` �??段�??�?�?�?�?��?�??で `.tmp_case_results_repeat.json` �??確認
- `STABILITY_REPEAT_COUNT=10` は�?��??�??�?止�?��?の�?�?��??中中�?��?観測�?��??で�?走可�?�な段�??�?�に�??�?��?
- �?段�??で `mixedWebdriverErrorDetected` / `mixedCount` / `timeoutOnlyCount` / `allTimeoutOnly` �??確認

### 現�?�の�?��??
- �??�?�repeat結�??は `repeatCount=3`
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=3`
- `allTimeoutOnly=true`
- �?�runで `runType=timeout_only`�?�`webdriverError / webdriverError1 / webdriverError2` は�?べて `null`
- 現�??�?�では `mixed_webdriver_error` の�?��??観測runは�?��?�?�

## 2026-03-13 E2E repeat�?��?�?証�?commit: 7c978fb�?

### �?�?��??っ�?�?と
- `stability-test.ps1` の�?��?repeat�?��??�??�?��??�?��?�?�?�?�`.tmp_case_results_repeat.json` の�?��??�?��??確認
- `mixedWebdriverErrorDetected` / `mixedCount` / `timeoutOnlyCount` / `allTimeoutOnly` �??�?�確認
- `preUiInitDiagnostic.runType` と `webdriverError*` の対�?�??run�?位で確認�?�?�runで `timeout_only`�?
- repeat�?�?��??�?�?�??調�?��?�??�?く�?�??�?�?��?�`STABILITY_REPEAT_COUNT` 読み�?�??�??�??小差�??で追�?�

### 現�?�の�?��??
- �??�?�repeat結�??は `repeatCount=5`
- `mixedWebdriverErrorDetected=false`
- `mixedCount=0`
- `timeoutOnlyCount=5`
- `allTimeoutOnly=true`
- 現�??�?�では `mixed_webdriver_error` は�?��?�現で�?�観測結�??は all timeout_only �?�?
- `runType` �?��?�?�?�?webdriverError系�?空な�?? `timeout_only`�?��?空�?�?�??ば `mixed_webdriver_error`�?は維�?��?み

### 次に�??�??�?と
- `STABILITY_REPEAT_COUNT` �??使って追�?�試�?�??�?�?�?�?�`mixedWebdriverErrorDetected=true` run の�?��??観測�??�?��??�?�??
- mixed�?��??�??に該�?runの `preUiInitDiagnostic.runType=mixed_webdriver_error` �??�?��?確認�?�??

## 2026-03-12 E2E�??�??�??�?�?��?��?commit: 5bea800�?

### �?�?��??っ�?�?と
- `stability-test.ps1` のみ�??�?�?�?��?��?�?�E2E の UI init timeout / `data:,` �?��?の�??�??�??�?�??�?��?��?
- `Open-PageWithRetry` �?��?で `url / window / handles` �??�?��?でき�??�??�?に�?�?
- navigate �?�び�?��?�?? curl �??�?��?�で�?��?�?��?�?�?�`HTTP status / response body / stderr summary` �??�?�?でき�??�??�?に�?�?
- �?�?結�??と�?て�?�`POST /session/{id}/url` の�?�?�?主�?��? timeout 系で�?�??�?と�??確認�?�?
- commit: `5bea800` まで反�?��?み

### 現�?�の�?��??
- �?�?�?��?��?��?��?��?�?�??�??�?��?��?�は�?�?
- 現�?�は�?�??�??岐�?�張�??�?��?��?�に�?��??�?�の E2E 起�??不�?��??�??�??�?中
- engine �?��?ではなく `stability-test.ps1` 側の browser / navigate 起�??不�?��?主対象
- �??�??�??は�??navigate �?�は window �?��?�?�??�?�`POST /session/{id}/url` の timeout �?に window �?失�?��?て�?く�?��??�?��?��?�
- `downstream_contract.cases` までは�?��?��?
- `threeway_2light_plus_2outlets` の observed edgeCount / roleSet は�?��?�?の�?�?��?�`expectedEdgeCount=11` は�?��?��?

### �?��?��??っ�?�?と
- wiring-diagram.js: �??�??表示の�?��?��?�??�?LABEL_JA追�?��?
- ui-panel.js: �?UI �?? hidden UI �?�??�?��?の3路選�??強�??
- Dev表示�??�??詳細表示�?�に�?�?�
- dev�?��?��??�??�?��?�と�??�??�?�?み�?��?��??は�?��?�?�?�??�?�確認

### 現�?�の�?��??
- UI�?��?�??�?��?��?��?�?
- �??�??�?��?表示の�?��?��?�??�?�?
- �?UI �?? hidden UI �?�??�?��?強�??�?
- commit / push �?�?
- commit: `108107e`

### 次に�??�??�?と
- �?�?で3路選�?? �?? �?� / 材�?? / 3C反�?�の確認
- �?要な�?? ui-panel.js の�?�??�?��?�??微調�?�
- wiring-diagram.js の�?��?��?表示漏�??�??�?確認

### �??�?��?��?��?�
- 1�??�?��?��?��?�?�
- �??小差�??
- �?��?�?��?��??�?�破�?禁止
- commit / push �?�?
- �?��?��?��?��?�?�は�?��?

---

## 現�?�の�?��?

### �?��?��?��?��??�?設AI
- �??�?��?��?�で�??�?確認�?み
- �?��??�??対�?�?み
- �?��?結�?? / �?��?�?��?��?? / 建�?干�?�?��?��??�?� / 結�?注�?� / 現場�??�?�注�?� �??�?�?�?み
- 簡�??�?�工�?��??箱�??�??�?��?�で表示でき�??�?��??

### 3路�?��?��??�?�AI
- �?��??�?�?�?み
- threeway-switch.html / css / js �?�?��?み
- �?��??�?��??9�?�?��??�?�?�?み�?�?��?結�??�??現場�??�?��?
- �?�?は�??�?�??�? / 渡�??�? / �?要�?��?��?�の�?解�?�?��??強�??�?�?

### �?��?��?��?��?�?��??路AI
- �?��?�??
- �?�?�?�?�?�?

---

## 現�?�の�?��??�?位

1. 建�?干�?�?��?��??�?�
2. �?��?�?��?��??�?��?�
3. 結�?�?��?��?��??
4. �??路�?��?�
5. 材�??�?��?
6. �?積�??は�?�??�?

---

## 次に�??�??�?と

- 3路�?��?��??�?�AIの�?��?�??�?�?�?��??
- �?�??�? / 渡�??�? / �?要�?��?�の�?解�?�?�強�??
- �?��?��?��?��??�?設AIと3路�?��?��??�?�AIの�?�?�?��?
- �??�??�??�?�??�?AIに遷移�?�??�?く�?�??

---

## 現�?�の�?足課�?

- �?��?��?��?��??�?設AIと3路�?��?��??�?�AIは�?��??�?��?�で�??�?中
- �??�??�??�?�?�?�?��?遷移�?は�?��?��?
- 次�??は�?�?�?��?と3路の説�??強�??�??�?��??

---

# AI�?��?�?�工�?��?��?��?��?��?? �?��??

## �?��?��?��?��?�?�

parser
�??
groups
�??
circuits
�??
connectionPoints
�??
sleeveResults
�??
graph
�??
layout
�??
wirePaths
�??
SVG

---

## �?�?�?み�?�?�

�?�現場�??章解�?�
�?�試�?式�?�?�?��??�?�
�?��??路�?覧
�?�材�??�?覧
�?��??路�?�材�??�?覧
�?��?��?��?��??�?��?
�?��?��?�?�表示
�?��?��??�??�??適�??

�?�connectionPoints editor
�?��?��?�追�?�UI
�?�connectionPoint type�?��?
�?�connectionPoints trunk route preview
�?�connectionPoints route reorder
�?�branch device preview
�?�connectionPoint height profile preview
�?�trunk segment distance editor

---

## AI diagram �?��?��??

preview
enhanced
exam_style�?default�?

preview / enhanced
developer mode

---

## MVP�?��??

AIに�??�??�??路解�?��?�??

�?�?�?�
材�??
�?��?��?��??
�?��?�?�

まで�?��??�??�?�可�?��??

�?�??に

�?��?�?�編�??
幹�?�?��?��??
�?��?��?
�?�?�??報
横距�?�

�??�?��?�?�工�?��??�?��??�?��??�?�?�??

現�?�は

�??�?��?�?��?��??AI�?�
の�?��?�?�?�まで�?��?�??

---

# AI�?��?�?�工�?��?��?��?��?��?? �?��??

## �?��?��?��?��?�?�

parser
�??
groups
�??
circuits
�??
connectionPoints
�??
sleeveResults
�??
graph
�??
layout
�??
wirePaths
�??
SVG

## �?�?�?み�?�?�

�?�現場�??章解�?�  
�?�試�?式�?�?�?��??�?�  
�?��??路�?覧  
�?�材�??�?覧  
�?��??路�?�材�??�?覧  
�?��?��?��?��??�?��?  
�?��?��?�?��??�?�  
�?��?��?�?�表示  
�?��?��?�?�編�??�?�?��?�追�?��?  
�?��?��?�?�並び�?��?  
�?��?��?�?��?�表示  
�?��?��?�?��?�?表示  
�?�幹�?距�?�編�??  
�?��?��?��?�?編�??  
�?��??路�?�?設�?�?�??�?��?��?ち�?�?�?�? / �?�?��?  
�?�3D�?��?�?��?�?�?  
�?��?��?材�??�?��?�?�?  

## AI diagram �?��?��??

preview  
enhanced  
exam_style�?default�?

preview / enhanced は developer mode

## MVP�?��??

AI解�?��?�??

�??路�??�?�  
�?��?�?��??�?�  
3D�?��?�?��?�?�?  
材�??�?��?�?�?  

まで�?�?�?み

�?��??�??現場�??�?��?�と�?て�?��?��?�?�は�?��?

現�?�は

�?��?�?�中�?の�?�工�?��??�?�

と�?て�??�?

---

## 2026-03-08

### 修正�?�?

3路�??路�??�?�の不�?��?�??修正

修正�??容

�?�UI �?? legacy�?�??のchange dispatch追�?�  
�?�threeway group�??�?�修正  
�?�parseGroupsFromDom() の switchType復�??  

結�??

�?�3路�?�?�?��??�?� 正常  
�?�VVF1.6-3C 材�??�??�?� 正常  
�?�UI�?�?? 正常  

### 注�?�

現�?�の材�??�?覧は

簡�?�材�??�?�?

で�?�??

�?��??材�??�?�?�?現場�?��?

は�?��?�?�??

---

## �??�?��??

以�?�??�?�?確認

3路選�??
�??
�??�?�

確認

�?��?�?�?��?3路  
�?�VVF1.6-3C �?��??  
�?��?��?��??�?�(3路) �?��??  

---

## �?業�?��?�

�?�2026-03-08 �?業�?�?�??�?��??

�?��?��??っ�?�?と
�?�3路�??�?��?��?�修正
�?�材�??�??�?��?��?�修正
�?�UI�?�??確認

現�?�の�?��??
�?�3路�??�?�正常
�?�材�??�??�?�正常

次�??�??�??�?と
�?�材�??�?��?��?��?��?��??
�?��??岐�?��?��??�?�設�?

---

## 2026-03-08

### Engine Layer 保護追�?�

rules.md に Engine Layer 保護�?��?��?��??追�?��??

�??容

UI Layer
Engine Layer
Render Layer

3層�?�?��??�??確�??�??

Engine Layer

parser
groups
circuits
connectionPoints
graph

は

�??�??�?�?�禁止�??

--------------------------------

現�?�の�?��??

�?��?�?�?��??�?� 正常  
�?�3路�??路�??�?� 正常  
�?�材�??�??�?��?簡�?��??�? 正常  
�?�UI�?�?? 正常  

--------------------------------

�??�?��??�?��?��?�

�??�?��?��?�1

�?�?�?��?��?��?��?��?�?�??

--------------------------------

次の�??�?�

�?��?�?�?��??�?��??�?��??�?��?��?��?�?  
�?��??路�??�?��?��?��?�?�??  

--------------------------------

## �??�?��??

status.md �?��?�のみ

--------------------------------

## �?業�?��?�

�?�2026-03-08 �?業�?�?�??�?��??

�?��?��??っ�?�?と

�?�3路�??路修正
�?�材�??�??�?�修正
�?�Engine Layer 保護追�?�

現�?�の�?��??

�?��?�?�?��??�?�正常

次�??�??�??�?と

�?��?�?�?��?��?��?��?��?�?�??

---

## 2026-03-09 Debug Session

### 確認�?み

ChromeDriver version = Chrome version
execute endpoint = /session/{id}/execute/sync
payload = {"script":"return 1;","args":[]}

### execute �??�?��??結�??

PowerShell Invoke-RestMethod -> timeout
curl inline JSON -> invalid argument
curl file-based JSON -> timeout

ChromeDriver verbose log:

ExecuteScript ERROR script timeout

### DevTools �?��??

Runtime.enable -> OK
Page.getFrameTree -> OK
execute script -> timeout

### �?��?

execute/sync は ChromeDriver �??�?�で script timeout

parser / UI / engine 層の�?��?ではな�?

## 2026-03-23 �X�V

### ��?�?�?�?�?�?�
- Windows ?��[?J???� GitHub ?F��?�????
- git fetch / git push ?� Windows ?��[?J???�?�?�?�?�?�?m?F
- run-window-handles-only.ps1 ?�?��s?o?H?� DIRECT_TEST / STAGE1?STAGE12 ?�?i?K��?�?�?�
- run-window-handles-only.ps1 ?{?�?�?��s�E?�?���??��E?q?v?�?Z?X?N?��Estdout/stderr ???_?C???N?g?�����?�?�?�?�?�?�?m?F
- stability-test.ps1 ?��s???� Open-PageWithRetry ?�?�?`?�???�?�?�?�?�?�?�?�?�
- stdout / stderr ?S?�?m?F?� page open ?J?n?�?�?� Open-PageWithRetry ?�?�?`?�???�?�?�?�?�?m?F
- ?�?�?�AOpen-PageWithRetry ?�?�?`?�?���?�?�?�?Ői?�?�?��A?���?� probe ?t?@?C???�����?�?_?_?�?ڍs
- �ŐV?� STAGE12 ?��s?�?� stderr ?�?�Astdout ?� page open phase=done ?�?Ői�s�A?�?�?� probeFileExists=False
- stdout ?� e2e-only mode: skip diagnostics and use minimal session ?��o?�?�?�A?���?�?�?�?ϐ??g?ݍ??�?�?� probe �??��??�?o?H?�?�?�?� e2e-only ?o?H?�?�?�?�?�?�?�?\��?��??�?�?�?f
- Claude Code ?�?�???p��?�?�???B?�?�?�?߁A?�?�?� Windows ?� PowerShell ?ōŏ�?m?F?�?p?�

### ?���?̏�?�
- Windows ?��[?J???� git ?͐���
- Claude Code ?�?�?�?�?� push ?�?�?�?�?� 403
- run-window-handles-only.ps1 ?�?�???b?p�[?�?�?�?�?�?�?�
- ?���?�?�?v?_?_?́Astability-test.ps1 ?� probe �??��??�?o?H?�?�?�?�?�?�?�?�?�?ϐ??g?ݍ??�?�
- �ŐV?��s???�:
  - probeScriptRev: STAGE12
  - childLaunchExecuted: True
  - childTimedOut: False
  - probeFileExists: False
  - stdoutTail: step=page open phase=done / e2e-only mode: skip diagnostics and use minimal session / check window handle
  - stderrTail: (empty)
