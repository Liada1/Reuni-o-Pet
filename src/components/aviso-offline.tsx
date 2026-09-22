"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Aviso de "sem conexão".
 *
 * Usa os eventos `online`/`offline` do navegador, não o hook `useOffline`
 * do Next — a flag experimental que o habilita ficou desligada de
 * propósito (ver a nota no `next.config.ts`).
 *
 * `navigator.onLine` só enxerga a interface de rede, então Wi-Fi conectado
 * sem saída continua dizendo "online" — por isso o aviso é um complemento,
 * e quem de fato garante a ata é a fila em IndexedDB do modo reunião, que
 * grava primeiro e sincroniza depois.
 *
 * O estado inicial é sempre "online" para servidor e cliente renderizarem
 * igual; a correção vem no efeito, logo após a hidratação.
 */
export function AvisoOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {offline && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-accent px-4 py-1.5 text-center text-xs font-medium text-[#1e2a2f]">
          <WifiOff className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          Sem conexão. O que você registrar na reunião fica salvo no aparelho e é
          enviado quando a internet voltar.
        </div>
      )}
    </div>
  );
}
