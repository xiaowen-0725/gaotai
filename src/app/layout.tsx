import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/store-context";

export const metadata: Metadata = {
  title: "稿台",
  description: "稿台 V1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
