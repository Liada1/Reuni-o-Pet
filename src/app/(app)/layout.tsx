import { redirect } from "next/navigation";
import { getCurrentProfile, ContaPendente, ContaInativa } from "@/features/auth";
import { getProgramaSettings } from "@/features/configuracoes";
import { NavShell } from "@/components/ui/nav-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const perfil = await getCurrentProfile();
  const programa = await getProgramaSettings();

  if (!perfil) {
    redirect("/entrar?erro=sem-cadastro");
  }

  if (perfil.status === "pendente") {
    return <ContaPendente nomePrograma={programa.nome_programa} />;
  }

  if (perfil.status === "inativo") {
    return <ContaInativa />;
  }

  return (
    <NavShell
      nomePrograma={programa.nome_programa}
      nomeGrupo={programa.nome_grupo}
      usuario={{
        nomeExibicao: perfil.nome_exibicao,
        fotoUrl: perfil.foto_url,
        role: perfil.role,
      }}
    >
      {children}
    </NavShell>
  );
}
