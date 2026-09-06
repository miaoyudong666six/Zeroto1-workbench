/* ============================================================
   饮食日志：三餐 + 加餐 + 饮水 + 一周饮食汇总
   ============================================================ */

import { useMemo, useState } from "react";
import { useStore } from "../../store/StoreContext";
import { useI18n } from "../../i18n";
import { Modal, Field, Empty, Seg, ConfirmDialog } from "../../components/ui";
import {
  today, nowTimeHM, shortDayWithWeek, weekRange, rangeOf, inRange, friendlyDay,
} from "../../utils/date";
import { MEAL_TYPES, type Meal, type MealType, type FoodItem, type WaterRecord } from "../../types";

type Period = "day" | "week" | "month";

interface MealDraft {
  name: string;
  kcal: number | "";
  qty: string;
}

const emptyFood = (): MealDraft => ({ name: "", kcal: "", qty: "" });

function MealForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: Meal | null }) {
  const { add, update } = useStore();
  const [day, setDay] = useState(initial?.day ?? today());
  const [type, setType] = useState<MealType>(initial?.type ?? "早餐");
  const [time, setTime] = useState(initial?.time ?? nowTimeHM());
  const [foods, setFoods] = useState<MealDraft[]>(
    initial?.foods.map((f) => ({ name: f.name, kcal: f.kcal ?? "", qty: f.qty ?? "" })) ?? [emptyFood()]
  );

  const setF = (i: number, patch: Partial<MealDraft>) =>
    setFoods((l) => l.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const valid = foods.some((f) => f.name.trim());

  const submit = () => {
    const items: FoodItem[] = foods
      .filter((f) => f.name.trim())
      .map((f) => ({ name: f.name.trim(), kcal: f.kcal === "" ? undefined : Number(f.kcal), qty: f.qty.trim() || undefined }));
    const payload = { day, type, time: time || undefined, foods: items };
    if (initial) update("meals", initial.id, payload);
    else add("meals", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑饮食记录" : "新增饮食记录"}
      onClose={onClose}
      width={560}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!valid} onClick={submit}>保存</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="日期" required>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="餐次">
          <div className="seg" style={{ width: "100%" }}>
            {MEAL_TYPES.map((t) => (
              <button key={t} className={type === t ? "on" : ""} style={{ flex: 1 }} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <Field label="进食时间">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>

      <div className="section-divider">食物明细</div>
      {foods.map((f, i) => (
        <div key={i} className="form-grid" style={{ marginBottom: 8 }}>
          <Field label={`食物 ${i + 1}`} required>
            <input placeholder="如：鸡胸肉" value={f.name} onChange={(e) => setF(i, { name: e.target.value })} />
          </Field>
          <Field label="分量">
            <input placeholder="如：150g / 1碗" value={f.qty} onChange={(e) => setF(i, { qty: e.target.value })} />
          </Field>
          <Field label="大概热量 (kcal)">
            <input
              type="number" min={0}
              value={f.kcal}
              placeholder="可选"
              onChange={(e) => setF(i, { kcal: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </Field>
          <Field label=" ">
            <button className="btn btn-danger-ghost" onClick={() => setFoods((l) => l.filter((_, idx) => idx !== i))}>
              ✕ 移除
            </button>
          </Field>
        </div>
      ))}
      <button className="btn btn-soft btn-sm" onClick={() => setFoods((l) => [...l, emptyFood()])}>＋ 添加食物</button>
    </Modal>
  );
}

function WaterForm({ open, onClose, initial }: { open: boolean; onClose: () => void; initial: WaterRecord | null }) {
  const { add, update } = useStore();
  const [day, setDay] = useState(initial?.day ?? today());
  const [ml, setMl] = useState<number | "">(initial?.ml ?? 500);
  const [time, setTime] = useState(initial?.time ?? nowTimeHM());
  const [note, setNote] = useState(initial?.note ?? "");

  const submit = () => {
    const payload = { day, ml: Number(ml) || 0, time: time || undefined, note: note.trim() || undefined };
    if (initial) update("waters", initial.id, payload);
    else add("waters", payload);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={initial ? "编辑饮水记录" : "新增饮水记录"}
      onClose={onClose}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onClose}>取消</button>
          <button className="btn btn-primary" disabled={!ml} onClick={submit}>保存</button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="日期" required>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>
        <Field label="毫升" required>
          <input type="number" min={0} step={50} value={ml} onChange={(e) => setMl(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
      </div>
      <Field label="时间">
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>
      <Field label="备注">
        <input value={note} placeholder="可选" onChange={(e) => setNote(e.target.value)} />
      </Field>
    </Modal>
  );
}

export default function Diet() {
  const { data, remove } = useStore();
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>("week");
  const [anchor, setAnchor] = useState(today());
  const [mealOpen, setMealOpen] = useState(false);
  const [mealEditing, setMealEditing] = useState<Meal | null>(null);
  const [waterOpen, setWaterOpen] = useState(false);
  const [waterEditing, setWaterEditing] = useState<WaterRecord | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmWaterId, setConfirmWaterId] = useState<string | null>(null);

  const range = useMemo(() => rangeOf(period, anchor), [period, anchor]);
  const meals = useMemo(
    () => data.meals.filter((m) => inRange(m.day, range)).sort((a, b) => b.day.localeCompare(a.day)),
    [data.meals, range]
  );
  const waters = useMemo(
    () => data.waters.filter((w) => inRange(w.day, range)).sort((a, b) => b.day.localeCompare(a.day)),
    [data.waters, range]
  );

  const totalKcal = meals.reduce((s, m) => s + m.foods.reduce((a, f) => a + (f.kcal ?? 0), 0), 0);
  const totalWater = waters.reduce((s, w) => s + w.ml, 0);
  const activeDays = new Set(meals.map((m) => m.day)).size;

  // 一周饮食汇总（按日聚合）
  const weekSummary = useMemo(() => {
    if (period !== "week") return null;
    const [monday] = weekRange(anchor);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      const dayMeals = data.meals.filter((m) => m.day === ds);
      return {
        day: ds,
        kcal: dayMeals.reduce((s, m) => s + m.foods.reduce((a, f) => a + (f.kcal ?? 0), 0), 0),
        count: dayMeals.length,
        water: data.waters.filter((w) => w.day === ds).reduce((s, w) => s + w.ml, 0),
      };
    });
    return days;
  }, [data, anchor, period]);

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

  const typeColor = (t: MealType) => (t === "加餐" ? "badge-warn" : "badge-a");

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-title">🥗 {t.diet_title}</div>
          <div className="page-sub">{t.diet_sub}</div>
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
          <button className="btn btn-primary btn-sm" onClick={() => { setMealEditing(null); setMealOpen(true); }}>{t.diet_new_meal}</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setWaterEditing(null); setWaterOpen(true); }}>{t.diet_new_water}</button>
        </div>
      </div>

      <div className="stat-grid mb-2">
        <div className="stat">
          <div className="k">区间总摄入</div>
          <div className="v">{totalKcal}<small>kcal</small></div>
          <div className="d">{meals.length} 餐次 / {activeDays} 天</div>
        </div>
        <div className="stat">
          <div className="k">区间饮水</div>
          <div className="v">{(totalWater / 1000).toFixed(1)}<small>L</small></div>
          <div className="d">{waters.length} 次记录</div>
        </div>
        <div className="stat">
          <div className="k">日均摄入</div>
          <div className="v">{activeDays ? Math.round(totalKcal / activeDays) : 0}<small>kcal</small></div>
          <div className="d">按有记录天数计算</div>
        </div>
      </div>

      {/* 一周饮食汇总 */}
      {weekSummary && (
        <div className="card mb-2">
          <div className="card-head">
            <span className="card-title">📊 一周饮食汇总</span>
          </div>
          <div style={{ overflowX: "auto", padding: "12px 8px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>日期</th>
                  {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((d) => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="bold">摄入 (kcal)</td>
                  {weekSummary.map((d) => (
                    <td key={d.day} className="num">{d.kcal || <span className="muted">—</span>}</td>
                  ))}
                </tr>
                <tr>
                  <td className="bold">餐次</td>
                  {weekSummary.map((d) => (
                    <td key={d.day} className="num">{d.count || <span className="muted">—</span>}</td>
                  ))}
                </tr>
                <tr>
                  <td className="bold">饮水 (L)</td>
                  {weekSummary.map((d) => (
                    <td key={d.day} className="num">{d.water ? (d.water / 1000).toFixed(1) : <span className="muted">—</span>}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-title">🍽️ 饮食记录</span>
        </div>
        {meals.length === 0 ? (
          <Empty icon="🍚" text="该区间暂无饮食记录，点击「＋ 记餐」开始记录" />
        ) : (
          <div className="row-list">
            {meals.map((m) => (
              <div key={m.id} className="row-item">
                <div className="row-main">
                  <div className="flex items-center gap-1" style={{ marginBottom: 2 }}>
                    <span className={`badge ${typeColor(m.type)}`}>{m.type}</span>
                    <span className="xs muted num">{m.day === today() ? "今天" : friendlyDay(m.day)}</span>
                    {m.time && <span className="xs muted num">{m.time}</span>}
                  </div>
                  <div className="small" style={{ color: "var(--ink-2)" }}>
                    {m.foods.map((f, i) => (
                      <span key={i}>
                        {i > 0 && "、"}
                        {f.name}{f.qty && <span className="muted"> ({f.qty})</span>}
                        {f.kcal != null && <span className="num muted"> ~{f.kcal}kcal</span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="row-actions">
                  <span className="num bold" style={{ fontSize: 13, marginRight: 4 }}>
                    {m.foods.reduce((s, f) => s + (f.kcal ?? 0), 0)} kcal
                  </span>
                  <button className="btn btn-ghost btn-icon" onClick={() => { setMealEditing(m); setMealOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmId(m.id)}>删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-2">
        <div className="card-head">
          <span className="card-title">💧 饮水记录</span>
        </div>
        {waters.length === 0 ? (
          <Empty icon="💧" text="该区间暂无饮水记录" />
        ) : (
          <div className="row-list">
            {waters.map((w) => (
              <div key={w.id} className="row-item">
                <div className="row-main">
                  <span className="bold num">{w.ml} ml</span>
                  <span className="xs muted"> · {friendlyDay(w.day)}{w.time && ` ${w.time}`}</span>
                  {w.note && <span className="small muted"> · {w.note}</span>}
                </div>
                <div className="row-actions">
                  <button className="btn btn-ghost btn-icon" onClick={() => { setWaterEditing(w); setWaterOpen(true); }}>编辑</button>
                  <button className="btn btn-danger-ghost btn-icon" onClick={() => setConfirmWaterId(w.id)}>删</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MealForm open={mealOpen} onClose={() => setMealOpen(false)} initial={mealEditing} />
      <WaterForm open={waterOpen} onClose={() => setWaterOpen(false)} initial={waterEditing} />
      <ConfirmDialog open={confirmId !== null} title="删除饮食记录" message="删除后不可恢复，确认删除？" danger
        onCancel={() => setConfirmId(null)} onConfirm={() => { if (confirmId) remove("meals", confirmId); }} />
      <ConfirmDialog open={confirmWaterId !== null} title="删除饮水记录" message="删除后不可恢复，确认删除？" danger
        onCancel={() => setConfirmWaterId(null)} onConfirm={() => { if (confirmWaterId) remove("waters", confirmWaterId); }} />
    </div>
  );
}
