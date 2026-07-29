// frontend/lib/ui/scheduleApi.ts
import { apiGet, apiPost } from "./apiClient";

export type MilestoneSummary = {
  id: string;
  name: string;
  deadlineDate: string;
  createdAt: string;
};

export type PaceStatus = "NO_REMINDERS" | "COMPLETE" | "NO_PACE_DATA" | "ON_TRACK" | "DELAYED";

export type SubjectTaskProgress = {
  doneCount: number;
  totalCount: number;
  estimatedFinishDate: string | null;
  paceStatus: PaceStatus;
};

export type SubjectTaskWithProgress = {
  id: string;
  subjectId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  progress: SubjectTaskProgress;
};

export type MilestoneDetail = MilestoneSummary & {
  subjectTasks: SubjectTaskWithProgress[];
};

export function listMilestones(): Promise<MilestoneSummary[]> {
  return apiGet<MilestoneSummary[]>("/api/milestones");
}

export function getMilestone(id: string): Promise<MilestoneDetail> {
  return apiGet<MilestoneDetail>(`/api/milestones/${id}`);
}

export function createMilestone(params: { name: string; deadlineDate: string }): Promise<MilestoneSummary> {
  return apiPost<MilestoneSummary>("/api/milestones", params);
}

export type SubjectTaskSummary = {
  id: string;
  milestoneId: string;
  subjectId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export function createSubjectTask(params: {
  milestoneId: string;
  subjectId: string;
  startDate: string;
  endDate: string;
}): Promise<SubjectTaskSummary> {
  return apiPost<SubjectTaskSummary>("/api/subject-tasks", params);
}

export type SubjectTaskReminderItem = {
  id: string;
  title: string;
  isDone: boolean;
};

// ガント展開パネル用。期限日を含まない（期限日はリマインダータブでのみ表示する方針）
export function listSubjectTaskReminders(subjectTaskId: string): Promise<SubjectTaskReminderItem[]> {
  return apiGet<SubjectTaskReminderItem[]>(`/api/subject-tasks/${subjectTaskId}/reminders`);
}
