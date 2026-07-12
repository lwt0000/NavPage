import type { Metadata, Viewport } from "next";
import "./globals.css";
import { zhCN } from "@/locales/zh-CN";

export const metadata: Metadata = {
  title: zhCN.app.title,
  description: zhCN.app.subtitle,
};

export const viewport: Viewport = {
  themeColor: "#edf1f8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
