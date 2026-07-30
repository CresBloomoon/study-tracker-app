"use client";

import { formStyle, inputStyle, submitBtnStyle } from "@/lib/ui/formStyles";
import { useCreateReviewSeriesForm } from "../hooks/useCreateReviewSeriesForm";
import GeneratedRemindersList from "./GeneratedRemindersList";

export default function CreateReviewSeriesForm() {
  const f = useCreateReviewSeriesForm();

  if (f.result) return <GeneratedRemindersList series={f.result} />;

  return (
    <div style={formStyle}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>復習シリーズを作成</div>

      <select value={f.recipeId} onChange={(e) => f.setRecipeId(e.target.value)} style={inputStyle}>
        {f.recipes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}（{r.intervalDays.join(", ")}日後）
          </option>
        ))}
      </select>

      <input value={f.title} onChange={(e) => f.setTitle(e.target.value)} placeholder="タイトル" style={inputStyle} />

      <select value={f.subjectId} onChange={(e) => f.setSubjectId(e.target.value)} style={inputStyle}>
        {f.subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input type="date" value={f.baseDate} onChange={(e) => f.setBaseDate(e.target.value)} style={inputStyle} />

      <select value={f.milestoneId} onChange={(e) => f.setMilestoneId(e.target.value)} style={inputStyle}>
        <option value="">（任意）紐付けるマイルストーンなし</option>
        {f.milestones.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {f.milestoneId && (
        <select value={f.subjectTaskId} onChange={(e) => f.selectSubjectTask(e.target.value)} style={inputStyle}>
          <option value="">（任意）紐付ける科目バーなし</option>
          {f.subjectTasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.startDate} 〜 {t.endDate}
            </option>
          ))}
        </select>
      )}

      {f.err && <div style={{ color: "#fca5a5", fontSize: 12 }}>{f.err}</div>}

      <button type="button" onClick={f.submit} disabled={f.busy} style={submitBtnStyle}>
        作成する
      </button>
    </div>
  );
}
