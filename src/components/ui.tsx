/* ============================================================
   通用 UI 组件
   ============================================================ */

import { useEffect, type ReactNode } from "react";

/* ---------------- Modal ---------------- */

export function Modal({
  open,
  title,
  onClose,
  children,
  foot,
  width,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  foot?: ReactNode;
  width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

/* ---------------- 表单字段 ---------------- */

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* ---------------- 空状态 ---------------- */

export function Empty({ icon = "🗒️", text }: { icon?: string; text: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

/* ---------------- 分段筛选 ---------------- */

export function Seg<T extends string>({
  options,
  value,
  onChange,
  color = "a",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  color?: "a" | "b";
}) {
  return (
    <div className={`seg ${color === "b" ? "seg-b" : ""}`}>
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- 状态徽标 ---------------- */

export function StatusBadge({ text, tone }: { text: string; tone: "a" | "b" | "warn" | "danger" | "ok" | "neutral" }) {
  const cls = tone === "neutral" ? "badge" : `badge badge-${tone}`;
  return <span className={cls}>{text}</span>;
}

/* ---------------- 确认对话框 ---------------- */

export function ConfirmDialog({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  danger,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      foot={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button
            className={`btn ${danger ? "btn-danger-ghost" : "btn-primary"}`}
            style={danger ? { background: "var(--danger)", color: "#fff" } : undefined}
            onClick={() => { onConfirm(); onCancel(); }}
          >
            {danger ? "确认删除" : "确认"}
          </button>
        </>
      }
    >
      <p style={{ color: "var(--ink-2)", fontSize: 13.5 }}>{message}</p>
    </Modal>
  );
}
