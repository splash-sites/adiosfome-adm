# Documento Principal — Plataforma de Delivery (SaaS White-Label)

> Documento compartilhado. Qualquer mudança de escopo aqui deve ser refletida nos dois documentos de lado (Admin e Cardápio). Para práticas de deploy seguro e padrão de arquitetura de código, ver `04-arquitetura-tecnica.md`.

## 1. Visão Geral

Plataforma SaaS que permite qualquer restaurante (pizzaria, hamburgueria, etc.) se cadastrar sozinho e passar a operar seu próprio delivery digital: um painel para gerenciar produtos/pedidos e uma página de cardápio própria para os clientes finais fazerem pedidos.

**Modelo:** White-label. Cada restaurante tem seu próprio link/cardápio isolado — o cliente final não sabe (nem precisa saber) que existe uma plataforma por trás atendendo vários restaurantes.

## 2. Modelo de Negócio

- Cadastro **self-service**: o dono do restaurante cria a conta sozinho e já começa a usar (sem intervenção manual dos devs).
- Cada restaurante = 1 tenant, isolado por `restaurant_id` no banco.
- Monetização: fora de escopo do MVP (validar uso antes de definir plano/assinatura).

## 3. Escopo do MVP

**Dentro do escopo:**
- Cadastro/login do dono do restaurante
- Configuração de dados do restaurante (nome, endereço, telefone, taxa de entrega, horário, slug do link)
- CRUD de categorias, produtos, sabores/variações e preços
- Cardápio público acessível via link/QR code por restaurante (visualização não exige login)
- Cadastro/login do cliente final (e-mail + senha) **obrigatório para finalizar um pedido** — evita pedidos anônimos e cancelamentos sem responsabilidade
- Carrinho + checkout vinculado à conta do cliente
- Pagamento: **apenas combinar na entrega** (dinheiro/cartão físico)
- Pedido cai no painel do restaurante em tempo real
- Atualização de status do pedido (recebido → em preparo → saiu pra entrega → entregue), ou recusado/cancelado **apenas pelo restaurante**

**Fora do escopo do MVP (fica pra V2):**
- Pagamento online (Pix/cartão integrado)
- Notificação push nativa
- Histórico de pedidos do cliente (não obrigatório na v1, mas simples de acrescentar já que a conta existe)
- Cancelamento de pedido pelo próprio cliente (só o restaurante pode cancelar/recusar)
- Rastreamento de entregador em tempo real
- Multi-usuário por restaurante (ex: atendente + dono)
- Relatórios e analytics

## 4. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Banco de dados + Auth + API + Storage + Realtime | **Supabase** (Postgres) |
| Painel administrativo (dono do restaurante) | **Web** (React/Next.js) — acesso via computador/notebook |
| Cardápio do cliente final | **Web/PWA** (React/Next.js) — acesso via celular, responsivo, sem instalar |
| Deploy dos dois lados | **Vercel** |

> Os dois lados são aplicações web em React — nenhum dos dois é app nativo (React Native). A diferença entre eles é só o público e o design: o admin é pensado pra tela de computador, o cardápio é pensado (responsivo) pra tela de celular. Sugestão técnica: Next.js pros dois, já que casa bem com deploy na Vercel.

## 5. Modelo de Dados (Supabase)

Tabelas principais:

- **restaurants**: id, owner_id, slug (único, usado na URL), name, address, phone, delivery_fee, opening_hours, created_at
- **categories**: id, restaurant_id, name, sort_order
- **products**: id, restaurant_id, category_id, name, description, image_url, active
- **product_variants** (sabores/tamanhos): id, product_id, name, price
- **orders**: id, restaurant_id, **customer_id** (referencia `auth.users`, obrigatório — identifica o cliente que fez o pedido), customer_name, customer_phone, customer_address, status (`recebido` / `preparo` / `saiu_entrega` / `entregue` / `cancelado`), total, created_at
- **order_items**: id, order_id, product_id, variant_id, quantity, unit_price, notes

**Regras de acesso (RLS):**
- Dono só lê/edita dados do seu próprio `restaurant_id` (via `auth.uid() = owner_id`)
- Leitura pública de `restaurants`, `categories`, `products`, `product_variants` (necessário pro cardápio público funcionar sem login)
- Criação de `orders`/`order_items` **exige usuário autenticado** (`customer_id = auth.uid()`) — pedido anônimo não é permitido
- Cliente autenticado só pode ler os próprios pedidos (`auth.uid() = customer_id`)
- Alteração de status do pedido (incluindo cancelamento/recusa) restrita ao dono do restaurante — cliente não tem permissão de update em `orders`

## 6. Fluxo do Pedido (ponta a ponta)

1. Cliente acessa o link/QR do restaurante → cai na página de cardápio daquele `slug` (visualização livre, sem login)
2. Monta o pedido no carrinho
3. Ao finalizar, se não estiver logado → cria conta ou faz login (e-mail + senha via Supabase Auth)
4. Preenche nome, telefone, endereço de entrega
5. Confirma pedido → grava no Supabase vinculado ao `restaurant_id` e ao `customer_id` (conta autenticada)
6. Painel admin do restaurante recebe o pedido em tempo real (Supabase Realtime)
7. Restaurante aceita e atualiza o status conforme prepara/entrega, **ou recusa/cancela** o pedido
8. Pagamento é acertado na entrega (fora do sistema)

## 7. Divisão de Trabalho

- **Lado Admin (Web, desktop):** ver `02-documento-admin.md`
- **Lado Cardápio (Web/PWA, mobile):** ver `03-documento-cardapio.md`
- Ambos compartilham o mesmo banco Supabase — qualquer mudança de schema/tabela deve ser combinada entre os dois antes de aplicar, pra não quebrar o lado do outro.

## 8. Roadmap Pós-MVP (ideias para depois)

- Pagamento online (Pix via gateway, cartão)
- Notificação push (novo pedido, status do pedido pro cliente)
- Login/conta do cliente final com histórico de pedidos
- Painel com métricas (pedidos por dia, produtos mais vendidos)
- Múltiplos usuários por restaurante (permissões)
- Avaliações do restaurante/produtos
- Bloquear/banir clientes com histórico de pedidos falsos ou abuso
- Verificação por telefone (SMS) como camada extra, caso e-mail falso vire problema recorrente

## 9. Próximos Passos

- [ ] Definir nome do produto e slug de exemplo
- [ ] Criar projeto no Supabase e desenhar as tabelas (seção 5)
- [ ] Definir RLS policies
- [ ] Criar **dois repositórios separados no GitHub** (ex: `nomedoapp-admin` e `nomedoapp-cardapio`), cada um conectado a um projeto próprio na Vercel
- [ ] Cada dev cria seu ambiente local a partir do documento do seu lado
- [ ] Alinhar contrato de dados (nomes de colunas, enums de status) antes de começar a codar
