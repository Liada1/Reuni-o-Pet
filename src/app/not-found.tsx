import Link from "next/link";
import { SearchX } from "lucide-react";
import { EstadoVazio } from "@/components/ui/estado-vazio";

export const metadata = { title: "Página não encontrada" };

export default function NaoEncontrado() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="sr-only">Página não encontrada</h1>
        <EstadoVazio
          icone={SearchX}
          titulo="Página não encontrada"
          descricao="O link pode estar errado, ou o que ele apontava foi removido."
          acao={
            <Link href="/" className="text-sm font-medium text-primary underline">
              Voltar ao início
            </Link>
          }
        />
      </div>
    </main>
  );
}
