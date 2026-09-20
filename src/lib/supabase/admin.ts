import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Cliente com a service role key — ignora RLS.
 * Uso restrito a server actions/route handlers que já validaram a sessão
 * do usuário (ex: resolver um código de convite antes do login,
 * vincular auth_user_id a um perfil pré-cadastrado pela coordenação).
 * NUNCA importar em Client Components.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
