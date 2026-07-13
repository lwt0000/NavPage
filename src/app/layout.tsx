import type { Metadata, Viewport } from "next";
import "./globals.css";
import { zhCN } from "@/locales/zh-CN";

export const metadata: Metadata = {
  title: zhCN.app.title,
  description: zhCN.app.subtitle,
};

export const viewport: Viewport = {
  themeColor: "#050607",
};

/**
 * Applies the stored theme before first paint so light-theme users don't see
 * a dark flash. Absence of data-theme means dark (the default). A ?theme=
 * query param previews a theme without persisting it.
 */
const THEME_INIT = `try{var q=new URLSearchParams(location.search).get("theme"),s=q||JSON.parse(localStorage.getItem("wcc:settings")||"{}").theme;if(s==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
      </body>
    </html>
  );
}
