import type { Metadata } from "next";
import "./globals.css";

// Global metadata for the site.
// Keep this minimal for now while the new homepage foundation is being built.
export const metadata: Metadata = {
  title: "MUMU",
  description: "Explore market trajectories before they move.",
};

// Root layout shared by all routes.
// This file wraps every page in the app.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
