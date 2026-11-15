import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "ATM Content Studio",
  description: "Your sites, schemas and content in one private workspace.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
