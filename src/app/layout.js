import { Inter } from "next/font/google";
import "./globals.css";
import ClientOnly from "@/components/ClientOnly";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "WhatsApp Web Clone",
  description: "Clon de UI de WhatsApp Web con Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientOnly>
          {children}
        </ClientOnly>
      </body>
    </html>
  );
}
