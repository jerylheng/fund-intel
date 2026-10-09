import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Finwise — Financial Planning Workspace",
  description: "A financial planning workspace for advisers to organise client profiles, explore financial roadmaps, model retirement scenarios and review protection needs.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
