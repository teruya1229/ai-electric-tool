import { useMemo, useState } from "react";
import { generateDiagram } from "../generateDiagram";
import { judgeSleeve } from "../judgeSleeve";
import { sampleSingle, sampleThreeWay } from "../samples";
import type { DiagramMode, InputDevice } from "../types";
import { DiagramCanvas } from "../components/DiagramCanvas";

export function WiringDiagramPlayground() {
  const [mode, setMode] = useState<DiagramMode>("exam");
  const [devices, setDevices] = useState<InputDevice[]>(sampleSingle);
  const [sampleName, setSampleName] = useState("片切1灯サンプル");
  const [wire16Count, setWire16Count] = useState(2);
  const [wire20Count, setWire20Count] = useState(0);
  const [wire26Count, setWire26Count] = useState(0);

  const diagram = useMemo(() => generateDiagram(devices, mode), [devices, mode]);
  const sleeve = useMemo(() => judgeSleeve({ wire16Count, wire20Count, wire26Count }), [wire16Count, wire20Count, wire26Count]);

  return (
    <section>
      <h2>複線図生成 playground</h2>
      <div>
        <label>
          表示モード
          <select value={mode} onChange={(e) => setMode(e.target.value as DiagramMode)}>
            <option value="exam">試験モード</option>
            <option value="field">現場モード</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setDevices(sampleSingle);
            setSampleName("片切1灯サンプル");
          }}
        >
          片切1灯サンプル
        </button>
        <button
          type="button"
          onClick={() => {
            setDevices(sampleThreeWay);
            setSampleName("3路1灯サンプル");
          }}
        >
          3路1灯サンプル
        </button>
      </div>

      <h3>グループ化結果</h3>
      <pre>{diagram.groups.length ? JSON.stringify(diagram.groups, null, 2) : "グループ化結果なし"}</pre>
      <h3>警告</h3>
      <pre>{diagram.warnings.join("\n") || "警告なし"}</pre>
      <DiagramCanvas diagram={diagram} />

      <h3>スリーブ判定テスト</h3>
      <div>
        <input type="number" value={wire16Count} onChange={(e) => setWire16Count(Number(e.target.value))} />
        <input type="number" value={wire20Count} onChange={(e) => setWire20Count(Number(e.target.value))} />
        <input type="number" value={wire26Count} onChange={(e) => setWire26Count(Number(e.target.value))} />
      </div>
      <pre>{JSON.stringify(sleeve, null, 2)}</pre>
      <h3>デバッグ情報</h3>
      <pre>{JSON.stringify({ mode, sampleName, devices, diagram }, null, 2)}</pre>
    </section>
  );
}
