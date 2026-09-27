-- Fase 6, segunda parte.

-- ---------------------------------------------------------------------------
-- 1. Perfil pendente ou inativo não age pelo grupo. `current_profile_id` é o
-- que as regras de escrita usam (votar, comentar, sugerir tópico, mudar o
-- próprio encaminhamento, relator editar a ata); só devolvendo perfil ativo,
-- todas passam a exigir conta aprovada de uma vez.
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.profiles
  where auth_user_id = auth.uid() and status = 'ativo'
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 2. Ata aprovada é documento fechado: relato, anotações, anexos, presença e
-- pauta não mudam mais — a tela já escondia a edição, agora o banco recusa.
-- Ficam de fora: gerar PDF de novo (minute_pdfs e o bucket) e o status dos
-- encaminhamentos, que continuam andando depois da aprovação.
-- ---------------------------------------------------------------------------
create or replace function public.ata_aprovada(p_minutes_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.minutes where id = p_minutes_id and status = 'aprovada');
$$;

create or replace function public.ata_aprovada_da_reuniao(p_meeting_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.minutes where meeting_id = p_meeting_id and status = 'aprovada');
$$;

-- o `with check` explícito é necessário: sem ele o Postgres aplica o `using`
-- à linha nova, e aprovar (status novo = 'aprovada') seria recusado
drop policy minutes_update on public.minutes;
create policy minutes_update on public.minutes for update
  using (public.pode_editar_ata(meeting_id) and status <> 'aprovada')
  with check (public.pode_editar_ata(meeting_id));

drop policy minute_notes_write on public.minute_notes;
create policy minute_notes_write on public.minute_notes for all
  using (
    not public.ata_aprovada(minutes_id)
    and exists (select 1 from public.minutes m where m.id = minutes_id and public.pode_editar_ata(m.meeting_id))
  )
  with check (
    not public.ata_aprovada(minutes_id)
    and exists (select 1 from public.minutes m where m.id = minutes_id and public.pode_editar_ata(m.meeting_id))
  );

drop policy attachments_write on public.attachments;
create policy attachments_write on public.attachments for all
  using (
    not public.ata_aprovada(minutes_id)
    and exists (select 1 from public.minutes m where m.id = minutes_id and public.pode_editar_ata(m.meeting_id))
  )
  with check (
    not public.ata_aprovada(minutes_id)
    and exists (select 1 from public.minutes m where m.id = minutes_id and public.pode_editar_ata(m.meeting_id))
  );

drop policy attendance_write on public.attendance;
create policy attendance_write on public.attendance for all
  using (public.pode_editar_ata(meeting_id) and not public.ata_aprovada_da_reuniao(meeting_id))
  with check (public.pode_editar_ata(meeting_id) and not public.ata_aprovada_da_reuniao(meeting_id));

drop policy agenda_items_insert on public.agenda_items;
create policy agenda_items_insert on public.agenda_items for insert
  with check (
    not public.ata_aprovada_da_reuniao(meeting_id)
    and (
      public.pode_editar_ata(meeting_id)
      or (sugerido_por = public.current_profile_id() and aceito = false)
    )
  );

drop policy agenda_items_update on public.agenda_items;
create policy agenda_items_update on public.agenda_items for update
  using (public.pode_editar_ata(meeting_id) and not public.ata_aprovada_da_reuniao(meeting_id));

drop policy agenda_items_delete on public.agenda_items;
create policy agenda_items_delete on public.agenda_items for delete
  using (
    not public.ata_aprovada_da_reuniao(meeting_id)
    and (
      public.pode_editar_ata(meeting_id)
      or (sugerido_por = public.current_profile_id() and aceito = false)
    )
  );
