import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Dental Worldwide Marketplace — Private Preview",
  description: "Private development foundation. Fictional data only.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
