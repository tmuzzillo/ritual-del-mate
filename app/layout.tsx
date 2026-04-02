import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Ritual del Mate",
  description: "Mates y accesorios artesanales en Argentina",
  openGraph: {
    title: "Ritual del Mate",
    description: "Mates y accesorios artesanales en Argentina",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
