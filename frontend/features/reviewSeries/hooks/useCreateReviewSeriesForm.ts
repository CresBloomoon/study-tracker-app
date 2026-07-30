import { useEffect, useState } from "react";
import { listReviewRecipes, type ReviewRecipe } from "@/lib/ui/reviewRecipesApi";
import { createReviewSeries, type CreatedReviewSeries } from "@/lib/ui/reviewSeriesApi";
import { listAllSubjects, type SubjectMeta } from "@/lib/ui/reviewApi";
import { listMilestones, getMilestone, type MilestoneSummary, type SubjectTaskWithProgress } from "@/lib/ui/scheduleApi";

export function useCreateReviewSeriesForm() {
  const [recipes, setRecipes] = useState<ReviewRecipe[]>([]);
  const [subjects, setSubjects] = useState<SubjectMeta[]>([]);
  const [milestones, setMilestones] = useState<MilestoneSummary[]>([]);
  const [subjectTasks, setSubjectTasks] = useState<SubjectTaskWithProgress[]>([]);

  const [title, setTitle] = useState("");
  const [baseDate, setBaseDate] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [milestoneId, setMilestoneId] = useState("");
  const [subjectTaskId, setSubjectTaskId] = useState("");

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedReviewSeries | null>(null);

  useEffect(() => {
    Promise.all([listReviewRecipes(), listAllSubjects(), listMilestones()])
      .then(([r, s, m]) => {
        setRecipes(r);
        setSubjects(s);
        setMilestones(m);
        if (r.length > 0) setRecipeId(r[0].id);
        if (s.length > 0) setSubjectId(s[0].id);
      })
      .catch((e: any) => setErr(e?.message ?? "初期データの取得に失敗しました"));
  }, []);

  // マイルストーン選択時のみ、その配下の科目バー（SubjectTask）一覧を取得する
  useEffect(() => {
    setSubjectTaskId("");
    if (!milestoneId) {
      setSubjectTasks([]);
      return;
    }
    getMilestone(milestoneId)
      .then((detail) => setSubjectTasks(detail.subjectTasks))
      .catch((e: any) => setErr(e?.message ?? "科目バーの取得に失敗しました"));
  }, [milestoneId]);

  function selectSubjectTask(id: string) {
    setSubjectTaskId(id);
    // 選んだ科目バーの科目に、上部の科目選択も合わせておく
    const task = subjectTasks.find((t) => t.id === id);
    if (task) setSubjectId(task.subjectId);
  }

  async function submit() {
    if (!title.trim() || !baseDate || !recipeId || !subjectId) {
      setErr("タイトル・起点日・レシピ・科目を入力してください");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const created = await createReviewSeries({
        title: title.trim(),
        subjectId,
        baseDate,
        recipeId,
        subjectTaskId: subjectTaskId || null,
      });
      setResult(created);
    } catch (e: any) {
      setErr(e?.message ?? "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return {
    recipes,
    subjects,
    milestones,
    subjectTasks,
    title,
    setTitle,
    baseDate,
    setBaseDate,
    recipeId,
    setRecipeId,
    subjectId,
    setSubjectId,
    milestoneId,
    setMilestoneId,
    subjectTaskId,
    selectSubjectTask,
    busy,
    err,
    result,
    submit,
  };
}
