import { Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "../actions";

export function ContaPendente({ nomePrograma }: { nomePrograma: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <Clock className="h-10 w-10 text-accent" strokeWidth={1.5} />
      <div>
        <p className="font-display text-xl font-semibold text-ink">
          Cadastro em análise
        </p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Seu acesso ao {nomePrograma} foi recebido e está aguardando aprovação
          da coordenação. Você será avisado quando puder entrar.
        </p>
      </div>
      <form action={sair}>
        <Button type="submit" variant="secundario">
          Sair
        </Button>
      </form>
    </div>
  );
}

export function ContaInativa() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <Ban className="h-10 w-10 text-alert" strokeWidth={1.5} />
      <div>
        <p className="font-display text-xl font-semibold text-ink">Conta desativada</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Seu acesso foi desativado pela coordenação. Fale com a coordenação
          se isso for um engano.
        </p>
      </div>
      <form action={sair}>
        <Button type="submit" variant="secundario">
          Sair
        </Button>
      </form>
    </div>
  );
}
