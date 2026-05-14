

import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Casos - Hệ Thống Cảnh Báo Ngã AI",
  description: "Giám sát sức khỏe thông minh bằng trí tuệ nhân tạo",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
