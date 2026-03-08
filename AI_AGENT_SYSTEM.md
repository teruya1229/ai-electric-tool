# AI Agent System

このプロジェクトは以下のAIで開発する。

・ChatGPT
・Claude
・Cursor AI

すべてのAIはこのファイルを最優先で参照すること。

--------------------------------

## AIの役割

### ChatGPT
・方針整理
・引継ぎ整理
・Cursor用プロンプト作成
・開発判断

### Claude
・設計相談
・構造分析
・原因分析

### Cursor AI
・実装
・修正
・コミット
・プッシュ

--------------------------------

## 回答方針

1. 無駄な説明はしない
2. まず結論を出す
3. 次に実行プロンプトを出す
4. Cursor用プロンプトはそのまま貼れる形式にする
5. 変更は必ず1ファイル単位
6. 既存ロジック破壊を避ける
7. commit / push を含める
8. 危険コマンドは絶対に提案しない
9. 良い提案や必要条件や注意点は最初の回答でまとめて出す
10. 後から「もう一つ」「追加でこれも」は原則しない

--------------------------------

## GPT回答フォーマット

1 現状評価
2 次にやるべき1手
3 Cursorに投げるプロンプト
4 次のステップ

--------------------------------

## Cursor実装報告フォーマット

変更したファイル一覧

追加した関数一覧

修正した内容

影響範囲

受け入れテスト結果

--------------------------------

## Cursor用プロンプト必須項目

変更ファイル
追加関数
仕様
テスト
git
作業ログ

--------------------------------

## 開発原則

・最小差分
・1機能
・1ファイル
・既存ロジック破壊禁止
・不要なリファクタリング禁止

--------------------------------

## 変更禁止関数

generateDiagram()
groupDevicesByControl()
judgeSleeve()

--------------------------------

## 禁止コマンド

rm
del
sudo
git reset --hard
git clean
git checkout -- .
git restore .
git reset --mixed
git reset --soft

--------------------------------

## Allowlistコマンド

git status
git add
git commit
git push
git diff
git log
ls
pwd
Get-ChildItem
Get-Location

--------------------------------

## エンジン構造（変更禁止）

parser
groups
circuits
connectionPoints
graph
layout
wirePaths
SVG

--------------------------------

## 参照ファイル

rules.md
context.md
logic.md
PROJECT_STATE.md

必要に応じて参照すること。

--------------------------------

テスト

新規ドキュメント作成のみ

--------------------------------

git

git status
git add AI_AGENT_SYSTEM.md
git commit -m "docs: add AI agent system"
git push

--------------------------------

作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・AI_AGENT_SYSTEM.md 作成

現在の状態

・AI共通ルール定義完了

次回やること

・PROJECT_STATE.md 作成
