import { UI } from "@/lib/ui/uiTokens";
import { getDashboardSummary } from "../../../features/dashboard/api/getDashboardSummary";
import StudySummary from "../../../features/dashboard/components/StudySummary";
import WeeklyChart from "../../../features/dashboard/components/WeeklyChart";
import BySubjectBreakdown from "../../../features/dashboard/components/BySubjectBreakdown";


export default async function DashboardPage() {
  // backend は minutes を返す
  const summary = await getDashboardSummary();
  const { todayMinutes, weekMinutes } = summary;

  // 表示用に hours に変換
  const todayHours = todayMinutes / 60;
  const weekHours = weekMinutes / 60;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: UI.bg,
        padding: `${UI.pagePadTop}px ${UI.pagePadX}px`,
      }}
    >
      <StudySummary
        todayHours={todayHours}
        weekHours={weekHours}
      />
      <WeeklyChart />
      <BySubjectBreakdown summary={summary} />
    </main>
  );
}
