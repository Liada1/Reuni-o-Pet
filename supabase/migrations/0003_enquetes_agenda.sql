-- Fase 2: enquetes de data e agenda/reuniões.

create type public.poll_status as enum ('aberta', 'fechada', 'confirmada');
create type public.poll_publico as enum ('todos', 'gat', 'pessoas');
create type public.poll_voto as enum ('pode', 'se_precisar');
create type public.modalidade as enum ('presencial', 'online');
create type public.meeting_status as enum (
  'agendada', 'em_andamento', 'realizada', 'cancelada', 'remarcada'
);

-- ---------------------------------------------------------------------------
-- meetings (precisa existir antes de polls, que referencia meetings via
-- meeting_id, e antes de polls ser referenciada de volta por meetings)
-- ---------------------------------------------------------------------------
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_type_id uuid not null references public.meeting_types(id),
  titulo text,
  inicio timestamptz not null,
  fim_previsto timestamptz not null,
  inicio_real timestamptz,
  fim_real timestamptz,
  modalidade public.modalidade not null default 'presencial',
  location_id uuid references public.locations(id) on delete set null,
  link_online text,
  status public.meeting_status not null default 'agendada',
  poll_id uuid,
  motivo_remarcacao_cancelamento text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meetings_set_updated_at
  before update on public.meetings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- polls
-- ---------------------------------------------------------------------------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  titulo text not null,
  descricao text,
  meeting_type_id uuid not null references public.meeting_types(id),
  duracao_minutos integer not null default 120,
  prazo_votacao timestamptz,
  publico_alvo public.poll_publico not null default 'todos',
  gat_id uuid references public.gats(id) on delete set null,
  votos_visiveis boolean not null default true,
  status public.poll_status not null default 'aberta',
  confirmed_option_id uuid,
  meeting_id uuid references public.meetings(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger polls_set_updated_at
  before update on public.polls
  for each row execute function public.set_updated_at();

alter table public.meetings
  add constraint meetings_poll_id_fkey
  foreign key (poll_id) references public.polls(id) on delete set null;

-- ---------------------------------------------------------------------------
-- poll_options
-- ---------------------------------------------------------------------------
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  inicio timestamptz not null,
  modalidade public.modalidade not null default 'presencial',
  location_id uuid references public.locations(id) on delete set null,
  link_online text,
  created_at timestamptz not null default now()
);

alter table public.polls
  add constraint polls_confirmed_option_id_fkey
  foreign key (confirmed_option_id) references public.poll_options(id) on delete set null;

-- ---------------------------------------------------------------------------
-- poll_voters (só usado quando publico_alvo = 'pessoas')
-- ---------------------------------------------------------------------------
create table public.poll_voters (
  poll_id uuid not null references public.polls(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (poll_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- poll_votes
-- ---------------------------------------------------------------------------
create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid not null references public.poll_options(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  valor public.poll_voto not null,
  created_at timestamptz not null default now(),
  unique (option_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- poll_comments
-- ---------------------------------------------------------------------------
create table public.poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.meetings enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_voters enable row level security;
alter table public.poll_votes enable row level security;
alter table public.poll_comments enable row level security;

-- meetings: qualquer pessoa autenticada lê (agenda é do grupo todo);
-- só coordenação escreve diretamente (confirmação de enquete usa
-- service role no server action, que já valida coordenação antes).
create policy meetings_select on public.meetings for select
  using (auth.uid() is not null);
create policy meetings_write on public.meetings for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- polls: leitura para qualquer autenticado; escrita restrita à coordenação.
create policy polls_select on public.polls for select
  using (auth.uid() is not null);
create policy polls_write on public.polls for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

create policy poll_options_select on public.poll_options for select
  using (auth.uid() is not null);
create policy poll_options_write on public.poll_options for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

create policy poll_voters_select on public.poll_voters for select
  using (auth.uid() is not null);
create policy poll_voters_write on public.poll_voters for all
  using (public.is_coordenacao()) with check (public.is_coordenacao());

-- poll_votes: qualquer autenticado lê (grid de votos é visível ao grupo,
-- a UI decide se esconde conforme votos_visiveis); cada pessoa só grava/
-- edita/apaga o próprio voto.
create policy poll_votes_select on public.poll_votes for select
  using (auth.uid() is not null);
create policy poll_votes_insert on public.poll_votes for insert
  with check (profile_id = public.current_profile_id());
create policy poll_votes_update on public.poll_votes for update
  using (profile_id = public.current_profile_id());
create policy poll_votes_delete on public.poll_votes for delete
  using (profile_id = public.current_profile_id() or public.is_coordenacao());

-- poll_comments: leitura para autenticados; cada pessoa escreve o próprio.
create policy poll_comments_select on public.poll_comments for select
  using (auth.uid() is not null);
create policy poll_comments_insert on public.poll_comments for insert
  with check (profile_id = public.current_profile_id());
create policy poll_comments_delete on public.poll_comments for delete
  using (profile_id = public.current_profile_id() or public.is_coordenacao());
