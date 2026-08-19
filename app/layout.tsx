import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hospital Graph Explorer",
  description:
    "Explore fictional hospital medical history and the relationships between patients, visits, doctors, departments, diseases, and medications.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
