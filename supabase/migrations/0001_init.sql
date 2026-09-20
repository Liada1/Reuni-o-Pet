-- Fase 1: perfis, convites, GATs, tipos de encontro, locais e configurações.

create extension if not exists pgcrypto;

create type public.profile_role as enum ('coordenacao', 'participante', 'relator');
create type public.profile_status as enum ('pendente', 'ativo', 'inativo');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- gats
-- ---------------------------------------------------------------------------
create table public.gats (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger gats_set_updated_at
  before update on public.gats
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- meeting_types
-- ---------------------------------------------------------------------------
create table public.meeting_types (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cor text not null default '#2F6B4F',
  duracao_padrao_minutos integer not null default 120,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meeting_types_set_updated_at
  before update on public.meeting_types
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- locations
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  endereco text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nome_completo text not null,
  nome_exibicao text not null,
  email text not null unique,
  telefone text,
  foto_url text,
  gat_id uuid references public.gats(id) on delete set null,
  role public.profile_role not null default 'participante',
  status public.profile_status not null default 'pendente',
  invite_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- invites
-- ---------------------------------------------------------------------------
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  role public.profile_role not null default 'participante',
  gat_id uuid references public.gats(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_invite_id_fkey
  foreign key (invite_id) references public.invites(id) on delete set null;

-- ---------------------------------------------------------------------------
-- settings (chave/valor em JSON, ex: {"programa": {...}}, {"perfis_nomes": {...}})
-- ---------------------------------------------------------------------------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- helpers de papel (security definer para evitar recursão de RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_coordenacao()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and role = 'coordenacao'
      and status = 'ativo'
  );
$$;

-- ---------------------------------------------------------------------------
-- guarda contra auto-promoção: um participante não pode mudar o próprio
-- papel, status, GAT ou vínculo de autenticação por fora da coordenação.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_coordenacao() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.status is distinct from old.status
    or new.gat_id is distinct from old.gat_id then
    raise exception 'Apenas a coordenação pode alterar papel, status ou GAT.';
  end if;

  if new.auth_user_id is distinct from old.auth_user_id
    and old.auth_user_id is not null then
    raise exception 'Não é permitido alterar o vínculo de autenticação.';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileged_fields
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.gats enable row level security;
alter table public.meeting_types enable row level security;
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.settings enable row level security;

-- gats: leitura pública (nomes de GAT não são sensíveis e aparecem na
-- página de convite/login antes do usuário entrar).
create policy gats_select on public.gats for select
  using (true);
create policy gats_write on public.gats for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- meeting_types
create policy meeting_types_select on public.meeting_types for select
  using (true);
create policy meeting_types_write on public.meeting_types for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- locations
create policy locations_select on public.locations for select
  using (true);
create policy locations_write on public.locations for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- profiles: qualquer pessoa autenticada lê todos os perfis (grupo pequeno,
-- necessário para exibir nomes/avatares em votos, presença etc. nas fases
-- seguintes). Escrita é restrita.
create policy profiles_select on public.profiles for select
  using (auth.uid() is not null);
create policy profiles_insert on public.profiles for insert
  with check (auth_user_id = auth.uid() or public.is_coordenacao());
create policy profiles_update on public.profiles for update
  using (auth_user_id = auth.uid() or public.is_coordenacao());
create policy profiles_delete on public.profiles for delete
  using (public.is_coordenacao());

-- invites: geridos só pela coordenação via cliente autenticado; a leitura
-- pública de um código específico (para a página /convite/[codigo]) é feita
-- no servidor com a service role, nunca exposta ao navegador.
create policy invites_all on public.invites for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- settings: leitura pública (nome do programa/grupo aparece na tela de
-- login e convite, antes do usuário entrar).
create policy settings_select on public.settings for select
  using (true);
create policy settings_write on public.settings for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());
