"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./button";

export function BotaoCopiar({ texto, label = "Copiar" }: { texto: string; label?: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de clipboard — sem tratamento adicional necessário aqui.
    }
  }

  return (
    <Button type="button" variant="secundario" onClick={copiar}>
      {copiado ? (
        <Check className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={1.75} />
      )}
      {copiado ? "Copiado" : label}
    </Button>
  );
}
