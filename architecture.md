# Project Architecture

本プロジェクトは以下の3層構造で設計されている。

UI Layer
Engine Layer
Render Layer

--------------------------------

UI Layer

対象

index.js
ui-panel.js
wiring-diagram.html

役割

ユーザー入力
UI更新

--------------------------------

Engine Layer

対象

parser
groups
circuits
connectionPoints
graph

役割

回路生成ロジック

rules.md により

原則変更禁止

--------------------------------

Render Layer

対象

layout
wirePaths
SVG

役割

配線レイアウト
図面描画

--------------------------------

テスト

新規ドキュメント追加のみ

--------------------------------

作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・Engine Layer 保護ルール追加
・アーキテクチャ定義

現在の状態

・複線図生成正常

次回やること

・複線図エンジン安定化
