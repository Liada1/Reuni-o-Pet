import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { ProvedorTema } from "@/components/tema/provedor-tema";
import { AvisoOffline } from "@/components/aviso-offline";
import { CHAVE_TEMA, SCRIPT_TEMA, temaValido } from "@/lib/tema";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "PET — Reuniões", template: "%s · PET" },
  description: "Agendamento e registro de reuniões do grupo PET.",
  applicationName: "PET — Reuniões",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PET" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Uma tag só, atualizada pelo script de tema — duas tags com `media`
  // brigariam com a escolha manual de claro/escuro.
  themeColor: "#2f6b4f",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = temaValido((await cookies()).get(CHAVE_TEMA)?.value);

  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <head>
        {/* Antes da primeira pintura, senão quem usa o tema escuro leva um
            flash branco a cada carregamento. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <ProvedorTema temaInicial={tema}>
          <AvisoOffline />
          {children}
        </ProvedorTema>
      </body>
    </html>
  );
}
