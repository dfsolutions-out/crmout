import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRMOut",
  description: "Sistema Delta Serviços",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}