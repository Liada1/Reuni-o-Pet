import type { MetadataRoute } from "next";
import { getProgramaSettings } from "@/features/configuracoes";

/**
 * O nome do programa e do grupo são configuráveis (tabela `settings`, com
 * leitura pública), então o manifesto os lê do banco — o ícone instalado na
 * tela de início sai com o nome real do grupo, não um rótulo fixo.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const programa = await getProgramaSettings();
  const nome = programa.nome_grupo
    ? `${programa.nome_programa} — ${programa.nome_grupo}`
    : `${programa.nome_programa} — Reuniões`;

  return {
    name: nome,
    short_name: programa.nome_programa,
    description:
      "Enquetes de data, agenda, atas e encaminhamentos do grupo, em um fluxo só.",
    lang: "pt-BR",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f3ec",
    theme_color: "#2f6b4f",
    categories: ["productivity", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Agenda", url: "/agenda" },
      { name: "Atas", url: "/atas" },
      { name: "Encaminhamentos", url: "/encaminhamentos" },
    ],
  };
}
