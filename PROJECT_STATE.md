# Project State

プロジェクト名

AI電気施工アシスタント

--------------------------------

## 現在のフェーズ

複線図エンジン安定化

--------------------------------

## 現在の状態

・複線図生成 正常
・3路生成 正常
・材料一覧生成 正常
・UI同期 正常
・Engine Layer 保護ルール追加済み

--------------------------------

## 現在実装済み機能

・複線図生成
・3路生成
・材料一覧生成
・UI同期
・Engine Layer 保護

--------------------------------

## 現在のエンジンパイプライン

AI文章
↓
parser
↓
sceneModel.structured
↓
groups
↓
circuits
↓
materials
↓
回路別材料
↓
graph
↓
layout
↓
wirePaths
↓
wireLength
↓
UI表示
↓
SVG

--------------------------------

## 現在存在するエンジン

parser
circuit-engine
materials-engine
wire-length-engine

--------------------------------

## 現在のUI機能

複線図表示
材料一覧
回路別材料
配線総延長

--------------------------------

## 次にやること

複線図パターンテスト

対象テスト

・片切1灯
・片切2灯
・3路1灯
・3路2灯
・照明＋コンセント
・コンセントのみ

--------------------------------

## 変更禁止関数

generateDiagram()
groupDevicesByControl()
judgeSleeve()

--------------------------------

## エンジン構造

parser
groups
circuits
connectionPoints
graph
layout
wirePaths
SVG

--------------------------------

## 開発ルール要約

・1ファイル変更
・最小差分
・既存ロジック破壊禁止
・commit / push 必須
・危険コマンド禁止

--------------------------------

## 新チャット復元用指示

新しいAIチャットでは最初に以下を実行すること。

AI_AGENT_SYSTEM.md と PROJECT_STATE.md を読んで復元してください。

--------------------------------

テスト

新規ドキュメント作成のみ

--------------------------------

git

git status
git add PROJECT_STATE.md
git commit -m "docs: update project engine state"
git push

--------------------------------

作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・PROJECT_STATE.md をコード状態に合わせて再生成

現在の状態

・GPT / Cursor 状態同期完了

次回やること

・複線図エンジン安定化
