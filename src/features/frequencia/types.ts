export interface SemanaDaPessoa {
  inicioISO: string;
  fimISO: string;
  encontros: number;
  minutos: number;
  cumpreEncontros: boolean;
  cumpreHoras: boolean;
}

export interface FrequenciaPessoa {
  perfilId: string;
  nome: string;
  nomeCompleto: string;
  presentes: number;
  justificadas: number;
  ausentes: number;
  /** Minutos somados só dos encontros em que a pessoa esteve presente. */
  minutos: number;
  /** Presenças sobre o total de encontros realizados no mês, em %. */
  percentual: number;
  semanas: SemanaDaPessoa[];
}

export interface RelatorioFrequencia {
  mesISO: string;
  metaEncontros: number;
  metaHoras: number;
  /** Encontros realizados no mês — o denominador do percentual. */
  totalEncontros: number;
  pessoas: FrequenciaPessoa[];
}
