import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indian Pixel OS — Digital Agency Operations System",
  description:
    "Single source of truth for digital agency project delivery, approvals, payments, and full auditability.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-brand-main text-brand-light min-h-screen antialiased selection:bg-brand-cta selection:text-black">
        <div className="glow-ambient" />
        {children}
      </body>
    </html>
  );
}
