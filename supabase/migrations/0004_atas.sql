-- Fase 3: pauta, modo reunião, atas e encaminhamentos.

create type public.minute_status as enum ('rascunho', 'em_revisao', 'aprovada');
create type public.attendance_status as enum ('presente', 'ausente', 'justificado');
create type public.note_tipo as enum ('nota', 'decisao', 'encaminhamento', 'duvida');
create type public.action_item_status as enum ('pendente', 'em_andamento', 'concluido');

-- ---------------------------------------------------------------------------
-- reuniões: quem pode escrever a ata desta reunião especificamente
-- (permissão temporária concedida pela coordenação, além da própria
-- coordenação, que sempre pode).
-- ---------------------------------------------------------------------------
alter table public.meetings add column relator_id uuid references public.profiles(id) on delete set null;

create or replace function public.pode_editar_ata(p_meeting_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_coordenacao() or exists (
    select 1 from public.meetings
    where id = p_meeting_id and relator_id = public.current_profile_id()
  );
$$;

-- ---------------------------------------------------------------------------
-- agenda_items (pauta)
-- ---------------------------------------------------------------------------
create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  titulo text not null,
  ordem integer not null default 0,
  sugerido_por uuid references public.profiles(id) on delete set null,
  aceito boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- attendance (presença)
-- ---------------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  visitante_nome text,
  visitante_instituicao text,
  status public.attendance_status not null default 'ausente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_pessoa_check check (
    (profile_id is not null and visitante_nome is null)
    or (profile_id is null and visitante_nome is not null)
  ),
  unique (meeting_id, profile_id)
);

create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- minutes (a ata em si — 1 por reunião)
-- ---------------------------------------------------------------------------
create table public.minutes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null unique references public.meetings(id) on delete cascade,
  status public.minute_status not null default 'rascunho',
  relato jsonb not null default '{}'::jsonb,
  proxima_reuniao_id uuid references public.meetings(id) on delete set null,
  reporter_id uuid references public.profiles(id) on delete set null,
  aprovada_por uuid references public.profiles(id) on delete set null,
  aprovada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger minutes_set_updated_at
  before update on public.minutes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- action_items (encaminhamentos) — criada antes de minute_notes porque
-- minute_notes referencia de volta.
-- ---------------------------------------------------------------------------
create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.minutes(id) on delete cascade,
  descricao text not null,
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo date,
  status public.action_item_status not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger action_items_set_updated_at
  before update on public.action_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- minute_notes (anotações rápidas do modo reunião)
-- ---------------------------------------------------------------------------
create table public.minute_notes (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.minutes(id) on delete cascade,
  agenda_item_id uuid references public.agenda_items(id) on delete set null,
  autor_id uuid references public.profiles(id) on delete set null,
  texto text not null,
  tipo public.note_tipo not null default 'nota',
  action_item_id uuid references public.action_items(id) on delete set null,
  hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- minute_comments (comentários na revisão)
-- ---------------------------------------------------------------------------
create table public.minute_comments (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.minutes(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- minute_pdfs (versões geradas)
-- ---------------------------------------------------------------------------
create table public.minute_pdfs (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.minutes(id) on delete cascade,
  versao integer not null,
  storage_path text not null,
  gerado_por uuid references public.profiles(id) on delete set null,
  gerado_em timestamptz not null default now(),
  unique (minutes_id, versao)
);

-- ---------------------------------------------------------------------------
-- attachments (fotos anexadas à ata)
-- ---------------------------------------------------------------------------
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.minutes(id) on delete cascade,
  storage_path text not null,
  nome text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.agenda_items enable row level security;
alter table public.attendance enable row level security;
alter table public.minutes enable row level security;
alter table public.action_items enable row level security;
alter table public.minute_notes enable row level security;
alter table public.minute_comments enable row level security;
alter table public.minute_pdfs enable row level security;
alter table public.attachments enable row level security;

-- agenda_items: leitura geral; participante pode sugerir item próprio
-- (aceito=false); só quem edita a ata (coordenação/relator) aceita, reordena
-- ou remove, ou insere já aceito.
create policy agenda_items_select on public.agenda_items for select
  using (auth.uid() is not null);
create policy agenda_items_insert on public.agenda_items for insert
  with check (
    public.pode_editar_ata(meeting_id)
    or (sugerido_por = public.current_profile_id() and aceito = false)
  );
create policy agenda_items_update on public.agenda_items for update
  using (public.pode_editar_ata(meeting_id));
create policy agenda_items_delete on public.agenda_items for delete
  using (
    public.pode_editar_ata(meeting_id)
    or (sugerido_por = public.current_profile_id() and aceito = false)
  );

-- attendance: leitura geral; escrita de quem edita a ata.
create policy attendance_select on public.attendance for select
  using (auth.uid() is not null);
create policy attendance_write on public.attendance for all
  using (public.pode_editar_ata(meeting_id))
  with check (public.pode_editar_ata(meeting_id));

-- minutes: leitura geral (grupo pequeno); escrita de quem edita a ata,
-- exceto aprovar, que é só coordenação (guardado também na app).
create policy minutes_select on public.minutes for select
  using (auth.uid() is not null);
create policy minutes_insert on public.minutes for insert
  with check (public.pode_editar_ata(meeting_id));
create policy minutes_update on public.minutes for update
  using (public.pode_editar_ata(meeting_id));

-- action_items: leitura geral; responsável muda status do próprio item,
-- coordenação/relator da ata de origem gerencia tudo.
create policy action_items_select on public.action_items for select
  using (auth.uid() is not null);
create policy action_items_write on public.action_items for all
  using (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  )
  with check (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  );
create policy action_items_update_responsavel on public.action_items for update
  using (responsavel_id = public.current_profile_id())
  with check (responsavel_id = public.current_profile_id());

-- minute_notes: leitura geral; escrita de quem edita a ata correspondente.
create policy minute_notes_select on public.minute_notes for select
  using (auth.uid() is not null);
create policy minute_notes_write on public.minute_notes for all
  using (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  )
  with check (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  );

-- minute_comments: leitura geral; cada um escreve o próprio comentário.
create policy minute_comments_select on public.minute_comments for select
  using (auth.uid() is not null);
create policy minute_comments_insert on public.minute_comments for insert
  with check (profile_id = public.current_profile_id());
create policy minute_comments_delete on public.minute_comments for delete
  using (
    profile_id = public.current_profile_id()
    or exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  );

-- minute_pdfs: leitura geral; só quem edita a ata gera.
create policy minute_pdfs_select on public.minute_pdfs for select
  using (auth.uid() is not null);
create policy minute_pdfs_insert on public.minute_pdfs for insert
  with check (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  );

-- attachments: leitura geral; só quem edita a ata anexa/remove.
create policy attachments_select on public.attachments for select
  using (auth.uid() is not null);
create policy attachments_write on public.attachments for all
  using (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  )
  with check (
    exists (
      select 1 from public.minutes m
      where m.id = minutes_id and public.pode_editar_ata(m.meeting_id)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: bucket privado para fotos e PDFs das atas. A checagem fina de
-- "só quem edita esta ata específica" fica na aplicação (server actions já
-- validam pode_editar_ata antes de subir); aqui, RLS só exige autenticação —
-- consistente com o resto do app (grupo pequeno e de confiança).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('atas', 'atas', false)
on conflict (id) do nothing;

create policy atas_storage_select on storage.objects for select
  using (bucket_id = 'atas' and auth.uid() is not null);
create policy atas_storage_insert on storage.objects for insert
  with check (bucket_id = 'atas' and auth.uid() is not null);
create policy atas_storage_delete on storage.objects for delete
  using (bucket_id = 'atas' and auth.uid() is not null);
