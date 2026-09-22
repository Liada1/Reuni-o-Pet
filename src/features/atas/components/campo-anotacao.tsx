"use client";

import { useRef, useState } from "react";
import { Camera, Mic, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultadoDitado {
  results: { 0: { transcript: string } }[];
}

interface ReconhecimentoDeVoz {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: ResultadoDitado) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type JanelaComDitado = Window & {
  SpeechRecognition?: new () => ReconhecimentoDeVoz;
  webkitSpeechRecognition?: new () => ReconhecimentoDeVoz;
};

interface CampoAnotacaoProps {
  onEnviar: (texto: string) => void;
  onFoto: (nome: string, base64: string, contentType: string) => void;
}

export function CampoAnotacao({ onEnviar, onFoto }: CampoAnotacaoProps) {
  const [texto, setTexto] = useState("");
  const [gravando, setGravando] = useState(false);
  const reconhecimentoRef = useRef<ReconhecimentoDeVoz | null>(null);

  const Construtor =
    typeof window !== "undefined"
      ? ((window as JanelaComDitado).SpeechRecognition ??
        (window as JanelaComDitado).webkitSpeechRecognition)
      : undefined;

  function alternarDitado() {
    if (!Construtor) return;
    if (gravando) {
      reconhecimentoRef.current?.stop();
      return;
    }
    const reconhecimento = new Construtor();
    reconhecimento.lang = "pt-BR";
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.onresult = (evento) => {
      const transcricao = evento.results[0]?.[0]?.transcript ?? "";
      setTexto((prev) => (prev ? `${prev} ${transcricao}` : transcricao));
    };
    reconhecimento.onend = () => setGravando(false);
    reconhecimento.onerror = () => setGravando(false);
    reconhecimentoRef.current = reconhecimento;
    reconhecimento.start();
    setGravando(true);
  }

  function enviar() {
    if (!texto.trim()) return;
    onEnviar(texto.trim());
    setTexto("");
  }

  function selecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = leitor.result as string;
      const base64 = resultado.split(",")[1] ?? "";
      onFoto(arquivo.name, base64, arquivo.type);
    };
    leitor.readAsDataURL(arquivo);
    e.target.value = "";
  }

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-2 border-t border-border bg-surface p-3 [padding-bottom:calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border text-ink-muted hover:bg-paper">
        <Camera className="h-5 w-5" strokeWidth={1.75} />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Tirar foto e anexar à ata"
          className="hidden"
          onChange={selecionarFoto}
        />
      </label>
      <input
        aria-label="Anotação"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && enviar()}
        placeholder="Anotar..."
        className="h-12 flex-1 rounded-full border border-border bg-paper px-4 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-primary"
      />
      {Construtor && (
        <button
          type="button"
          onClick={alternarDitado}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
            gravando
              ? "border-alert bg-alert/10 text-alert"
              : "border-border text-ink-muted hover:bg-paper",
          )}
          aria-label="Ditar anotação"
        >
          <Mic className="h-5 w-5" strokeWidth={1.75} />
        </button>
      )}
      <button
        type="button"
        onClick={enviar}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-fill hover:bg-primary-hover"
        aria-label="Enviar anotação"
      >
        <Send className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
