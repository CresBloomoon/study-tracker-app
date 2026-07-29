import DailyTimeline from "@/features/review/components/DailyTimeline";
import SubjectBreakdownChart from "@/features/review/components/SubjectBreakdownChart";
import MonthlyTrendSection from "@/features/review/components/MonthlyTrendSection";
import YearlyTrendSection from "@/features/review/components/YearlyTrendSection";

export default function Page() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <DailyTimeline />
      <SubjectBreakdownChart />
      <MonthlyTrendSection />
      <YearlyTrendSection />
    </div>
  );
}
