import type { ReuniaoComDetalhes } from "@/features/agenda";

export interface SemanaPlanejada {
  inicioISO: string;
  fimISO: string;
  /** Encontros não cancelados que começam dentro da semana. */
  encontros: ReuniaoComDetalhes[];
  minutos: number;
  /** A semana já passou inteira no fuso do grupo? */
  encerrada: boolean;
  contemHoje: boolean;
  cumpreEncontros: boolean;
  cumpreHoras: boolean;
}

export interface TipoObrigatorioNoMes {
  id: string;
  nome: string;
  cor: string;
  quantidade: number;
}

/** Uma linha do cronograma do mês, pronta para exportar em CSV ou PDF. */
export interface LinhaCronograma {
  data: string;
  hora: string;
  tipo: string;
  titulo: string;
  modalidade: string;
  local: string;
  minutos: number;
  status: string;
}

export interface PlanoDoMes {
  mesISO: string;
  /** Todos os encontros da grade, achatados para exportação. */
  cronograma: LinhaCronograma[];
  metaEncontros: number;
  metaHoras: number;
  semanas: SemanaPlanejada[];
  totalEncontros: number;
  totalMinutos: number;
  /** Tipos marcados como obrigatórios no mês, com quantos houve de cada. */
  tiposObrigatorios: TipoObrigatorioNoMes[];
}
