import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `experimental.useOffline` (Next 16) foi avaliado e deixado **desligado**
  // de propósito. Ele faz uma Server Action que falha por rede ficar
  // pendente em vez de rejeitar, e repetir quando a conexão volta — o que
  // soa bom, mas vale para o app inteiro: cada formulário daqui trata a
  // rejeição mostrando "não foi possível salvar", e com a flag ligada esses
  // formulários passariam a girar sem dizer nada. Isso contraria a regra do
  // projeto de que toda server action devolve erro para a UI tratar.
  //
  // O que de fato sustenta a reunião sem internet não é essa flag, e sim a
  // fila em IndexedDB de `src/lib/offline/`, que grava primeiro e
  // sincroniza depois. O aviso de conexão usa os eventos `online`/`offline`
  // do navegador (`src/components/aviso-offline.tsx`).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // O modo reunião usa câmera (foto vira anexo) e microfone
            // (ditado); o resto fica bloqueado.
            value: "camera=(self), microphone=(self), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
