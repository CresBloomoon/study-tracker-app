"use client";

import { useEffect, useMemo, useState } from "react";
import UiCheckbox from "@/components/ui/UiCheckbox";
import {
  Reminder,
  listReminders,
  createReminder,
  markDone,
  markUndone,
} from "@/lib/ui/remindersApi";
import { jstDateKeyOf } from "@/lib/ui/jstDate";

type SideFilter = "today" | "all" | "done";

export default function RemindersPanel() {
  const [side, setSide] = useState<SideFilter>("today");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [openList, setOpenList] = useState<Reminder[]>([]);
  const [doneList, setDoneList] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );

  // debounce for search
  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search), 150);
    return () => window.clearTimeout(t);
  }, [search]);

  // ESC to close create sheet
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowCreate(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      // status=open のときだけサーバーが「今日期限を先頭に」ソートし isOverdue を付与する（Step3）。
      // status=all で一括取得すると isOverdue が乗らないため、open/doneを別々に取得する。
      const [open, done] = await Promise.all([
        listReminders("open"),
        listReminders("done"),
      ]);
      setOpenList(open);
      setDoneList(done);
    } catch (e: any) {
      setErr(e?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const todayKey = useMemo(() => jstDateKeyOf(new Date()), []);

  const counts = useMemo(
    () => ({
      today: openList.filter((r) => jstDateKeyOf(new Date(r.dueAt)) === todayKey).length,
      all: openList.length + doneList.length,
      done: doneList.length,
    }),
    [openList, doneList, todayKey]
  );

  const items: Reminder[] = useMemo(() => {
    if (side === "done") return doneList;
    if (side === "all") return [...openList, ...doneList];
    return openList.filter((r) => jstDateKeyOf(new Date(r.dueAt)) === todayKey);
  }, [side, openList, doneList, todayKey]);

  const filtered = useMemo(() => {
    const q = searchDebounced.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) => r.title.toLowerCase().includes(q));
  }, [items, searchDebounced]);

  async function submitCreate() {
    setErr(null);
    if (!title.trim()) {
      setErr("title is required");
      return;
    }
    try {
      const dueIso = new Date(dueAtLocal).toISOString();
      await createReminder({ title: title.trim(), dueAt: dueIso });
      setTitle("");
      setShowCreate(false);
      await refresh();
    } catch (e: any) {
      setErr(e?.message ?? "create failed");
    }
  }

  async function toggleDone(r: Reminder) {
    if (r.isDone) await markUndone(r.id);
    else await markDone(r.id);
    await refresh();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
      {/* Sidebar */}
      <div style={card()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>リマインダ</div>
          <button
            onClick={() => setShowCreate(true)}
            style={iconBtn()}
            aria-label="add"
          >
            +
          </button>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          <SideItem
            active={side === "today"}
            label="今日"
            count={counts.today}
            onClick={() => setSide("today")}
          />
          <SideItem
            active={side === "all"}
            label="すべて"
            count={counts.all}
            onClick={() => setSide("all")}
          />
          <SideItem
            active={side === "done"}
            label="完了"
            count={counts.done}
            onClick={() => setSide("done")}
          />
        </div>
      </div>

      {/* Main */}
      <div style={card()}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>リマインダー一覧</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: 320,
            }}
          >
            <span style={{ opacity: 0.8 }}>🔎</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="検索..."
              style={{ ...input(), width: "100%" }}
            />
          </div>
        </div>

        {/* Create overlay (RIGHT side behavior, triggered by left +) */}
        {showCreate && (
          <div
            style={overlay()}
            onClick={() => setShowCreate(false)}
            role="presentation"
          >
            <div style={sheet()} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ fontWeight: 800 }}>追加</div>
                <button
                  onClick={() => setShowCreate(false)}
                  style={smallBtn()}
                  aria-label="close"
                >
                  ×
                </button>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タイトル"
                  style={input()}
                />
                <input
                  type="datetime-local"
                  value={dueAtLocal}
                  onChange={(e) => setDueAtLocal(e.target.value)}
                  style={input()}
                />
                <button onClick={submitCreate} style={btn()} disabled={loading}>
                  追加する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status / errors */}
        <div style={{ marginTop: 12 }}>
          {err && <div style={{ color: "salmon", marginBottom: 10 }}>{err}</div>}
          {loading && (
            <div style={{ opacity: 0.8, marginBottom: 10 }}>loading...</div>
          )}

          {filtered.length === 0 ? (
            <div style={{ opacity: 0.8 }}>0件</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((r) => (
                <div key={r.id} style={row()}>
                  <UiCheckbox
                    checked={r.isDone}
                    onToggle={() => toggleDone(r)}
                    ariaLabel={`toggle ${r.title}`}
                  />

                  <div style={{ display: "grid", gap: 4, flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div
                      style={{
                        opacity: r.isOverdue ? 1 : 0.8,
                        fontSize: 12,
                        color: r.isOverdue ? "#ff6b6b" : undefined,
                        fontWeight: r.isOverdue ? 700 : 400,
                      }}
                    >
                      {new Date(r.dueAt).toLocaleDateString()}{" "}
                      {new Date(r.dueAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {r.isOverdue ? "（期限超過）" : ""}
                    </div>
                  </div>

                  <div style={{ opacity: 0.7, fontSize: 12 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SideItem({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--line)",
        background: active ? "rgba(79,140,255,0.35)" : "transparent",
        color: "var(--fg)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span style={{ opacity: 0.9 }}>{count}</span>
    </button>
  );
}

function card(): React.CSSProperties {
  return {
    border: "1px solid var(--line)",
    borderRadius: 16,
    padding: 14,
    background: "rgba(255,255,255,0.02)",
  };
}

function input(): React.CSSProperties {
  return {
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "transparent",
    color: "var(--fg)",
  };
}

function btn(): React.CSSProperties {
  return {
    border: "1px solid var(--line)",
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.06)",
    color: "var(--fg)",
    cursor: "pointer",
  };
}

function smallBtn(): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "transparent",
    color: "var(--fg)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  };
}

function iconBtn(): React.CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: 10,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.06)",
    color: "var(--fg)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
  };
}

function row(): React.CSSProperties {
  return {
    display: "flex",
    gap: 10,
    alignItems: "center",
    padding: 10,
    border: "1px solid var(--line)",
    borderRadius: 14,
  };
}

function overlay(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "grid",
    placeItems: "start center",
    paddingTop: 120,
    zIndex: 50,
  };
}

function sheet(): React.CSSProperties {
  return {
    width: "min(520px, calc(100vw - 32px))",
    border: "1px solid var(--line)",
    borderRadius: 16,
    padding: 14,
    background: "rgba(15,20,35,0.96)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    transform: "translateY(-6px)",
    animation: "rem-sheet-in 140ms ease-out",
  };
}
