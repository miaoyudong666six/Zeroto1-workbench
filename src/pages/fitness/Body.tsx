/* ============================================================
   身体数据台账：体重 / 体脂 / 睡眠 / 状态备注，周维度回看
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import { today, shortDayWithWeek, rangeOf, inRange, weekRange, friendlyDay } from "../../utils/date";
import type { BodyMetric } from "../../types";

type Period = "day" | "week" | "month";

function BodyForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: BodyMetric | null }) {
  const { add, update } = useStore();
  const [day, setDay] = useState(initial?.day ?? today());
  const [weight, setWeight] = useState<number | "">(initial?.weightKg ?? "");
  const [fat, setFat] = useState<number | "">(initial?.bodyFatPct ?? "");
  const [sleep, setSleep] = useState<number | "">(initial?.sleepHours ?? "");
  const [status, setStatus] = useState(initial?.status ?? "");

  const valid = weight !== "" || fat !== "" || sleep !== "" || status.trim() !== "";

  const submit = () => {
    const payload = {
      day,
      weightKg: weight === "" ? undefined : Number(weight),
      bodyFatPct: fat === "" ? undefined : Number(fat),
      sleepHours: sleep === "" ? undefined : Number(sleep),
      status: status.trim() || undefined,
    };
    if (initial) update("bodyMetrics", initial.id, payload);
    else add("bodyMetrics", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑身体数据" : "新增身体数据"}
      onClose={onClose}
      width={520}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <Field label="日期" required>
        <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
      </Field>
      <div className="form-grid">
        <Field label="体重（kg）">
          <input type="number" step={0.1} min={0} value={weight} placeholder="可选" onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
        <Field label="体脂率（%）">
          <input type="number" step={0.1} min={0} max={60} value={fat} placeholder="可选" onChange={(e) => setFat(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
        <Field label="睡眠时长（小时）">
          <input type="number" step={0.5} min={0} max={16} value={sleep} placeholder="可选" onChange={(e) => setSleep(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
        <Field label="身体状态备注">
          <input value={status} placeholder="如：精神饱满 / 肌肉酸痛" onChange={(e) => setStatus(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/** 极简 SVG 折线图 */
function SparkLine({ data, color = "var(--a)" }: { data: { label: string; value: number | undefined }[]; color?: string }) {
  const points = data.filter((d) => d.value != null) as { label: string; value: number }[];
  if (points.length === 0) return <div className="muted small" style={{ padding: "10px 0" }}>暂无数据</div>;

  const W = 620, H = 120, PAD = 24;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(points.length - 1, 1);
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2);

  const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${PAD},${H - PAD} ${line} ${x(points.length - 1).toFixed(1)},${H - PAD}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r={3} fill={color} />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--ink-3)">{p.label}</text>
          <text x={x(i)} y={y(p.value) - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--ink-2)">
            {p.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Body() {
  const { data, remove } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState(today());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMetric | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const range = useMemo(() => rangeOf(period, anchor), [period, anchor]);
  const records = useMemo(
    () => data.bodyMetrics.filter((r) => inRange(r.day, range)).sort((a, b) => a.day.localeCompare(b.day)),
    [data.bodyMetrics, range]
  );

  // 周维度数据（默认展示：最近有数据的一周 + 未来几天）
  const weekView = useMemo(() => {
    const ref = records.length ? records[records.length - 1].day : today();
    const [monday] = weekRange(ref);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const rec = data.bodyMetrics.find((r) => r.day === ds);
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        weight: rec?.weightKg,
        fat: rec?.bodyFatPct,
        sleep: rec?.sleepHours,
      };
    });
  }, [data.bodyMetrics, records]);

  const latest = records.length ? records[records.length - 1] : null;
  const weekAgo = records[Math.max(records.length - 7, 0)];

  const shift = (n: number) => {
    const d = new Date(anchor);
    if (period === "day") d.setDate(d.getDate() + n);
    else if (period === "week") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    setAnchor(d.toISOString().slice(0, 10));
  };

  const periodLabel =
    period === "day" ? shortDayWithWeek(anchor) :
    period === "week" ? `${range.start.slice(5).replace("-", "/")} — ${range.end.slice(5).replace("-", "/")}` :
    `${anchor.slice(0, 4)} 年 ${Number(anchor.slice(5, 7))} 月`;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">⚖️ {t.body_title}</div>
          <div className="page-sub">{t.body_sub}</div>
        </div>
        <div className="toolbar">
          <Seg<Period>
            options={[{ value: "day", label: t.period_day }, { value: "week", label: t.period_week }, { value: "month", label: t.period_month }]}
            value={period}
            onChange={setPeriod}
          />
          <div className="flex gap-1 items-center">
            <button className="btn btn-ghost btn-sm" onClick={() => shift(-1)}>‹</button>
            <span className="small bold" style={{ minWidth: 110, textAlign: "center" }}>{periodLabel}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => shift(1)}>›</button>
            <button className="btn btn-soft btn-sm" onClick={() => setAnchor(today())}>{t.today}</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setFormOpen(true); }}>{t.body_new}</button>
        </div>
      </div>

      <div className="stat-grid mb-2">
        <div className="stat">
          <div className="k">最新体重</div>
          <div className="v">{latest?.weightKg ?? "—"}<small>kg</small></div>
          <div className="d">
            {latest?.weightKg && weekAgo?.weightKg ? (
              <span className={latest.weightKg <= weekAgo.weightKg ? "" : ""}>
                {latest.weightKg > weekAgo.weightKg ? "↑" : latest.weightKg < weekAgo.weightKg ? "↓" : "="}{" "}
                较 7 天前 {(latest.weightKg - weekAgo.weightKg).toFixed(1)} kg
              </span>
            ) : "记录后可见趋势"}
          </div>
        </div>
        <div className="stat">
          <div className="k">最新体脂</div>
          <div className="v">{latest?.bodyFatPct ?? "—"}<small>%</small></div>
          <div className="d">{latest?.day ? friendlyDay(latest.day) : "暂无记录"}</div>
        </div>
        <div className="stat">
          <div className="k">最近睡眠</div>
          <div className="v">{latest?.sleepHours ?? "—"}<small>时</small></div>
          <div className="d">{latest?.day ? friendlyDay(latest.day) : "暂无记录"}</div>
        </div>
      </div>

      <div className="card mb-2">
        <div className="card-head">
          <span className="card-title">📈 周维度回看（最近数据所在周）</span>
        </div>
        <div style={{ padding: "12px 16px 6px" }}>
          <div className="xs bold muted mb-1">体重 (kg)</div>
          <SparkLine data={weekView.map((d) => ({ label: d.label, value: d.weight }))} />
          <div className="xs bold muted mb-1" style={{ marginTop: 12 }}>体脂率 (%)</div>
          <SparkLine data={weekView.map((d) => ({ label: d.label, value: d.fat }))} color="var(--b)" />
          <div className="xs bold muted mb-1" style={{ marginTop: 12 }}>睡眠时长 (小时)</div>
          <SparkLine data={weekView.map((d) => ({ label: d.label, value: d.sleep }))} color="var(--warn)" />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">📋 记录列表</span>
        </div>
        {records.length === 0 ? (
          <Empty icon="⚖️" text="该区间暂无身体数据，点击「＋ 新增记录」开始记录" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr><th>日期</th><th>体重 kg</th><th>体脂 %</th><th>睡眠 时</th><th>状态备注</th><th></th></tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.day === today() ? "今天" : r.day}</td>
                    <td className="num">{r.weightKg ?? "—"}</td>
                    <td className="num">{r.bodyFatPct ?? "—"}</td>
                    <td className="num">{r.sleepHours ?? "—"}</td>
                    <td className="small muted" style={{ maxWidth: 200 }}>{r.status || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-ghost btn-icon" onClick={() => { setEditing(r); setFormOpen(true); }}>编辑</button>
                        <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(r.id)}>删</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BodyForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
      <ConfirmDialog open={confirmId !== null} title="删除记录" message="删除后不可恢复，确认删除这条身体数据？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("bodyMetrics", confirmId); }} />
    </div>
  );
}
