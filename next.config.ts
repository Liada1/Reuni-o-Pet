import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Navegação, prefetch e Server Action que falham sem rede ficam
    // pendentes e são repetidas quando a conexão volta, em vez de estourar
    // erro na cara de quem está registrando a reunião. Também é o que
    // habilita o hook `useOffline` (ver AvisoOffline no layout).
    useOffline: true,
  },
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
