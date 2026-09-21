import type { Database } from "@/lib/supabase/types";
import type { ReuniaoComDetalhes } from "@/features/agenda";

export type Formacao = Database["public"]["Tables"]["formacoes"]["Row"];

export interface FormacaoComReuniao extends Formacao {
  meetings: ReuniaoComDetalhes | null;
}

/** Um bimestre do ano com a formação que aconteceu nele, se houve. */
export interface BimestreComFormacao {
  numero: 1 | 2 | 3 | 4 | 5 | 6;
  inicioISO: string;
  fimISO: string;
  /** Encontros do tipo "formação" no bimestre, do mais recente pro mais antigo. */
  encontros: {
    reuniao: ReuniaoComDetalhes;
    formacao: Formacao | null;
  }[];
}
