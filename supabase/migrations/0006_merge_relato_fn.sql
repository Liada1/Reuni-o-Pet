-- Merge atômico no JSONB de minutes.relato. Evita perda de dados quando
-- vários tópicos salvam o relato "quase ao mesmo tempo" (ex: auto-save do
-- rascunho inicial de cada tópico ao abrir a tela de revisão) — um
-- read-then-write feito no cliente poderia fazer uma chamada sobrescrever
-- a chave que a outra acabou de gravar.
create or replace function public.merge_relato(p_minutes_id uuid, p_chave text, p_texto text)
returns void
language sql
security invoker
as $$
  update public.minutes
  set relato = coalesce(relato, '{}'::jsonb) || jsonb_build_object(p_chave, p_texto)
  where id = p_minutes_id;
$$;
