export type ProfileRole = "coordenacao" | "participante" | "relator";
export type ProfileStatus = "pendente" | "ativo" | "inativo";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
