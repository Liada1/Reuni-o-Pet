export interface ProgramaSettings {
  nome_programa: string;
  nome_grupo: string;
  fuso_horario: string;
  logo_pet_url: string | null;
  logo_instituicao_url: string | null;
}

export interface PerfisNomesSettings {
  coordenacao: string;
  participante: string;
  relator: string;
}

export interface MetasSettings {
  encontros_por_semana: number;
  horas_por_semana: number;
  tipos_obrigatorios_por_mes: string[];
}

export interface AtaPdfSettings {
  coluna_assinatura: boolean;
}
