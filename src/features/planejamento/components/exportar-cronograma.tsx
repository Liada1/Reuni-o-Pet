"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown, Sheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarCsv, baixarCsv } from "@/lib/csv";
import { formatarMinutos } from "@/lib/duracao";
import type { CabecalhoPdf } from "@/components/pdf/relatorio";
import { CronogramaDocumento } from "../pdf/cronograma-documento";
import type { LinhaCronograma } from "../types";

const STATUS_TEXTO: Record<string, string> = {
  agendada: "Agendada",
  em_andamento: "Em andamento",
  realizada: "Realizada",
};

export function ExportarCronograma({
  linhas,
  mesISO,
  programa,
  totalEncontros,
  totalMinutos,
  fusoHorario,
}: {
  linhas: LinhaCronograma[];
  mesISO: string;
  programa: CabecalhoPdf;
  totalEncontros: number;
  totalMinutos: number;
  fusoHorario: string;
}) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function exportarCsv() {
    setErro(null);
    try {
      const csv = gerarCsv(
        ["Data", "Hora", "Tipo", "Título", "Modalidade", "Local", "Duração", "Status"],
        linhas.map((l) => [
          l.data,
          l.hora,
          l.tipo,
          l.titulo,
          l.modalidade,
          l.local,
          formatarMinutos(l.minutos),
          STATUS_TEXTO[l.status] ?? l.status,
        ]),
      );
      baixarCsv(`cronograma_${mesISO}`, csv);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o CSV.");
    }
  }

  async function exportarPdf() {
    setGerando(true);
    setErro(null);
    try {
      const blob = await pdf(
        <CronogramaDocumento
          linhas={linhas}
          mesISO={mesISO}
          programa={programa}
          totalEncontros={totalEncontros}
          totalMinutos={totalMinutos}
          geradoEmISO={new Date().toISOString()}
          fusoHorario={fusoHorario}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cronograma_${mesISO}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  if (linhas.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secundario" onClick={exportarCsv}>
          <Sheet className="h-4 w-4" strokeWidth={1.75} />
          Exportar CSV
        </Button>
        <Button type="button" variant="secundario" onClick={exportarPdf} disabled={gerando}>
          <FileDown className="h-4 w-4" strokeWidth={1.75} />
          {gerando ? "Gerando…" : "Exportar PDF"}
        </Button>
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
    </div>
  );
}
