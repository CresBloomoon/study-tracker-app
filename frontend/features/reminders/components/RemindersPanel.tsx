"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedCheckbox from "@/features/reminders/components/AnimatedCheckbox";
import {
  Reminder,
  getReminderSummary,
  listReminders,
  createReminder,
} from "@/lib/ui/remindersApi";

type SideFilter = "today" | "all" | "done";

function jstDateKey(d: Date) {
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

export default function RemindersPanel() {
  const [side, setSide] = useState<SideFilter>("today");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [items, setItems] = useState<Reminder[]>([]);
  const [counts, setCounts] = useState({ today: 0, all: 0, done: 0 });
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
      const [summary, allList] = await Promise.all([
        getReminderSummary(),
        listReminders("all"),
      ]);

      const todayKey = summary.ranges.todayJst;

      const openList = allList.filter((r) => !r.isDone);
      const doneList = allList.filter((r) => r.isDone);

      const todayOpenCount = openList.filter(
        (r) => jstDateKey(new Date(r.dueAt)) === todayKey
      ).length;

      setCounts({
        today: todayOpenCount,
        all: allList.length,
        done: doneList.length,
      });

      let base: Reminder[] = allList;

      if (side === "done") {
        base = doneList;
      } else if (side === "all") {
        base = allList;
      } else {
        base = openList.filter(
          (r) => jstDateKey(new Date(r.dueAt)) === todayKey
        );
      }

      setItems(base);
    } catch (e: any) {
      setErr(e?.message ?? "failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side]);

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
                  {/* AnimatedCheckbox is responsible for API calls; here we just refresh */}
                  <AnimatedCheckbox id={r.id} isDone={r.isDone} onChanged={refresh} />

                  <div style={{ display: "grid", gap: 4, flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>
                      {new Date(r.dueAt).toLocaleDateString()}{" "}
                      {new Date(r.dueAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
