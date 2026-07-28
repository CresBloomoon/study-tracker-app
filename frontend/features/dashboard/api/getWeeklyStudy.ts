import { apiGet } from "@/lib/ui/apiClient";

export type WeeklyStudyItem = {
  date: string;
  minutes: number;
};

export type WeeklyStudyResponse = {
  weekPeriod: {
    mode: "CALENDAR_WEEK" | "LAST_7_DAYS";
    weekStartsOn: "MON" | "SUN";
    fromDate: string;
    toDate: string;
  };
  items: WeeklyStudyItem[];
};

export async function getWeeklyStudy() {
  return apiGet<WeeklyStudyResponse>("/api/dashboard/weekly");
}
