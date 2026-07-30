"use client";

import { useState } from "react";
import { createReviewRecipe } from "@/lib/ui/reviewRecipesApi";
import { toggleBtnStyle } from "@/lib/ui/formStyles";
import { useReviewRecipes } from "../hooks/useReviewRecipes";
import ReviewRecipeRow from "./ReviewRecipeRow";
import ReviewRecipeForm from "./ReviewRecipeForm";

export default function ReviewRecipeSettings() {
  const { recipes, loading, err, refresh } = useReviewRecipes();
  const [creating, setCreating] = useState(false);

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>復習レシピ設定</div>

      {loading && <div style={{ opacity: 0.7 }}>読み込み中...</div>}
      {err && <div style={{ color: "#fca5a5" }}>{err}</div>}

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {recipes.map((r) => (
          <ReviewRecipeRow key={r.id} recipe={r} onChanged={refresh} />
        ))}
        {!loading && recipes.length === 0 && <div style={{ opacity: 0.7 }}>レシピがまだありません</div>}
      </div>

      {creating ? (
        <ReviewRecipeForm
          submitLabel="作成する"
          onCancel={() => setCreating(false)}
          onSubmit={async (params) => {
            await createReviewRecipe(params);
            setCreating(false);
            refresh();
          }}
        />
      ) : (
        <button type="button" onClick={() => setCreating(true)} style={toggleBtnStyle}>
          + レシピを追加
        </button>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.02)",
};
