-- Bucket publico pra imagem de produtos. Path esperado: {restaurant_id}/{arquivo}
-- Leitura publica vem de bucket public=true; escrita restrita ao dono do restaurante.

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- objects.name precisa vir qualificado: dentro do EXISTS ha uma tabela
-- restaurants que TAMBEM tem coluna "name", e um "name" desqualificado
-- resolve pro escopo mais interno (restaurants.name), nao pro arquivo
-- que esta sendo verificado. Isso silenciosamente quebra a policy
-- (RLS nega tudo, sem erro de sintaxe).

create policy "products_images_insert_owner" on storage.objects
  for insert
  with check (
    bucket_id = 'products'
    and exists (
      select 1 from public.restaurants r
      where r.owner_id = auth.uid()
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "products_images_update_owner" on storage.objects
  for update
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.restaurants r
      where r.owner_id = auth.uid()
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "products_images_delete_owner" on storage.objects
  for delete
  using (
    bucket_id = 'products'
    and exists (
      select 1 from public.restaurants r
      where r.owner_id = auth.uid()
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );
