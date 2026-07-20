-- Faltava policy de delete em order_items pro dono do restaurante.
-- Necessaria pra permitir excluir um produto que so tem pedidos
-- cancelados vinculados (limpa os order_items desses pedidos antes
-- de excluir o produto).

create policy "order_items_delete_owner" on order_items
  for delete
  using (
    exists (
      select 1 from orders o
      join restaurants r on r.id = o.restaurant_id
      where o.id = order_items.order_id and r.owner_id = auth.uid()
    )
  );
