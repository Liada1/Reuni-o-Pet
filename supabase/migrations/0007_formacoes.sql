-- Fase 4: formação bimestral.
--
-- A formação sempre acontece dentro de um encontro já agendado (tipo
-- "Formação bimestral"), por isso a tabela pendura no meeting em vez de
-- repetir data/local. O que ela acrescenta é o que o encontro não sabe:
-- o tema e a carga horária certificada, que pode divergir da duração real
-- da reunião — e é ela que entra no cômputo de horas quando existe.

create table public.formacoes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  tema text not null,
  carga_horaria_minutos integer not null default 120,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint formacoes_carga_horaria_check check (carga_horaria_minutos > 0)
);

create trigger formacoes_set_updated_at
  before update on public.formacoes
  for each row execute function public.set_updated_at();

alter table public.formacoes enable row level security;

-- Leitura geral (grupo pequeno); só a coordenação registra e edita.
create policy formacoes_select on public.formacoes for select
  using (auth.uid() is not null);
create policy formacoes_write on public.formacoes for all
  using (public.is_coordenacao())
  with check (public.is_coordenacao());
