"use client";

import { useEffect, useMemo, useState } from "react";
import { useMilestoneList } from "../hooks/useMilestoneList";
import { useMilestoneDetail } from "../hooks/useMilestoneDetail";
import { listAllSubjects, type SubjectMeta } from "@/lib/ui/reviewApi";
import MilestoneSelector from "./MilestoneSelector";
import CreateMilestoneForm from "./CreateMilestoneForm";
import CreateSubjectTaskForm from "./CreateSubjectTaskForm";
import GanttChart from "./GanttChart";

export default function ScheduleTab() {
  const { milestones, defaultActiveId, err: listErr, refresh: refreshList } = useMilestoneList();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);

  useEffect(() => {
    if (!selectedId && defaultActiveId) setSelectedId(defaultActiveId);
  }, [defaultActiveId, selectedId]);

  useEffect(() => {
    listAllSubjects()
      .then(setSubjects)
      .catch(() => {});
  }, []);

  const { detail, loading: detailLoading, err: detailErr, refresh: refreshDetail } = useMilestoneDetail(selectedId);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  async function handleMilestoneCreated() {
    const list = await refreshList();
    if (list.length > 0) setSelectedId(list[list.length - 1].id);
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <MilestoneSelector milestones={milestones} selectedId={selectedId} onChange={setSelectedId} />
        <CreateMilestoneForm onCreated={handleMilestoneCreated} />
      </div>

      {listErr && <div style={{ color: "#fca5a5" }}>{listErr}</div>}
      {detailLoading && <div style={{ opacity: 0.7 }}>読み込み中...</div>}
      {detailErr && <div style={{ color: "#fca5a5" }}>{detailErr}</div>}

      {!detailLoading && !detailErr && milestones.length === 0 && (
        <div style={{ opacity: 0.7 }}>マイルストーンがまだありません</div>
      )}

      {detail && (
        <>
          <GanttChart milestone={detail} subjectMap={subjectMap} onProgressChanged={refreshDetail} />
          <div style={{ marginTop: 16 }}>
            <CreateSubjectTaskForm milestoneId={detail.id} onCreated={refreshDetail} />
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.02)",
};
