// frontend/lib/ui/reviewRecipesApi.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export type ReviewRecipe = {
  id: string;
  name: string;
  intervalDays: number[];
  createdAt: string;
};

export function listReviewRecipes(): Promise<ReviewRecipe[]> {
  return apiGet<ReviewRecipe[]>("/api/review-recipes");
}

export function createReviewRecipe(params: { name: string; intervalDays: number[] }): Promise<ReviewRecipe> {
  return apiPost<ReviewRecipe>("/api/review-recipes", params);
}

export function updateReviewRecipe(
  id: string,
  params: { name?: string; intervalDays?: number[] }
): Promise<ReviewRecipe> {
  return apiPatch<ReviewRecipe>(`/api/review-recipes/${id}`, params);
}

export function deleteReviewRecipe(id: string): Promise<{ success: true }> {
  return apiDelete<{ success: true }>(`/api/review-recipes/${id}`);
}
