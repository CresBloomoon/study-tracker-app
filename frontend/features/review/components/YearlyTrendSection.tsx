"use client";

import { useYearlyTrend } from "../hooks/useStudyTrend";
import TrendBarChart from "./TrendBarChart";

export default function YearlyTrendSection() {
  const { items, loading, err } = useYearlyTrend();
  return <TrendBarChart title="年次推移" items={items} loading={loading} err={err} />;
}
