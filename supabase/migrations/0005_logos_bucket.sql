-- Bucket público para logos do programa/instituição usados no cabeçalho do
-- PDF da ata — não são informação sensível, e URLs públicas evitam ter que
-- assinar link toda vez que o PDF é gerado.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy logos_storage_select on storage.objects for select
  using (bucket_id = 'logos');
create policy logos_storage_write on storage.objects for insert
  with check (bucket_id = 'logos' and public.is_coordenacao());
create policy logos_storage_update on storage.objects for update
  using (bucket_id = 'logos' and public.is_coordenacao());
create policy logos_storage_delete on storage.objects for delete
  using (bucket_id = 'logos' and public.is_coordenacao());
