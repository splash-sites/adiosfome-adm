# Documento — Painel Admin (Web)

> Responsável: [preencher nome]
> Consulte sempre o `01-documento-principal.md` antes de mudar algo que afete o banco/API compartilhado, e o `04-arquitetura-tecnica.md` para o padrão de pastas (Clean Architecture/SOLID) e práticas de deploy.

## Objetivo

Aplicação web (acessada via navegador, pensada pra tela de computador/notebook) para o dono do restaurante gerenciar seu cardápio e acompanhar os pedidos recebidos.

## Funcionalidades do MVP

### Autenticação
- Login/cadastro via Supabase Auth (e-mail + senha)
- Ao criar conta, criar automaticamente o registro em `restaurants` vinculado ao `owner_id`

### Configuração do restaurante
- Nome, endereço, telefone
- Taxa de entrega
- Horário de funcionamento
- Slug do cardápio (usado na URL pública — validar unicidade)

### Cardápio (CRUD)
- Categorias: criar, editar, reordenar, excluir
- Produtos: nome, descrição, imagem (upload via Supabase Storage), categoria, ativo/inativo
- Sabores/variações: nome + preço por produto (ex: Pizza Média / Grande, ou sabores)

### Pedidos
- Lista de pedidos em tempo real (Supabase Realtime subscription na tabela `orders` filtrada por `restaurant_id`)
- Filtro por status (recebido, em preparo, saiu pra entrega, entregue, cancelado)
- Detalhe do pedido: itens, quantidade, observações, dados do cliente (nome/telefone/endereço)
- Botão para avançar status do pedido
- Botão para **recusar/cancelar** pedido — essa ação só existe no lado do restaurante; o cliente não tem opção de cancelar depois de enviado
- Feedback sonoro/visual simples quando um novo pedido chega (o app precisa estar aberto — push fica pra V2)

## Fora do escopo do MVP

- Notificação push nativa (fica pra V2)
- Múltiplos usuários/permissões por restaurante
- Relatórios e métricas
- Edição de pedido já enviado (cliente não pode alterar depois de confirmado)

## Considerações Técnicas

- Framework sugerido: **Next.js** (React), mesmo do lado do cardápio — mas é um projeto/deploy separado
- Cliente Supabase JS configurado com a mesma URL/projeto do lado do cardápio
- RLS: garantir que todas as queries filtrem implicitamente por `owner_id = auth.uid()` (políticas no banco, não só no client)
- Rotas (Next.js): `/login`, `/produtos`, `/pedidos`, `/configuracoes`
- Estado: Context API ou Zustand (evitar Redux pra MVP, é peso desnecessário)
- Upload de imagem: usar Supabase Storage, salvar só a `image_url` na tabela `products`
- Realtime: `supabase.channel(...)` escutando `INSERT` em `orders` com filtro por `restaurant_id`, atualizando a lista sem precisar recarregar a página
- Deploy: Vercel (mesmo provedor do lado do cardápio, projeto separado)

## Telas Sugeridas

1. Login / Cadastro
2. Onboarding (criar restaurante — nome, slug, endereço, taxa de entrega)
3. Lista de Categorias
4. Lista de Produtos (por categoria) + formulário de criar/editar
5. Lista de Pedidos (com badge de novos) + detalhe do pedido
6. Configurações do restaurante

## Checklist de Início

- [ ] Configurar projeto Supabase (compartilhado com o lado do cardápio)
- [ ] Criar projeto Next.js
- [ ] Implementar autenticação
- [ ] Implementar CRUD de cardápio
- [ ] Implementar tela de pedidos com Realtime
- [ ] Configurar deploy na Vercel
