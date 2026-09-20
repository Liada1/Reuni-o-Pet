import type { LucideIcon } from "lucide-react";
import {
  Home,
  CalendarDays,
  FileText,
  ListChecks,
  GraduationCap,
  Clock,
  Users,
  Settings,
} from "lucide-react";
import type { ProfileRole } from "@/lib/supabase/types";

export interface ModuleConfig {
  chave: string;
  nome: string;
  rota: string;
  icone: LucideIcon;
  perfis: ProfileRole[];
  ativo: boolean;
}

/**
 * Registro central de módulos/rotas. Para adicionar uma funcionalidade
 * nova: criar a pasta em src/features/<modulo> e registrar a entrada aqui
 * com `ativo: true`. Módulos com `ativo: false` existem no código mas não
 * aparecem na navegação (fases futuras).
 */
export const modules: ModuleConfig[] = [
  {
    chave: "painel",
    nome: "Início",
    rota: "/",
    icone: Home,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: true,
  },
  {
    chave: "enquetes",
    nome: "Enquetes",
    rota: "/enquetes",
    icone: ListChecks,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: true,
  },
  {
    chave: "agenda",
    nome: "Agenda",
    rota: "/agenda",
    icone: CalendarDays,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: true,
  },
  {
    chave: "atas",
    nome: "Atas",
    rota: "/atas",
    icone: FileText,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: false,
  },
  {
    chave: "formacao",
    nome: "Formação",
    rota: "/formacao",
    icone: GraduationCap,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: false,
  },
  {
    chave: "frequencia",
    nome: "Frequência",
    rota: "/frequencia",
    icone: Clock,
    perfis: ["coordenacao", "participante", "relator"],
    ativo: false,
  },
  {
    chave: "membros",
    nome: "Membros",
    rota: "/membros",
    icone: Users,
    perfis: ["coordenacao"],
    ativo: true,
  },
  {
    chave: "configuracoes",
    nome: "Configurações",
    rota: "/configuracoes",
    icone: Settings,
    perfis: ["coordenacao"],
    ativo: true,
  },
];

export function modulosParaPerfil(role: ProfileRole) {
  return modules.filter((m) => m.ativo && m.perfis.includes(role));
}
