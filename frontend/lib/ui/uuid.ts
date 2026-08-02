// frontend/lib/ui/uuid.ts
//
// UUID v4生成のヘルパー。
// crypto.randomUUID() はセキュアコンテキスト（HTTPS、またはホスト名が文字通り
// localhost/ループバックIP）でのみ利用可能なブラウザAPIで、
// http://homepi:5175 のような非セキュアコンテキストでは crypto.randomUUID
// 自体が未定義になる（window.crypto は存在するが、このメソッドだけが無い）。
// crypto.getRandomValues() は非セキュアコンテキストでも利用可能なため、
// randomUUID が使えない場合はこちらでRFC4122準拠のUUID v4を組み立てる。

/** ランダムなUUID v4文字列を生成する（clientRequestId等、重複送信防止用の識別子生成に使う想定） */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}
