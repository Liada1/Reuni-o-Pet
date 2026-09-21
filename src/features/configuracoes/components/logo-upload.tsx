"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";

export function LogoUpload({
  label,
  urlAtual,
  onChange,
}: {
  label: string;
  urlAtual: string | null;
  onChange: (url: string | null) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function selecionar(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      const supabase = createClient();
      const caminho = `${crypto.randomUUID()}-${arquivo.name}`;
      const { error } = await supabase.storage.from("logos").upload(caminho, arquivo, {
        upsert: true,
      });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
      onChange(data.publicUrl);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar logo.");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        {urlAtual ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlAtual} alt={label} className="h-12 w-auto rounded border border-border bg-surface p-1" />
        ) : (
          <span className="text-xs text-ink-muted">Nenhuma imagem</span>
        )}
        <label className="flex h-10 cursor-pointer items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 text-sm text-ink-muted hover:bg-paper">
          <Upload className="h-4 w-4" strokeWidth={1.75} />
          {enviando ? "Enviando…" : "Enviar imagem"}
          <input type="file" accept="image/*" className="hidden" onChange={selecionar} disabled={enviando} />
        </label>
        {urlAtual && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 text-ink-muted hover:text-alert"
            aria-label="Remover logo"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
      {erro && <p className="mt-1 text-xs text-alert">{erro}</p>}
    </div>
  );
}
