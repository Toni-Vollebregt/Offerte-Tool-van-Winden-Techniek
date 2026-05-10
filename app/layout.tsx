import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Offerte Tool - Van Winden Techniek",
  description: "Maandelijkse offerte tool voor Van Winden Techniek - verwerk ExcelAir planningen naar offertes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#2D2D2D' }}>
        {children}
      </body>
    </html>
  );
}
