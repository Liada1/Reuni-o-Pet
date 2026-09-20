"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { enviarLinkMagico, entrarComGoogle } from "../actions";
import { GoogleIcon } from "./google-icon";

export function EntrarForm({ erroInicial }: { erroInicial?: string }) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(mensagemErro(erroInicial));
  const [enviado, setEnviado] = useState(false);
  const [pending, startTransition] = useTransition();

  function enviarEmail() {
    if (!email) return;
    setErro(null);
    startTransition(async () => {
      const { erro } = await enviarLinkMagico(email, { next: "/" });
      if (erro) setErro(erro);
      else setEnviado(true);
    });
  }

  function entrarGoogle() {
    setErro(null);
    startTransition(async () => {
      const { erro, url } = await entrarComGoogle({ next: "/" });
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
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarEmail()}
        />
      </div>
      {erro && <p className="text-sm text-alert">{erro}</p>}
      <Button type="button" className="w-full" onClick={enviarEmail} disabled={pending}>
        Enviar link mágico
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
        onClick={entrarGoogle}
        disabled={pending}
      >
        <GoogleIcon className="h-4 w-4" />
        Entrar com Google
      </Button>
    </div>
  );
}

function mensagemErro(codigo?: string) {
  if (codigo === "sem-cadastro") {
    return "Esse e-mail ainda não está cadastrado. Peça um link de convite à coordenação.";
  }
  if (codigo === "link-invalido") {
    return "O link expirou ou já foi usado. Tente entrar novamente.";
  }
  return null;
}
