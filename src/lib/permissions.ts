import type { Database, ProfileRole } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function isCoordenacao(profile: Pick<Profile, "role" | "status"> | null) {
  return !!profile && profile.role === "coordenacao" && profile.status === "ativo";
}

export function isAtivo(profile: Pick<Profile, "status"> | null) {
  return !!profile && profile.status === "ativo";
}

export function podeVer(profile: Pick<Profile, "role" | "status"> | null, perfis: ProfileRole[]) {
  return !!profile && profile.status === "ativo" && perfis.includes(profile.role);
}
