import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI UGC Viral Cloner",
  description: "Upload a viral UGC video, reverse-engineer the format, and recreate it with your AI avatar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
