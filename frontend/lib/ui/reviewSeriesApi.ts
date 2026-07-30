// frontend/lib/ui/reviewSeriesApi.ts
import { apiGet, apiPost } from "./apiClient";

export type ReviewSeries = {
  id: string;
  title: string;
  subjectId: string;
  baseDate: string;
  intervalDays: number[];
  recipeId: string | null;
  subjectTaskId: string | null;
  createdAt: string;
};

export type GeneratedReminder = {
  id: string;
  title: string;
  dueAt: string;
  isDone: boolean;
  doneAt: string | null;
  createdAt: string;
  updatedAt: string;
  subjectTaskId: string | null;
  reviewSeriesId: string | null;
};

// POST応答は作成されたReviewSeries本体に加えて、一括生成されたReminder一覧を含む
export type CreatedReviewSeries = ReviewSeries & {
  reminders: GeneratedReminder[];
};

export function listReviewSeries(): Promise<ReviewSeries[]> {
  return apiGet<ReviewSeries[]>("/api/review-series");
}

export function createReviewSeries(params: {
  title: string;
  subjectId: string;
  baseDate: string;
  recipeId: string;
  subjectTaskId?: string | null;
}): Promise<CreatedReviewSeries> {
  return apiPost<CreatedReviewSeries>("/api/review-series", params);
}
