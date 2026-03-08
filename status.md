# status

## 現在の進捗

### コンセント増設AI
- ブラウザで動作確認済み
- スマホ対応済み
- 判定結果 / 配線ルート / 建築干渉チェック / 結線注意 / 現場ミス注意 を実装済み
- 簡易施工図を箱型フローで表示できる状態

### 3路スイッチAI
- 初期実装済み
- threeway-switch.html / css / js 作成済み
- 初期出力9項目を実装済み（判定結果〜現場ミス）
- 今後は「返り線 / 渡り線 / 必要本数」の理解補助を強化予定

### エアコン専用回路AI
- 未着手
- 今後実装予定

---

## 現在の優先順位

1. 建築干渉チェック
2. 配線ルート判断
3. 結線サポート
4. 回路判断
5. 材料拾い
6. 見積りは後回し

---

## 次にやること

- 3路スイッチAIの初心者向け改善
- 返り線 / 渡り線 / 必要本数の理解補助強化
- コンセント増設AIと3路スイッチAIの導線整理
- トップから各AIに遷移しやすくする

---

## 現在の補足課題

- コンセント増設AIと3路スイッチAIは別ページで動作中
- トップ導線（相互遷移）は未整理
- 次回は導線整理と3路の説明強化を優先

---

# AI電気施工アシスタント 状態

## エンジン構造

parser
↓
groups
↓
circuits
↓
connectionPoints
↓
sleeveResults
↓
graph
↓
layout
↓
wirePaths
↓
SVG

---

## 実装済み機能

・現場文章解析
・試験式複線図生成
・回路一覧
・材料一覧
・回路別材料一覧
・スリーブ判定
・接続点表示
・スマホ最適化

・connectionPoints editor
・器具追加UI
・connectionPoint type判定
・connectionPoints trunk route preview
・connectionPoints route reorder
・branch device preview
・connectionPoint height profile preview
・trunk segment distance editor

---

## AI diagram モード

preview
enhanced
exam_style（default）

preview / enhanced
developer mode

---

## MVP状態

AIによる回路解析から

複線図
材料
スリーブ
接続点

まで自動生成可能。

さらに

接続点編集
幹線ルート
枝配線
高さ情報
横距離

を扱う施工思考モデルを実装。

現在は

「配線ルートAI」
の基礎構造まで到達。
