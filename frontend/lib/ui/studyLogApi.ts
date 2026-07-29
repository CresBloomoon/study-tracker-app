// frontend/lib/ui/studyLogApi.ts
import { apiPost } from "./apiClient";

export type CreateStudyLogParams = {
  subjectId: string;
  durationSec: number;
  date?: string; // YYYY-MM-DD（JST）。省略時はサーバーの現在時刻を終了時刻として使う
  clientRequestId: string;
  note?: string | null;
  linkedReminderId?: string | null;
};

export type StudyLogCreated = {
  id: string;
  subjectId: string | null;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  note: string | null;
  linkedReminderId: string | null;
};

export function createStudyLog(params: CreateStudyLogParams): Promise<StudyLogCreated> {
  return apiPost<StudyLogCreated>("/api/study-log", params);
}
