"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { enviarLinkMagico, entrarComGoogle } from "../actions";
import { GoogleIcon } from "./google-icon";

export function ConviteForm({ codigo }: { codigo: string }) {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  function dadosBase() {
    return {
      invite: codigo,
      nomeCompleto: nomeCompleto || undefined,
      nomeExibicao: nomeExibicao || nomeCompleto.split(" ")[0] || undefined,
      telefone: telefone || undefined,
      next: "/",
    };
  }

  function validar() {
    if (!nomeCompleto.trim()) return "Informe seu nome completo.";
    if (!email.trim()) return "Informe seu e-mail.";
    return null;
  }

  function comEmail() {
    const msg = validar();
    if (msg) return setErro(msg);
    setErro(null);
    startTransition(async () => {
      const { erro } = await enviarLinkMagico(email, dadosBase());
      if (erro) setErro(erro);
      else setEnviado(true);
    });
  }

  function comGoogle() {
    if (!nomeCompleto.trim()) return setErro("Informe seu nome completo.");
    setErro(null);
    startTransition(async () => {
      const { erro, url } = await entrarComGoogle(dadosBase());
      if (erro || !url) setErro(erro);
      else window.location.href = url;
    });
  }

  if (enviado) {
    return (
      <Surface className="space-y-2 p-6 text-center">
        <Mail className="mx-auto h-8 w-8 text-primary" strokeWidth={1.5} />
        <p className="font-medium text-ink">Verifique seu e-mail</p>
        <p className="text-sm text-ink-muted">
          Enviamos um link de acesso para <strong>{email}</strong>.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c_nome_completo">Nome completo</Label>
          <Input
            id="c_nome_completo"
            value={nomeCompleto}
            onChange={(e) => setNomeCompleto(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c_nome_exibicao">Como prefere ser chamado(a)</Label>
          <Input
            id="c_nome_exibicao"
            placeholder={nomeCompleto.split(" ")[0] || ""}
            value={nomeExibicao}
            onChange={(e) => setNomeExibicao(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c_email">E-mail</Label>
          <Input
            id="c_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="c_telefone">Telefone (opcional)</Label>
          <Input
            id="c_telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
      <Button type="button" className="w-full" onClick={comEmail} disabled={pending}>
        Continuar com e-mail
      </Button>
      <div className="flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button
        type="button"
        variant="secundario"
        className="w-full"
        onClick={comGoogle}
        disabled={pending}
      >
        <GoogleIcon className="h-4 w-4" />
        Continuar com Google
      </Button>
    </div>
  );
}
