import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusLoop — Your campus. Your community. Your next big project.",
  description: "A developer-first social network for college communities."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
