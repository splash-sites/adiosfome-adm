-- Habilita Supabase Realtime na tabela orders, usado pelo painel admin
-- pra receber novos pedidos ao vivo (secao "Pedidos" do 02-documento-admin.md).

alter publication supabase_realtime add table orders;
