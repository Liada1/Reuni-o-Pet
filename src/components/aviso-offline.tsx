"use client";

import { useOffline } from "next/offline";
import { WifiOff } from "lucide-react";

/**
 * O `useOffline` do Next é mais confiável que `navigator.onLine`: além dos
 * eventos do navegador, ele entra em modo offline quando uma navegação ou
 * Server Action falha de fato — o caso do Wi-Fi conectado mas sem saída,
 * que é o que costuma acontecer na sala de reunião.
 *
 * As requisições ficam pendentes e são repetidas sozinhas; o aviso existe
 * para a pessoa não achar que o sistema travou.
 */
export function AvisoOffline() {
  const offline = useOffline();

  return (
    <div role="status" aria-live="polite">
      {offline && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-center text-xs font-medium text-[#1e2a2f]">
          <WifiOff className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Sem conexão. O que você fizer agora é enviado quando a internet voltar.
        </div>
      )}
    </div>
  );
}
