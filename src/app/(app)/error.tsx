"use client";

import { TriangleAlert } from "lucide-react";
import { EstadoVazio } from "@/components/ui/estado-vazio";
import { Button } from "@/components/ui/button";

export default function Erro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <EstadoVazio
        icone={TriangleAlert}
        titulo="Não foi possível carregar esta página"
        descricao={
          error.digest
            ? `Pode ter sido uma falha de conexão. Se continuar, avise a coordenação com o código ${error.digest}.`
            : "Pode ter sido uma falha de conexão. Se continuar, avise a coordenação."
        }
        acao={
          <Button type="button" onClick={() => retry()}>
            Tentar de novo
          </Button>
        }
      />
    </div>
  );
}
