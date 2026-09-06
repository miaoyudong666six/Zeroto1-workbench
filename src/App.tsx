/* ============================================================
   应用外壳：桌面图标侧边导航 + 移动端胶囊导航 + 设置（语言切换）
   ============================================================ */

import { useRef, useState } from "react";
import { StoreProvider, useStore } from "./store/StoreContext";
import { I18nProvider, useI18n } from "./i18n";
import { ALL_NAV, NAV_A, NAV_B, type PageKey } from "./pages/nav";
import { Modal, ConfirmDialog } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Training from "./pages/fitness/Training";
import Diet from "./pages/fitness/Diet";
import Body from "./pages/fitness/Body";
import Todo from "./pages/fitness/Todo";
import Challenge from "./pages/fitness/Challenge";
import Resume from "./pages/career/Resume";
import Interview from "./pages/career/Interview";
import Application from "./pages/career/Application";
import Growth from "./pages/career/Growth";

/** 桌面侧边栏：图标-only 简约风 */
function Sidebar({ page, onNav, onSettings, onData }: {
  page: PageKey;
  onNav: (p: PageKey) => void;
  onSettings: () => void;
  onData: () => void;
}) {
  const { t } = useI18n();
  const iconBtn = (key: PageKey, icon: string, label: string, b?: boolean) => (
    <button
      className={`nav-item-icon ${page === key ? "active" : ""} ${b ? "b" : ""}`}
      onClick={() => onNav(key)}
      title={label}
      aria-label={label}
    >
      <span>{icon}</span>
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-name"><em>Zero</em>to1</div>
      </div>
      <nav className="nav-scroll">
        <div className="nav-icon-group">
          {iconBtn("dashboard", "🏠", t.nav_dashboard)}
        </div>
        <div className="nav-icon-divider" />
        <div className="nav-icon-group">
          {NAV_A.map((n) => iconBtn(n.key, n.icon, n.label))}
        </div>
        <div className="nav-icon-divider" />
        <div className="nav-icon-group">
          {NAV_B.map((n) => iconBtn(n.key, n.icon, n.label, true))}
        </div>
      </nav>
      <div className="sidebar-foot-icon">
        <button
          className={`nav-item-icon ${false ? "active" : ""}`}
          onClick={onSettings}
          title={t.settings}
          aria-label={t.settings}
        >
          <span>⚙️</span>
        </button>
        <button
          className="nav-item-icon"
          onClick={onData}
          title={t.data_manage}
          aria-label={t.data_manage}
        >
          <span>💾</span>
        </button>
      </div>
    </aside>
  );
}

function MobileTop({ page, onSettings }: { page: PageKey; onSettings: () => void }) {
  const { t } = useI18n();
  const current = ALL_NAV.find((n) => n.key === page);
  const label = page === "dashboard"
    ? t.nav_dashboard
    : current?.label ?? t.nav_dashboard;
  return (
    <div className="mobile-topbar">
      <div className="brand-name" style={{ fontSize: 15 }}>
        <em>Zero</em>to1
      </div>
      <div className="flex items-center gap-1">
        <span className="small muted" style={{ marginRight: 4 }}>{label}</span>
        <button
          className="mobile-icon-btn"
          onClick={onSettings}
          title={t.settings}
          aria-label={t.settings}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

/** 移动端深色胶囊导航：4 个主入口 + 更多 */
function MobileNav({ page, onNav, onMore }: { page: PageKey; onNav: (p: PageKey) => void; onMore: () => void }) {
  const { t } = useI18n();
  const items: { key: PageKey; icon: string; label: string }[] = [
    { key: "dashboard", icon: "🏠", label: t.nav_dashboard },
    { key: "training", icon: "🏋️", label: t.nav_training },
    { key: "diet", icon: "🥗", label: t.nav_diet },
    { key: "application", icon: "📮", label: t.nav_application },
  ];
  return (
    <nav className="mobile-nav">
      {items.map((it) => (
        <button key={it.key} className={page === it.key ? "on" : ""} onClick={() => onNav(it.key)}>
          <span className="mn-icon">{it.icon}</span>
          {it.label}
        </button>
      ))}
      <button onClick={onMore}>
        <span className="mn-icon">⋯</span>
        {t.nav_more}
      </button>
    </nav>
  );
}

/** 移动端"更多"底部弹出菜单（全量功能导航 + 设置 + 数据） */
function MoreSheet({ open, page, onNav, onSettings, onData, onClose }: {
  open: boolean;
  page: PageKey;
  onNav: (p: PageKey) => void;
  onSettings: () => void;
  onData: () => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const groups = [
    { label: t.nav_group_a, items: NAV_A },
    { label: t.nav_group_b, items: NAV_B },
  ];
  return (
    <div className={`modal-overlay sheet`} style={{ display: open ? "flex" : "none" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal" style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="modal-head">
          <span className="modal-title">{t.nav_all_features}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: "8px 12px 16px" }}>
          {groups.map((g) => (
            <div key={g.label}>
              <div className="nav-group-label" style={{ padding: "10px 8px 4px" }}>{g.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {g.items.map((n) => (
                  <button
                    key={n.key}
                    className="btn"
                    style={{
                      justifyContent: "flex-start",
                      padding: "10px 14px",
                      borderRadius: 14,
                      background: page === n.key ? "var(--a-soft)" : "var(--surface-2)",
                      color: page === n.key ? "var(--a-strong)" : "var(--ink)",
                    }}
                    onClick={() => { onNav(n.key); onClose(); }}
                  >
                    <span>{n.icon}</span> {n.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            className="btn mt-2"
            style={{ width: "100%", justifyContent: "flex-start", background: "var(--surface-2)", padding: "10px 14px", borderRadius: 14 }}
            onClick={() => { onSettings(); onClose(); }}
          >
            <span>⚙️</span> {t.settings}
          </button>
          <button
            className="btn mt-1"
            style={{ width: "100%", justifyContent: "flex-start", background: "var(--surface-2)", padding: "10px 14px", borderRadius: 14 }}
            onClick={() => { onData(); onClose(); }}
          >
            <span>💾</span> {t.data_manage}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 设置弹窗（语言切换） ---------------- */

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang } = useI18n();
  return (
    <Modal
      open={open}
      title={`⚙️ ${t.settings_title}`}
      onClose={onClose}
      width={420}
      foot={<button className="btn btn-primary" onClick={onClose}>{t.data_done}</button>}
    >
      <div className="field">
        <label>{t.language}</label>
        <div className="seg" style={{ width: "100%" }}>
          <button className={lang === "zh" ? "on" : ""} style={{ flex: 1 }} onClick={() => setLang("zh")}>
            {t.lang_zh}
          </button>
          <button className={lang === "en" ? "on" : ""} style={{ flex: 1 }} onClick={() => setLang("en")}>
            {t.lang_en}
          </button>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          {lang === "zh"
            ? "切换语言后界面立即更新；数据不受影响。"
            : "The interface updates instantly when you switch languages. Your data is unaffected."}
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- 数据管理 ---------------- */

function DataManageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { exportJson, importJson } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const doExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    a.href = url;
    a.download = `zeroto1-backup-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ type: "ok", text: t.data_exported });
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJson(String(reader.result ?? ""));
      setMsg(res.ok
        ? { type: "ok", text: t.data_imported }
        : { type: "err", text: `${t.data_import_failed}: ${res.error ?? ""}` });
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      open={open}
      title={`💾 ${t.data_manage}`}
      onClose={onClose}
      width={480}
      foot={<button className="btn btn-primary" onClick={onClose}>{t.data_done}</button>}
    >
      <p className="small muted" style={{ marginBottom: 14 }}>{t.data_desc}</p>
      {msg && (
        <div className="small" style={{
          padding: "8px 12px", borderRadius: 10, marginBottom: 12,
          background: msg.type === "ok" ? "var(--a-soft)" : "var(--danger-soft)",
          color: msg.type === "ok" ? "var(--a-strong)" : "var(--danger)",
        }}>
          {msg.text}
        </div>
      )}
      <div className="flex gap-1 wrap">
        <button className="btn btn-primary" onClick={doExport}>{t.data_export}</button>
        <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>{t.data_import}</button>
        <ResetButton />
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doImport(f);
          e.target.value = "";
        }}
      />
    </Modal>
  );
}

function ResetButton() {
  const { t } = useI18n();
  const { resetAll } = useStore();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <button className="btn btn-danger-ghost" onClick={() => setConfirmOpen(true)}>{t.data_reset}</button>
      <ConfirmDialog
        open={confirmOpen}
        title={t.data_reset_confirm_title}
        message={t.data_reset_confirm_msg}
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { resetAll(); setConfirmOpen(false); }}
      />
    </>
  );
}

function Shell() {
  const [page, setPage] = useState<PageKey>("dashboard");
  const [dataOpen, setDataOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNav={setPage} />;
      case "training": return <Training />;
      case "diet": return <Diet />;
      case "body": return <Body />;
      case "todo": return <Todo />;
      case "challenge": return <Challenge />;
      case "resume": return <Resume />;
      case "interview": return <Interview />;
      case "application": return <Application />;
      case "growth": return <Growth />;
    }
  };

  return (
    <>
      <Sidebar
        page={page}
        onNav={setPage}
        onSettings={() => setSettingsOpen(true)}
        onData={() => setDataOpen(true)}
      />
      <MobileTop page={page} onSettings={() => setSettingsOpen(true)} />
      <main className="main-area">
        <div className="page" key={page}>{renderPage()}</div>
      </main>
      <MobileNav page={page} onNav={setPage} onMore={() => setMoreOpen(true)} />
      <MoreSheet
        open={moreOpen}
        page={page}
        onNav={setPage}
        onSettings={() => setSettingsOpen(true)}
        onData={() => setDataOpen(true)}
        onClose={() => setMoreOpen(false)}
      />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DataManageModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </I18nProvider>
  );
}
