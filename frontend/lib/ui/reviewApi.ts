// frontend/lib/ui/reviewApi.ts
import { apiGet } from "./apiClient";

export type StudyLogItem = {
  id: string;
  subjectId: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  note: string | null;
  linkedReminderId: string | null;
};

export type StudyLogByDateResponse = {
  date: string;
  items: StudyLogItem[];
  totalMinutesRoundedUp: number;
  bySubjectMinutesRoundedUp: { subjectId: string | null; minutes: number }[];
};

// 日別タイムライン用。既存の GET /api/study-log?date=... をそのまま利用する（バックエンド新規追加なし）
export function getStudyLogByDate(date: string): Promise<StudyLogByDateResponse> {
  return apiGet<StudyLogByDateResponse>(`/api/study-log?date=${date}`);
}

export type SubjectMeta = {
  id: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  isArchived: boolean;
};

// 過去のStudyLogはアーカイブ済み科目を参照している場合もあるため、
// アクティブ科目のみのtimerApi.listSubjects()ではなく、全件を返す/subjects/allを使う
export function listAllSubjects(): Promise<SubjectMeta[]> {
  return apiGet<SubjectMeta[]>("/api/subjects/all");
}

export type SubjectBreakdownItem = {
  subjectId: string | null;
  subjectName: string;
  colorHex: string;
  minutes: number;
};

export type SubjectBreakdownResponse = {
  items: SubjectBreakdownItem[];
};

export function getSubjectBreakdown(): Promise<SubjectBreakdownResponse> {
  return apiGet<SubjectBreakdownResponse>("/api/review/subject-breakdown");
}

export type MonthlyTrendItem = { month: string; minutes: number };
export type MonthlyTrendResponse = { items: MonthlyTrendItem[] };

export function getMonthlyTrend(): Promise<MonthlyTrendResponse> {
  return apiGet<MonthlyTrendResponse>("/api/review/monthly-trend");
}

export type YearlyTrendItem = { year: string; minutes: number };
export type YearlyTrendResponse = { items: YearlyTrendItem[] };

export function getYearlyTrend(): Promise<YearlyTrendResponse> {
  return apiGet<YearlyTrendResponse>("/api/review/yearly-trend");
}
