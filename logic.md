## コンセント増設AI 判断ロジック

### 回路判断

以下を確認する

・分電盤の空き
・既設回路の種類
・使用機器
・負荷

判断

新設回路
既設回路分岐
現場確認優先

---

### 配線ルート判断

配線ルートは

「どこから → どこを通って → どこへ」

の形式で整理する。

優先条件

・無理な隠ぺい配線を避ける
・点検口なしは現場確認優先
・他業種干渉を避ける
・施工後トラブルを避ける

---

### 建築干渉チェック

AIは以下を優先チェックする

・天井野縁中央
・梁まわり
・壁中央
・壁下地
・ビス干渉
・点検口なし
・水回り設備配管

---

### 結線注意

特に初心者がミスしやすい

・接地線入れ忘れ
・極性
・専用回路誤分岐
・ジョイント増やしすぎ

---

## 3路スイッチAI 判断ロジック

### 回路の基本構造

3路スイッチは

電源  
↓  
スイッチ1  
↓  
スイッチ2  
↓  
照明

の構造になる。

---

### 必要配線

・電源線  
・渡り線  
・返り線  

を使用する。

---

### 初心者ミス防止

特に注意

・返り線忘れ
・渡り線だけで完結すると誤解
・電源位置の理解不足

---

## AIの基本判断原則

AIは

・安全側判断
・断定しすぎない
・不明情報は現場確認優先

を基本とする。

---

## Engine Logic

1 エンジン処理フロー

parser
↓
groups
↓
circuits
↓
connectionPoints
↓
graph
↓
layout
↓
wirePaths
↓
SVG

実行の起点は2系統ある。

・問題文入力系
parseProblemText()
→ applyParsedResult()
→ devices
→ generateDiagram()（試験式SVG）

・現場シーン入力系
parseFieldSceneText()
→ groups
→ createCircuitsFromGroups()
→ createConnectionPointsFromCircuits()
→ createCircuitGraphFromCircuits()
→ createDiagramLayoutsFromGraphs()
→ createWirePathsFromLayouts()
→ SVG描画

--------------------------------

2 各ステージの役割

parser
入力テキストを正規化し、回路種別・灯数・コンセント数・switchType を判定する。

groups
controlId / label / purpose / switchType / devices(数量) を持つ系統データを確定する。

circuits
group の purpose から lighting / outlet / ac に束ね、回路単位へ再編する。

connectionPoints
各回路から junction・light・outlet などの接続点を展開し、線種情報を付与する。

graph
source/switch/light/outlet ノードと edge(role) を生成し、回路トポロジを固定する。

layout
graph ノードに座標を与え、描画可能な平面配置へ変換する。

wirePaths
layout edge から折れ線 path を生成し、その後 optimize/reduce/select で経路調整する。

SVG
最終 path とノードから preview/enhanced/exam_style を描画する。

--------------------------------

3 現在の依存関係

主依存（現場シーン系）
parser/index.js
→ engine/circuit-engine.js
→ wiring-diagram.js

関数依存（固定チェーン）
createCircuitsFromGroups()
→ createConnectionPointsFromCircuits()
→ createCircuitGraphFromCircuits()
→ createDiagramLayoutsFromGraphs()
→ createWirePathsFromLayouts()

描画依存
wiring-diagram.js の
renderAiDiagramPreview() / renderAiDiagramEnhanced() / renderAiDiagramExamStyle()
が wirePaths と layout を前提に SVG を構築する。

補助依存
createMaterialsFromCircuits() と judgeSleevesFromConnectionPoints() は
circuits / connectionPoints へ依存するため、上流の groups 品質に影響される。

--------------------------------

4 将来壊れやすい箇所

・purpose ベースの回路分類依存
createCircuitsFromGroups() は group.purpose の値に強く依存するため、
purpose 語彙変更で circuits の分割結果が崩れやすい。

・switchType と数量の整合
threeway で light/outlet 数が仕様外になると、
graph / layout / SVG の想定分岐に乗らず表示崩れを起こしやすい。

・wirePaths 後段の最適化連鎖
optimizeWirePaths() → reduceWirePathIntersections() → selectConstraintSafeWirePaths()
は順序依存が強く、1箇所の変更で交差削減や制約維持が破綻しやすい。

・DOM復元経路の groups 推定
parseGroupsFromDom() 経由はテキスト復元（3路判定・label分解）に依存するため、
UI文言変更で groups 構造が崩れるリスクがある。

--------------------------------

重要

Engine Layer は

rules.md により

原則変更禁止

である。

エンジンの仕様変更は
logic.md を更新してから行う。

--------------------------------

## 作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・Engine Layer 保護ルール追加
・エンジン仕様整理

現在の状態

・複線図生成正常

次回やること

・複線図エンジン安定化
