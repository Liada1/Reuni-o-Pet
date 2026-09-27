-- Fase 6 — segurança. As regras antigas confiavam na aplicação; quem chama a
-- API do Supabase direto (com a chave pública) passava por fora dela.

-- ---------------------------------------------------------------------------
-- 1. Criar perfil é só da coordenação. Quem entra por convite ganha o perfil
-- pelo callback, com a service role; a regra antiga deixava qualquer conta
-- inserir o próprio perfil já como coordenação ativa.
-- ---------------------------------------------------------------------------
drop policy profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (public.is_coordenacao());

-- ---------------------------------------------------------------------------
-- 2. Ler dados do grupo exige perfil ativo, não só estar logado.
-- ---------------------------------------------------------------------------
create or replace function public.is_ativo()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid()
      and status = 'ativo'
  );
$$;

-- a própria linha continua legível: é ela que mostra a tela de conta pendente
drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth_user_id = auth.uid() or public.is_ativo());

drop policy meetings_select on public.meetings;
create policy meetings_select on public.meetings for select using (public.is_ativo());

drop policy polls_select on public.polls;
create policy polls_select on public.polls for select using (public.is_ativo());

drop policy poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select using (public.is_ativo());

drop policy poll_voters_select on public.poll_voters;
create policy poll_voters_select on public.poll_voters for select using (public.is_ativo());

drop policy poll_votes_select on public.poll_votes;
create policy poll_votes_select on public.poll_votes for select using (public.is_ativo());

drop policy poll_comments_select on public.poll_comments;
create policy poll_comments_select on public.poll_comments for select using (public.is_ativo());

drop policy agenda_items_select on public.agenda_items;
create policy agenda_items_select on public.agenda_items for select using (public.is_ativo());

drop policy attendance_select on public.attendance;
create policy attendance_select on public.attendance for select using (public.is_ativo());

drop policy minutes_select on public.minutes;
create policy minutes_select on public.minutes for select using (public.is_ativo());

drop policy action_items_select on public.action_items;
create policy action_items_select on public.action_items for select using (public.is_ativo());

drop policy minute_notes_select on public.minute_notes;
create policy minute_notes_select on public.minute_notes for select using (public.is_ativo());

drop policy minute_comments_select on public.minute_comments;
create policy minute_comments_select on public.minute_comments for select using (public.is_ativo());

drop policy minute_pdfs_select on public.minute_pdfs;
create policy minute_pdfs_select on public.minute_pdfs for select using (public.is_ativo());

drop policy attachments_select on public.attachments;
create policy attachments_select on public.attachments for select using (public.is_ativo());

drop policy formacoes_select on public.formacoes;
create policy formacoes_select on public.formacoes for select using (public.is_ativo());

-- ---------------------------------------------------------------------------
-- 3. Bucket `atas`: enviar e apagar só quem edita a ata do caminho. Fotos e
-- PDFs já são gravados em `minutes/<minutes_id>/...`.
-- ---------------------------------------------------------------------------
create or replace function public.pode_editar_arquivo_ata(p_nome text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.minutes m
    where (storage.foldername(p_nome))[1] = 'minutes'
      and m.id::text = (storage.foldername(p_nome))[2]
      and public.pode_editar_ata(m.meeting_id)
  );
$$;

drop policy atas_storage_select on storage.objects;
create policy atas_storage_select on storage.objects for select
  using (bucket_id = 'atas' and public.is_ativo());

drop policy atas_storage_insert on storage.objects;
create policy atas_storage_insert on storage.objects for insert
  with check (bucket_id = 'atas' and public.pode_editar_arquivo_ata(name));

drop policy atas_storage_delete on storage.objects;
create policy atas_storage_delete on storage.objects for delete
  using (bucket_id = 'atas' and public.pode_editar_arquivo_ata(name));

-- ---------------------------------------------------------------------------
-- 4. Só a coordenação aprova ata. O relator pode editar `minutes`, e antes
-- podia gravar status = 'aprovada' direto pela API.
-- ---------------------------------------------------------------------------
create or replace function public.guard_aprovacao_ata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service role e scripts (sem usuário) não passam pela regra
  if auth.uid() is null or public.is_coordenacao() then
    return new;
  end if;

  if new.status = 'aprovada'
    and (tg_op = 'INSERT' or old.status is distinct from 'aprovada') then
    raise exception 'Só a coordenação aprova a ata.';
  end if;

  return new;
end;
$$;

create trigger minutes_guard_aprovacao
  before insert or update on public.minutes
  for each row execute function public.guard_aprovacao_ata();
