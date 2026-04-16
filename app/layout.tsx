import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "Aula 0 | Treinamento Editify",
  description:
    "Como conseguir seus primeiros clientes editando vídeos. Assista a Aula 0 do treinamento Editify gratuitamente.",
  metadataBase: new URL("https://aulazero.editify.com.br"),
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Aula 0 | Treinamento Editify",
    description:
      "Como conseguir seus primeiros clientes editando vídeos. Assista a Aula 0 do treinamento Editify gratuitamente.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
