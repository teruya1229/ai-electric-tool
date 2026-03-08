## TEST1
片切1灯

power → switch → light

期待結果

VVF1.6-2C
スイッチ(片切)

---

## TEST2
3路1灯

power → switch → switch → light

期待結果

VVF1.6-2C
VVF1.6-3C
スイッチ(3路)

---

## TEST3
片切2灯

power → switch → light1
              → light2

期待結果

VVF1.6-2C
スイッチ(片切)

---

## TEST4
コンセント

power → outlet

期待結果

VVF1.6-2C
コンセント

---

## TEST5
3路+コンセント

power → switch → switch → light
power → outlet

期待結果

VVF1.6-2C
VVF1.6-3C
スイッチ(3路)
コンセント

---

## テスト

全パターン生成

複線図
材料

を確認

---

## 作業ログ

【2026-03-08 作業終了時点】

本日やったこと
・3路修正
・材料修正
・テストケース追加

現在の状態
・基本回路生成OK

次回やること
・材料エンジン改善
