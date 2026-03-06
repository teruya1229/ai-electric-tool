import { useMemo, useState } from "react";
import { generateDiagram } from "../generateDiagram";
import { judgeSleeve } from "../judgeSleeve";
import { sampleSingle, sampleThreeWay } from "../samples";
import type { DiagramMode, InputDevice } from "../types";
import { DiagramCanvas } from "../components/DiagramCanvas";

export function WiringDiagramPlayground() {
  const [mode, setMode] = useState<DiagramMode>("exam");
  const [devices, setDevices] = useState<InputDevice[]>(sampleSingle);
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
          mode
          <select value={mode} onChange={(e) => setMode(e.target.value as DiagramMode)}>
            <option value="exam">exam</option>
            <option value="field">field</option>
          </select>
        </label>
        <button type="button" onClick={() => setDevices(sampleSingle)}>
          片切1灯サンプル
        </button>
        <button type="button" onClick={() => setDevices(sampleThreeWay)}>
          3路1灯サンプル
        </button>
      </div>

      <h3>グループ</h3>
      <pre>{JSON.stringify(diagram.groups, null, 2)}</pre>
      <h3>warnings</h3>
      <pre>{diagram.warnings.join("\n") || "なし"}</pre>
      <DiagramCanvas diagram={diagram} />

      <h3>スリーブ判定</h3>
      <div>
        <input type="number" value={wire16Count} onChange={(e) => setWire16Count(Number(e.target.value))} />
        <input type="number" value={wire20Count} onChange={(e) => setWire20Count(Number(e.target.value))} />
        <input type="number" value={wire26Count} onChange={(e) => setWire26Count(Number(e.target.value))} />
      </div>
      <pre>{JSON.stringify(sleeve, null, 2)}</pre>
    </section>
  );
}
