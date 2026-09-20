import { headers } from "next/headers";

/** URL de origem calculada no servidor (evita mismatch de hidratação que
 * `window.location.origin` causaria em componentes renderizados com dados
 * reais desde o primeiro render). */
export async function getOrigin() {
  const cabecalhos = await headers();
  const host = cabecalhos.get("host");
  if (host) {
    const protocolo = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocolo}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
