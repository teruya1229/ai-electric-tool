# Wiring Engine Test Cases

## TEST1
片切1灯

power → switch → light

期待

switch_single
light


## TEST2
片切2灯

power → switch → light
               → light

期待

switch_single
light ×2


## TEST3
3路1灯

power → switch → switch → light

期待

switch_3way ×2
light


## TEST4
3路2灯

power → switch → switch → light
                        → light

期待

switch_3way ×2
light ×2


## TEST5
コンセント

power → outlet


## TEST6
照明＋コンセント

power → switch → light
power → outlet

--------------------------------

テスト

ドキュメント追加のみ
既存コード変更なし

--------------------------------

作業ログ

【2026-03-08 作業終了時点】

本日やったこと

・3路回路修正
・材料生成修正
・複線図エンジンテストケース追加

現在の状態

・基本回路生成正常

次回やること

・複線図エンジン安定化
