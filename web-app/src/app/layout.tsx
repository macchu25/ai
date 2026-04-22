import type { Metadata } from "next";
import "./globals.css";
import "./dashboard.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fall Guard Medical Console",
  description: "Hệ thống giám sát và bảo vệ y tế thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 text-slate-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
