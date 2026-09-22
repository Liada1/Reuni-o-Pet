"use client";

import { useState } from "react";
import { Plus, Copy, Trash2, CalendarRange } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MiniCalendario } from "./mini-calendario";
import type { NovaOpcaoInput } from "../types";
import type { Database } from "@/lib/supabase/types";

type Location = Database["public"]["Tables"]["locations"]["Row"];

const OPCAO_VAZIA: NovaOpcaoInput = {
  dataISO: "",
  horaMinuto: "16:00",
  modalidade: "presencial",
  locationId: null,
  linkOnline: null,
};

interface EditorOpcoesProps {
  value: NovaOpcaoInput[];
  onChange: (opcoes: NovaOpcaoInput[]) => void;
  locais: Location[];
}

export function EditorOpcoes({ value, onChange, locais }: EditorOpcoesProps) {
  const [repetirAberto, setRepetirAberto] = useState(false);
  const [diasSelecionados, setDiasSelecionados] = useState<Set<string>>(new Set());
  const [repeticao, setRepeticao] = useState({
    horaMinuto: "16:00",
    modalidade: "presencial" as "presencial" | "online",
    locationId: "" as string,
    linkOnline: "",
  });

  function atualizar(indice: number, dados: Partial<NovaOpcaoInput>) {
    onChange(value.map((o, i) => (i === indice ? { ...o, ...dados } : o)));
  }

  function duplicar(indice: number) {
    const original = value[indice];
    onChange([...value, { ...original }]);
  }

  function remover(indice: number) {
    onChange(value.filter((_, i) => i !== indice));
  }

  function adicionarVazia() {
    onChange([...value, { ...OPCAO_VAZIA }]);
  }

  function aplicarRepeticao() {
    const novas = Array.from(diasSelecionados)
      .sort()
      .map((dataISO) => ({
        dataISO,
        horaMinuto: repeticao.horaMinuto,
        modalidade: repeticao.modalidade,
        locationId: repeticao.modalidade === "presencial" ? repeticao.locationId || null : null,
        linkOnline: repeticao.modalidade === "online" ? repeticao.linkOnline || null : null,
      }));
    onChange([...value, ...novas]);
    setDiasSelecionados(new Set());
    setRepetirAberto(false);
  }

  function alternarDia(iso: string) {
    setDiasSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(iso)) novo.delete(iso);
      else novo.add(iso);
      return novo;
    });
  }

  return (
    <div className="space-y-3">
      {value.map((opcao, indice) => (
        <div
          key={indice}
          className="grid gap-2 rounded-[var(--radius-panel)] border border-border bg-surface p-3 sm:grid-cols-[1fr_auto_1fr_1fr_auto_auto]"
        >
          <Input
            type="date"
            aria-label={`Data da opção ${indice + 1}`}
            value={opcao.dataISO}
            onChange={(e) => atualizar(indice, { dataISO: e.target.value })}
          />
          <Input
            type="time"
            aria-label={`Hora da opção ${indice + 1}`}
            value={opcao.horaMinuto}
            onChange={(e) => atualizar(indice, { horaMinuto: e.target.value })}
            className="w-28"
          />
          <Select
            aria-label={`Modalidade da opção ${indice + 1}`}
            value={opcao.modalidade}
            onChange={(e) =>
              atualizar(indice, { modalidade: e.target.value as "presencial" | "online" })
            }
          >
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </Select>
          {opcao.modalidade === "presencial" ? (
            <Select
              aria-label={`Local da opção ${indice + 1}`}
              value={opcao.locationId ?? ""}
              onChange={(e) => atualizar(indice, { locationId: e.target.value || null })}
            >
              <option value="">Local a definir</option>
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              aria-label={`Link da chamada da opção ${indice + 1}`}
              placeholder="Link da chamada"
              value={opcao.linkOnline ?? ""}
              onChange={(e) => atualizar(indice, { linkOnline: e.target.value })}
            />
          )}
          <button
            type="button"
            onClick={() => duplicar(indice)}
            className="rounded-[var(--radius-control)] border border-border p-2 text-ink-muted hover:bg-paper"
            aria-label="Duplicar opção"
          >
            <Copy className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => remover(indice)}
            className="rounded-[var(--radius-control)] border border-border p-2 text-alert hover:bg-paper"
            aria-label="Remover opção"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secundario" onClick={adicionarVazia}>
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Adicionar opção
        </Button>
        <Button type="button" variant="secundario" onClick={() => setRepetirAberto((v) => !v)}>
          <CalendarRange className="h-4 w-4" strokeWidth={1.75} />
          Repetir em vários dias
        </Button>
      </div>

      {repetirAberto && (
        <div className="space-y-3 rounded-[var(--radius-panel)] border border-border bg-paper p-4">
          <MiniCalendario selecionadas={diasSelecionados} onToggle={alternarDia} />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              type="time"
              aria-label="Hora dos dias repetidos"
              value={repeticao.horaMinuto}
              onChange={(e) => setRepeticao({ ...repeticao, horaMinuto: e.target.value })}
            />
            <Select
              aria-label="Modalidade dos dias repetidos"
              value={repeticao.modalidade}
              onChange={(e) =>
                setRepeticao({
                  ...repeticao,
                  modalidade: e.target.value as "presencial" | "online",
                })
              }
            >
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </Select>
            {repeticao.modalidade === "presencial" ? (
              <Select
                aria-label="Local dos dias repetidos"
                value={repeticao.locationId}
                onChange={(e) => setRepeticao({ ...repeticao, locationId: e.target.value })}
              >
                <option value="">Local a definir</option>
                {locais.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                aria-label="Link da chamada dos dias repetidos"
                placeholder="Link da chamada"
                value={repeticao.linkOnline}
                onChange={(e) => setRepeticao({ ...repeticao, linkOnline: e.target.value })}
              />
            )}
          </div>
          <Button
            type="button"
            onClick={aplicarRepeticao}
            disabled={diasSelecionados.size === 0}
          >
            Adicionar {diasSelecionados.size || ""} opções
          </Button>
        </div>
      )}
    </div>
  );
}
