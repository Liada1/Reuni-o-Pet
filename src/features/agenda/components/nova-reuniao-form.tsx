"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { criarReuniaoDireta } from "../actions";
import type { Database, Modalidade } from "@/lib/supabase/types";

type MeetingType = Database["public"]["Tables"]["meeting_types"]["Row"];
type Location = Database["public"]["Tables"]["locations"]["Row"];

export function NovaReuniaoForm({
  tiposEncontro,
  locais,
}: {
  tiposEncontro: MeetingType[];
  locais: Location[];
}) {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [tipoId, setTipoId] = useState(tiposEncontro[0]?.id ?? "");
  const [duracao, setDuracao] = useState(tiposEncontro[0]?.duracao_padrao_minutos ?? 120);
  const [dataISO, setDataISO] = useState("");
  const [horaMinuto, setHoraMinuto] = useState("16:00");
  const [modalidade, setModalidade] = useState<Modalidade>("presencial");
  const [locationId, setLocationId] = useState("");
  const [linkOnline, setLinkOnline] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!tipoId) return setErro("Escolha o tipo de encontro.");
    if (!dataISO) return setErro("Escolha a data.");
    setErro(null);
    startTransition(async () => {
      try {
        const { id } = await criarReuniaoDireta({
          titulo: titulo || undefined,
          meetingTypeId: tipoId,
          dataISO,
          horaMinuto,
          duracaoMinutos: duracao,
          modalidade,
          locationId: locationId || undefined,
          linkOnline: linkOnline || undefined,
        });
        router.push(`/reunioes/${id}`);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível criar a reunião.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="titulo">Título (opcional)</Label>
        <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="tipo">Tipo de encontro</Label>
          <Select
            id="tipo"
            value={tipoId}
            onChange={(e) => {
              setTipoId(e.target.value);
              const tipo = tiposEncontro.find((t) => t.id === e.target.value);
              if (tipo) setDuracao(tipo.duracao_padrao_minutos);
            }}
          >
            {tiposEncontro.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="duracao">Duração (min)</Label>
          <Input
            id="duracao"
            type="number"
            min={15}
            step={15}
            value={duracao}
            onChange={(e) => setDuracao(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={dataISO} onChange={(e) => setDataISO(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="hora">Hora</Label>
          <Input
            id="hora"
            type="time"
            value={horaMinuto}
            onChange={(e) => setHoraMinuto(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="modalidade">Modalidade</Label>
        <Select
          id="modalidade"
          value={modalidade}
          onChange={(e) => setModalidade(e.target.value as Modalidade)}
          className="max-w-xs"
        >
          <option value="presencial">Presencial</option>
          <option value="online">Online</option>
        </Select>
      </div>

      {modalidade === "presencial" ? (
        <div>
          <Label htmlFor="local">Local</Label>
          <Select
            id="local"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="max-w-xs"
          >
            <option value="">Local a definir</option>
            {locais.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div>
          <Label htmlFor="link">Link da chamada</Label>
          <Input id="link" value={linkOnline} onChange={(e) => setLinkOnline(e.target.value)} />
        </div>
      )}

      {erro && <p className="text-sm text-alert">{erro}</p>}

      <Button type="button" onClick={enviar} disabled={pending}>
        {pending ? "Criando…" : "Criar reunião"}
      </Button>
    </div>
  );
}
