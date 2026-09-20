export type ProfileRole = "coordenacao" | "participante" | "relator";
export type ProfileStatus = "pendente" | "ativo" | "inativo";
export type PollStatus = "aberta" | "fechada" | "confirmada";
export type PollPublico = "todos" | "gat" | "pessoas";
export type PollVoto = "pode" | "se_precisar";
export type Modalidade = "presencial" | "online";
export type MeetingStatus =
  | "agendada"
  | "em_andamento"
  | "realizada"
  | "cancelada"
  | "remarcada";

export interface Database {
  public: {
    Tables: {
      gats: {
        Row: {
          id: string;
          nome: string;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          ativo?: boolean;
        };
        Relationships: [];
      };
      meeting_types: {
        Row: {
          id: string;
          nome: string;
          cor: string;
          duracao_padrao_minutos: number;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cor?: string;
          duracao_padrao_minutos?: number;
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          cor?: string;
          duracao_padrao_minutos?: number;
          ativo?: boolean;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          nome: string;
          endereco: string | null;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          endereco?: string | null;
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          endereco?: string | null;
          ativo?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          nome_completo: string;
          nome_exibicao: string;
          email: string;
          telefone: string | null;
          foto_url: string | null;
          gat_id: string | null;
          role: ProfileRole;
          status: ProfileStatus;
          invite_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          nome_completo: string;
          nome_exibicao: string;
          email: string;
          telefone?: string | null;
          foto_url?: string | null;
          gat_id?: string | null;
          role?: ProfileRole;
          status?: ProfileStatus;
          invite_id?: string | null;
        };
        Update: {
          auth_user_id?: string | null;
          nome_completo?: string;
          nome_exibicao?: string;
          email?: string;
          telefone?: string | null;
          foto_url?: string | null;
          gat_id?: string | null;
          role?: ProfileRole;
          status?: ProfileStatus;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_gat_id_fkey";
            columns: ["gat_id"];
            isOneToOne: false;
            referencedRelation: "gats";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          code: string;
          role: ProfileRole;
          gat_id: string | null;
          created_by: string | null;
          expires_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          role?: ProfileRole;
          gat_id?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invites_gat_id_fkey";
            columns: ["gat_id"];
            isOneToOne: false;
            referencedRelation: "gats";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          key: string;
          value: Record<string, unknown>;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Record<string, unknown>;
          updated_by?: string | null;
        };
        Update: {
          value?: Record<string, unknown>;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      meetings: {
        Row: {
          id: string;
          meeting_type_id: string;
          titulo: string | null;
          inicio: string;
          fim_previsto: string;
          inicio_real: string | null;
          fim_real: string | null;
          modalidade: Modalidade;
          location_id: string | null;
          link_online: string | null;
          status: MeetingStatus;
          poll_id: string | null;
          motivo_remarcacao_cancelamento: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_type_id: string;
          titulo?: string | null;
          inicio: string;
          fim_previsto: string;
          inicio_real?: string | null;
          fim_real?: string | null;
          modalidade?: Modalidade;
          location_id?: string | null;
          link_online?: string | null;
          status?: MeetingStatus;
          poll_id?: string | null;
          motivo_remarcacao_cancelamento?: string | null;
          created_by?: string | null;
        };
        Update: {
          titulo?: string | null;
          inicio?: string;
          fim_previsto?: string;
          inicio_real?: string | null;
          fim_real?: string | null;
          modalidade?: Modalidade;
          location_id?: string | null;
          link_online?: string | null;
          status?: MeetingStatus;
          motivo_remarcacao_cancelamento?: string | null;
        };
        Relationships: [];
      };
      polls: {
        Row: {
          id: string;
          code: string;
          titulo: string;
          descricao: string | null;
          meeting_type_id: string;
          duracao_minutos: number;
          prazo_votacao: string | null;
          publico_alvo: PollPublico;
          gat_id: string | null;
          votos_visiveis: boolean;
          status: PollStatus;
          confirmed_option_id: string | null;
          meeting_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          titulo: string;
          descricao?: string | null;
          meeting_type_id: string;
          duracao_minutos?: number;
          prazo_votacao?: string | null;
          publico_alvo?: PollPublico;
          gat_id?: string | null;
          votos_visiveis?: boolean;
          status?: PollStatus;
          created_by?: string | null;
        };
        Update: {
          status?: PollStatus;
          confirmed_option_id?: string | null;
          meeting_id?: string | null;
        };
        Relationships: [];
      };
      poll_options: {
        Row: {
          id: string;
          poll_id: string;
          inicio: string;
          modalidade: Modalidade;
          location_id: string | null;
          link_online: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          inicio: string;
          modalidade?: Modalidade;
          location_id?: string | null;
          link_online?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      poll_voters: {
        Row: {
          poll_id: string;
          profile_id: string;
        };
        Insert: {
          poll_id: string;
          profile_id: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      poll_votes: {
        Row: {
          id: string;
          option_id: string;
          profile_id: string;
          valor: PollVoto;
          created_at: string;
        };
        Insert: {
          id?: string;
          option_id: string;
          profile_id: string;
          valor: PollVoto;
        };
        Update: {
          valor?: PollVoto;
        };
        Relationships: [];
      };
      poll_comments: {
        Row: {
          id: string;
          poll_id: string;
          profile_id: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          profile_id: string;
          texto: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
