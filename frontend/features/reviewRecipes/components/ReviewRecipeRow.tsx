"use client";

import { useState } from "react";
import { updateReviewRecipe, deleteReviewRecipe, type ReviewRecipe } from "@/lib/ui/reviewRecipesApi";
import { cancelBtnStyle } from "@/lib/ui/formStyles";
import ReviewRecipeForm from "./ReviewRecipeForm";

type Props = {
  recipe: ReviewRecipe;
  onChanged: () => void;
};

export default function ReviewRecipeRow({ recipe, onChanged }: Props) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`「${recipe.name}」を削除しますか？（既存のReviewSeriesへの影響はありません）`)) return;
    setDeleting(true);
    setErr(null);
    try {
      await deleteReviewRecipe(recipe.id);
      onChanged();
    } catch (e: any) {
      setErr(e?.message ?? "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <ReviewRecipeForm
        initialName={recipe.name}
        initialIntervalDays={recipe.intervalDays}
        submitLabel="更新する"
        onCancel={() => setEditing(false)}
        onSubmit={async (params) => {
          await updateReviewRecipe(recipe.id, params);
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div style={rowStyle}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{recipe.name}</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>{recipe.intervalDays.join(", ")}日後</div>
        {err && <div style={{ color: "#fca5a5", fontSize: 12 }}>{err}</div>}
      </div>
      <button type="button" onClick={() => setEditing(true)} style={editBtnStyle}>
        編集
      </button>
      <button type="button" onClick={handleDelete} disabled={deleting} style={cancelBtnStyle}>
        削除
      </button>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: 10,
  border: "1px solid var(--line)",
  borderRadius: 12,
};

const editBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--line)",
  background: "rgba(255,255,255,0.04)",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: 12,
};
