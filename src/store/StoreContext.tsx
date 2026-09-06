/* ============================================================
   数据层：全局 Store（Context + localStorage 持久化）
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData } from "../types";
import { emptyData, STORE_VERSION } from "../types";
import { uid, nowMs } from "../utils/date";

const STORAGE_KEY = "growth-workbench-data-v1";

export type Mutator<T> = (item: T) => T;

/** 从 AppData 的键提取数组元素类型 */
export type ItemOf<K extends keyof AppData> = AppData[K] extends readonly (infer U)[] ? U : never;
export type NewItemOf<K extends keyof AppData> = Omit<ItemOf<K>, "id" | "createdAt" | "updatedAt">;

interface StoreApi {
  data: AppData;
  /** 通用新增 */
  add: <K extends keyof AppData>(key: K, item: NewItemOf<K>) => void;
  /** 通用更新 */
  update: <K extends keyof AppData>(key: K, id: string, patch: Partial<ItemOf<K>>) => void;
  /** 通用删除 */
  remove: <K extends keyof AppData>(key: K, id: string) => void;
  /** 按回调更新（复杂逻辑用） */
  mutate: <K extends keyof AppData>(key: K, fn: (list: AppData[K]) => AppData[K]) => void;
  /** 重置全部数据 */
  resetAll: () => void;
  /** 导出 JSON */
  exportJson: () => string;
  /** 导入 JSON，返回是否成功 */
  importJson: (json: string) => { ok: boolean; error?: string };
}

const StoreContext = createContext<StoreApi | null>(null);

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.trainings)) {
      return emptyData();
    }
    parsed.version = STORE_VERSION;
    return { ...emptyData(), ...parsed };
  } catch {
    return emptyData();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 存储满等异常忽略
    }
  }, [data]);

  const add = useCallback<StoreApi["add"]>(<K extends keyof AppData>(key: K, item: NewItemOf<K>) => {
    const now = nowMs();
    const entry = { ...(item as object), id: uid(), createdAt: now, updatedAt: now };
    setData((prev) => ({
      ...prev,
      [key]: [entry, ...(prev[key] as unknown as unknown[])] as AppData[K],
    }));
  }, []);

  const update = useCallback<StoreApi["update"]>(<K extends keyof AppData>(key: K, id: string, patch: Partial<ItemOf<K>>) => {
    setData((prev) => {
      const list = prev[key] as unknown as { id: string }[];
      return {
        ...prev,
        [key]: list.map((it) =>
          it.id === id ? { ...it, ...patch, updatedAt: nowMs() } : it
        ),
      } as AppData;
    });
  }, []);

  const remove = useCallback<StoreApi["remove"]>((key, id) => {
    setData((prev) => {
      const list = prev[key] as unknown as { id: string }[];
      return {
        ...prev,
        [key]: list.filter((it) => it.id !== id),
      } as AppData;
    });
  }, []);

  const mutate = useCallback<StoreApi["mutate"]>((key, fn) => {
    setData((prev) => ({ ...prev, [key]: fn(prev[key]) }));
  }, []);

  const resetAll = useCallback(() => {
    setData(emptyData());
  }, []);

  const exportJson = useCallback(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importJson = useCallback<StoreApi["importJson"]>((json) => {
    try {
      const parsed = JSON.parse(json) as AppData;
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.trainings)) {
        return { ok: false, error: "文件格式不正确：缺少 trainings 数据" };
      }
      const merged = { ...emptyData(), ...parsed, version: STORE_VERSION };
      setData(merged);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: `解析失败：${(e as Error).message}` };
    }
  }, []);

  const api = useMemo<StoreApi>(
    () => ({ data, add, update, remove, mutate, resetAll, exportJson, importJson }),
    [data, add, update, remove, mutate, resetAll, exportJson, importJson]
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore 必须在 StoreProvider 内使用");
  return ctx;
}
