export type DashboardSummary = {
  todayMinutes: number;
  weekMinutes: number;
  weekPeriod: {
    mode: "CALENDAR_WEEK" | "LAST_7_DAYS";
    weekStartsOn: "MON" | "SUN";
    fromDate: string; // YYYY-MM-DD
    toDate: string;   // YYYY-MM-DD
  };
  bySubject: Array<{
    subjectId: string | null;
    subjectName: string;
    colorHex: string;
    minutes: number;
  }>;
};
