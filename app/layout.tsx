import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Freight Cargo Management",
  description: "SAP-like freight cargo inventory and shipment management UI",
};

// Root layout wraps the entire app with the ThemeProvider for dark mode support.
// The "dark" class is added by default so the initial render matches dark mode.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased dark:bg-black dark:text-neutral-100" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
