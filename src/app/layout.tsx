import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CampusLoop — Make your campus move", template: "%s · CampusLoop" },
  description: "A student-built network to find collaborators, share what you are making, and turn campus projects into career momentum.",
  applicationName: "CampusLoop",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg" },
  openGraph: {
    title: "CampusLoop — Make your campus move",
    description: "Find your people. Build something real.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F7F7F2",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
