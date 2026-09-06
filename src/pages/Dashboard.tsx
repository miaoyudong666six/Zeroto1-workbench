/* ============================================================
   首页 Dashboard：移动端 App 风格聚合视图（中英文双语）
   ============================================================ */

import { useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { useI18n } from "../i18n";
import type { PageKey } from "./nav";
import {
  today, dayIndexOfWeek,
} from "../utils/date";
import { WEEKDAY_SHORT } from "../types";

function Panel({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card dash-panel">
      <div className="card-head">
        <span className="card-title">
          <span>{icon}</span> {title}
        </span>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function Dashboard({ onNav }: { onNav: (p: PageKey) => void }) {
  const { data } = useStore();
  const { t, lang } = useI18n();
  const t0 = today();

  const info = useMemo(() => {
    const wd = dayIndexOfWeek(t0);
    const dailyTodos = data.todos.filter((x) => x.day === t0 && !x.weekly);
    const weeklyTodos = data.todos.filter((x) => x.weekly && x.weekday === wd);
    const allTodos = [...dailyTodos, ...weeklyTodos];
    const pendingTodos = allTodos.filter((x) => x.status !== "done");
    const doneTodos = allTodos.filter((x) => x.status === "done");

    const todayTraining = data.trainings.find((x) => x.day === t0);
    const todayMeals = data.meals.filter((x) => x.day === t0);
    const todayKcal = todayMeals.reduce(
      (s, m) => s + m.foods.reduce((a, f) => a + (f.kcal ?? 0), 0), 0
    );
    const todayWater = data.waters.filter((x) => x.day === t0).reduce((s, w) => s + w.ml, 0);

    const activeApps = data.applications
      .filter((x) => x.stage !== "结束")
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5);

    const curMonth = t0.slice(0, 7);
    const challenges = data.challenges.filter((c) => c.month === curMonth);

    return { wd, pendingTodos, doneTodos, todayTraining, todayMeals, todayKcal, todayWater, activeApps, challenges };
  }, [data, t0]);

  const totalTodos = info.pendingTodos.length + info.doneTodos.length;
  const donePct = totalTodos ? Math.round((info.doneTodos.length / totalTodos) * 100) : 0;

  const greetText =
    totalTodos === 0
      ? t.home_greet_empty
      : donePct >= 100
      ? t.home_greet_done
      : donePct >= 50
      ? t.home_greet_half
      : t.home_greet_start;

  // 日期格式化
  const dateParts = t0.split("-").map(Number);
  const wdNamesZh = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const wdNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const wdName = lang === "zh" ? wdNamesZh[info.wd] : wdNamesEn[info.wd];
  const heroDate = t.home_date_format(dateParts[1], dateParts[2], wdName);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="hero-date">{heroDate}</div>
        <h1 className="hero-title">{greetText}</h1>
      </div>

      {/* 今日完成度进度卡 */}
      <div className="goal-card mb-2">
        <div className="goal-top">
          <div className="goal-text">
            {totalTodos === 0 ? t.home_no_todo_today : t.home_completed_pct(donePct)}
          </div>
          <button className="btn-circle" onClick={() => onNav("todo")} title={t.nav_todo} aria-label={t.nav_todo}>
            ⚡
          </button>
        </div>
        <div className="goal-bar">
          <div className="progress"><i style={{ width: `${donePct}%` }} /></div>
          <span className="goal-num">{info.doneTodos.length}/{totalTodos || 0}</span>
        </div>
      </div>

      {/* 圆形快捷入口 */}
      <div className="quick-row mb-2">
        <button className="quick-item" onClick={() => onNav("training")}>
          <span className="quick-circle">🏋️</span>
          <span className="quick-label">{t.nav_training}</span>
        </button>
        <button className="quick-item" onClick={() => onNav("diet")}>
          <span className="quick-circle">🥗</span>
          <span className="quick-label">{t.nav_diet}</span>
        </button>
        <button className="quick-item" onClick={() => onNav("diet")}>
          <span className="quick-circle">💧</span>
          <span className="quick-label">{t.home_today_water}</span>
        </button>
        <button className="quick-item" onClick={() => onNav("challenge")}>
          <span className="quick-circle">🎯</span>
          <span className="quick-label">{t.nav_challenge}</span>
        </button>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", margin: "20px 0 10px" }}>
        {t.home_today_overview}
      </h2>
      <div className="stat-grid mb-2">
        <div className="stat">
          <div className="k">{t.home_today_intake}</div>
          <div className="v">{info.todayKcal}<small>{t.home_kcal}</small></div>
          <div className="d">{t.home_meal_count(info.todayMeals.length)}</div>
        </div>
        <div className="stat">
          <div className="k">{t.home_today_water}</div>
          <div className="v">{(info.todayWater / 1000).toFixed(1)}<small>{t.home_l}</small></div>
          <div className="d">{t.home_water_target}</div>
        </div>
        <div className="stat">
          <div className="k">{t.home_today_training}</div>
          <div className="v">
            {info.todayTraining ? info.todayTraining.durationMin : 0}<small>{t.home_min}</small>
          </div>
          <div className="d">{info.todayTraining ? t.home_trained : t.home_not_trained}</div>
        </div>
        <div className="stat">
          <div className="k">{t.home_today_apps}</div>
          <div className="v">{t.home_units(info.activeApps.length)}</div>
          <div className="d">{t.home_pending_apps}</div>
        </div>
      </div>

      <div className="dash-grid mt-2">
        <Panel
          title={t.home_today_todo}
          icon="✅"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("todo")}>{t.home_all} ›</button>}
        >
          {info.pendingTodos.length === 0 && info.doneTodos.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">🌤️</div>
              <p>{t.home_no_todo_relax}</p>
            </div>
          ) : (
            <div className="mini-list">
              {[...info.pendingTodos, ...info.doneTodos.slice(0, 3)].map((td) => (
                <div key={td.id} className={`mini-item ${td.status === "done" ? "done" : ""}`}>
                  <span>{td.status === "done" ? "☑️" : td.weekly ? "🔁" : "☐"}</span>
                  <span className="m-title">{td.title}</span>
                  {td.weekly && <span className="m-tag badge badge-a">{t.home_weekly}</span>}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t.home_today_diet}
          icon="🥗"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("diet")}>{t.home_log} ›</button>}
        >
          {info.todayMeals.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">🍚</div>
              <p>{t.home_no_diet}</p>
              <button className="btn btn-primary btn-sm mt-1" onClick={() => onNav("diet")}>{t.home_go_record}</button>
            </div>
          ) : (
            <div className="mini-list">
              {info.todayMeals.map((m) => (
                <div key={m.id} className="mini-item">
                  <span className="badge badge-a" style={{ flexShrink: 0 }}>{m.type}</span>
                  <span className="m-title">{m.foods.map((f) => f.name).join("、") || "—"}</span>
                  <span className="m-tag num">{m.foods.reduce((s, f) => s + (f.kcal ?? 0), 0)} {t.home_kcal}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t.home_today_apps_panel}
          icon="📮"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("application")}>{t.home_review} ›</button>}
        >
          {info.activeApps.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">🚀</div>
              <p>{t.home_no_apps}</p>
              <button className="btn btn-blue btn-sm mt-1" onClick={() => onNav("application")}>{t.home_add_apply}</button>
            </div>
          ) : (
            <div className="mini-list">
              {info.activeApps.map((a) => {
                const stageLabel =
                  a.stage === "已投递" ? t.app_stage_applied :
                  a.stage === "笔试" ? t.app_stage_written :
                  a.stage === "面试" ? t.app_stage_interview :
                  a.stage === "Offer" ? t.app_stage_offer : t.app_stage_closed;
                return (
                  <div key={a.id} className="mini-item">
                    <span className="m-title">
                      <b>{a.company}</b> · {a.position}
                    </span>
                    <span className={`badge ${a.stage === "Offer" ? "badge-ok" : a.stage === "面试" ? "badge-b" : "badge-warn"}`}>
                      {stageLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title={t.home_weekly_training}
          icon="📅"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("training")}>{t.home_plan} ›</button>}
        >
          {data.weeklyPlans.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">🗓️</div>
              <p>{t.home_no_plan}</p>
              <button className="btn btn-primary btn-sm mt-1" onClick={() => onNav("training")}>{t.home_go_set}</button>
            </div>
          ) : (
            <div className="mini-list">
              {data.weeklyPlans.map((p) => (
                <div key={p.id} className="mini-item">
                  <span className="m-title bold">{p.name}</span>
                  <span className="m-tag">
                    {[0, 1, 2, 3, 4, 5, 6].filter((d) => p.schedule[d]).map((d) => WEEKDAY_SHORT[d]).join("·") || t.home_unscheduled}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t.home_monthly_challenge}
          icon="🎯"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("challenge")}>{t.home_challenge} ›</button>}
        >
          {info.challenges.length === 0 ? (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">🏁</div>
              <p>{t.home_no_challenge}</p>
              <button className="btn btn-primary btn-sm mt-1" onClick={() => onNav("challenge")}>{t.home_create_challenge}</button>
            </div>
          ) : (
            <div className="mini-list">
              {info.challenges.map((c) => (
                <div key={c.id} className="mini-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  <div className="flex between items-center">
                    <span className="m-title bold">{c.title}</span>
                    <span className="num bold" style={{ color: "var(--a-strong)" }}>{c.progress}%</span>
                  </div>
                  <div className="progress progress-dark"><i style={{ width: `${c.progress}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={t.home_today_training_panel}
          icon="🏋️"
          action={<button className="btn btn-soft btn-sm" onClick={() => onNav("training")}>{t.home_record} ›</button>}
        >
          {info.todayTraining ? (
            <div style={{ padding: "14px 16px" }}>
              <div className="bold" style={{ fontSize: 13.5 }}>{info.todayTraining.durationMin} {t.home_min}</div>
              <div className="mt-1 flex gap-1 wrap">
                {info.todayTraining.exercises.slice(0, 6).map((ex, i) => (
                  <span key={i} className="badge badge-a">{ex.name}</span>
                ))}
              </div>
              {info.todayTraining.feeling && (
                <div className="muted small mt-1">{t.home_feeling}: {info.todayTraining.feeling}</div>
              )}
            </div>
          ) : (
            <div className="empty" style={{ padding: "28px 16px" }}>
              <div className="empty-icon">💪</div>
              <p>{t.home_no_training}</p>
              <button className="btn btn-primary btn-sm mt-1" onClick={() => onNav("training")}>{t.home_go_record}</button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
