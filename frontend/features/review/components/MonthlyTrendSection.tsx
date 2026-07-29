"use client";

import { useMonthlyTrend } from "../hooks/useStudyTrend";
import TrendBarChart from "./TrendBarChart";

export default function MonthlyTrendSection() {
  const { items, loading, err } = useMonthlyTrend();
  return <TrendBarChart title="月次推移" items={items} loading={loading} err={err} />;
}
