"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { registrarPdfGerado } from "../actions";
import { AtaDocumento, type DadosProgramaPdf } from "../pdf/ata-documento";
import type { AtaCompleta } from "../types";

interface GerarPdfButtonProps {
  ata: AtaCompleta;
  programa: DadosProgramaPdf;
  fusoHorario: string;
  onGerado: (url: string) => void;
}

export function GerarPdfButton({ ata, programa, fusoHorario, onGerado }: GerarPdfButtonProps) {
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const geradoEmISO = new Date().toISOString();
      const blob = await pdf(
        <AtaDocumento ata={ata} programa={programa} fusoHorario={fusoHorario} geradoEmISO={geradoEmISO} />,
      ).toBlob();

      const dataFormatada = ata.meeting.inicio.slice(0, 10);
      const nomeArquivo = `ata_${dataFormatada}_${(ata.meeting.meeting_types?.nome ?? "reuniao")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, "-")}.pdf`;
      const caminho = `minutes/${ata.minute.id}/pdfs/${Date.now()}-${nomeArquivo}`;

      const supabase = createClient();
      const { error: erroUpload } = await supabase.storage
        .from("atas")
        .upload(caminho, blob, { contentType: "application/pdf", upsert: true });
      if (erroUpload) throw new Error(erroUpload.message);

      await registrarPdfGerado(ata.minute.id, ata.meeting.id, caminho);

      const { data: urlAssinada } = await supabase.storage
        .from("atas")
        .createSignedUrl(caminho, 60 * 10);
      if (urlAssinada) onGerado(urlAssinada.signedUrl);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o PDF.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button type="button" onClick={gerar} disabled={gerando}>
        <FileDown className="h-4 w-4" strokeWidth={1.75} />
        {gerando ? "Gerando…" : "Gerar PDF"}
      </Button>
      {erro && <p className="text-sm text-alert">{erro}</p>}
    </div>
  );
}
