import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Crux — climbing training plans", template: "%s · Crux" },
  description: "Build block-based climbing training plans, log sessions and tests, and learn from other climbers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
