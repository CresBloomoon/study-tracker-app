// frontend/lib/ui/jstDate.ts
//
// フロントエンド側でJST暦日を扱うための最小限のヘルパー。
// タイムゾーン変換の考え方自体はbackend/src/domain/time.jsと同じ（+9h/-9hで暦日を判定する）が、
// フロントとバックエンドはランタイムが別で直接importできないため、フロント側にも最小限だけ用意する。
// 新しいJST関連ヘルパーが必要になったら、ここに追記して重複を避けること。

/** Date -> JST暦日キー YYYY-MM-DD */
export function jstDateKeyOf(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" を deltaDays 日ずらした "YYYY-MM-DD" を返す */
export function shiftDateKey(dateKey: string, deltaDays: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}
