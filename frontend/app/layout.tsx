// frontend/app/layout.tsx
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" data-theme="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
