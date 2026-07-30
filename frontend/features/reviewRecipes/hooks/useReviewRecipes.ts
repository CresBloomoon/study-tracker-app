import { useEffect, useState } from "react";
import { listReviewRecipes, type ReviewRecipe } from "@/lib/ui/reviewRecipesApi";

export function useReviewRecipes() {
  const [recipes, setRecipes] = useState<ReviewRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      setRecipes(await listReviewRecipes());
    } catch (e: any) {
      setErr(e?.message ?? "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { recipes, loading, err, refresh };
}
