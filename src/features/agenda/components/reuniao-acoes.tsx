"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoCopiar } from "@/components/ui/botao-copiar";
import { remarcarReuniao, cancelarReuniao } from "../actions";
import { mensagemRemarcacaoCancelamento, linkWhatsApp } from "@/lib/whatsapp";
import { formatarDataHoraCompleta, paraInputData, paraInputHora, paraUtc } from "@/lib/dates";
import type { ReuniaoComDetalhes } from "../types";

export function ReuniaoAcoes({
  reuniao,
  fusoHorario,
}: {
  reuniao: ReuniaoComDetalhes;
  fusoHorario: string;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<"nenhum" | "remarcar" | "cancelar">("nenhum");
  const [dataISO, setDataISO] = useState(paraInputData(reuniao.inicio, fusoHorario));
  const [horaMinuto, setHoraMinuto] = useState(paraInputHora(reuniao.inicio, fusoHorario));
  const [motivo, setMotivo] = useState("");
  const [mensagemPronta, setMensagemPronta] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelada = reuniao.status === "cancelada";

  function confirmarRemarcar() {
    setErro(null);
    startTransition(async () => {
      try {
        await remarcarReuniao(reuniao.id, { dataISO, horaMinuto, motivo });
        setMensagemPronta(
          mensagemRemarcacaoCancelamento({
            tituloReuniao: reuniao.titulo || "reunião",
            status: "remarcada",
            motivo,
            dataHoraFormatada: formatarDataHoraCompleta(
              paraUtc(dataISO, horaMinuto, fusoHorario).toISOString(),
              fusoHorario,
            ),
          }),
        );
        setModo("nenhum");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível remarcar.");
      }
    });
  }

  function confirmarCancelar() {
    setErro(null);
    startTransition(async () => {
      try {
        await cancelarReuniao(reuniao.id, motivo);
        setMensagemPronta(
          mensagemRemarcacaoCancelamento({
            tituloReuniao: reuniao.titulo || "reunião",
            status: "cancelada",
            motivo,
          }),
        );
        setModo("nenhum");
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível cancelar.");
      }
    });
  }

  if (cancelada && modo === "nenhum" && !mensagemPronta) return null;

  return (
    <div className="space-y-3">
      {modo === "nenhum" && !cancelada && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secundario" onClick={() => setModo("remarcar")}>
            Remarcar
          </Button>
          <Button type="button" variant="perigo" onClick={() => setModo("cancelar")}>
            Cancelar reunião
          </Button>
        </div>
      )}

      {modo === "remarcar" && (
        <div className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-paper p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nova_data">Nova data</Label>
              <Input id="nova_data" type="date" value={dataISO} onChange={(e) => setDataISO(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="nova_hora">Nova hora</Label>
              <Input
                id="nova_hora"
                type="time"
                value={horaMinuto}
                onChange={(e) => setHoraMinuto(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="motivo_remarcar">Motivo</Label>
            <Input id="motivo_remarcar" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-alert">{erro}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={confirmarRemarcar} disabled={pending}>
              Confirmar remarcação
            </Button>
            <Button type="button" variant="fantasma" onClick={() => setModo("nenhum")}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {modo === "cancelar" && (
        <div className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-paper p-4">
          <div>
            <Label htmlFor="motivo_cancelar">Motivo do cancelamento</Label>
            <Input id="motivo_cancelar" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          {erro && <p className="text-sm text-alert">{erro}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="perigo" onClick={confirmarCancelar} disabled={pending}>
              Confirmar cancelamento
            </Button>
            <Button type="button" variant="fantasma" onClick={() => setModo("nenhum")}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {mensagemPronta && (
        <div className="space-y-2 rounded-[var(--radius-panel)] border border-border bg-surface p-4">
          <p className="text-sm text-ink-muted">Mensagem pronta para avisar o grupo:</p>
          <p className="whitespace-pre-line text-sm text-ink">{mensagemPronta}</p>
          <div className="flex flex-wrap gap-2">
            <BotaoCopiar texto={mensagemPronta} label="Copiar mensagem" />
            <a href={linkWhatsApp(mensagemPronta)} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="secundario">
                Abrir no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
