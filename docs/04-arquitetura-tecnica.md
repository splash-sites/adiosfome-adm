# Documento — Arquitetura Técnica e Operação em Produção

> Compartilhado entre os dois lados. Aplica-se igualmente aos dois projetos (Admin e Cardápio).

## 1. Sobre escala (leitura rápida, pra calibrar a preocupação certa)

10 → 50 restaurantes em 3 meses é um volume **pequeno** pro Supabase (Postgres gerenciado) e pra Vercel — isso roda tranquilo até em plano de entrada pago. Ou seja: o risco real de "o sistema cair" nesse estágio quase nunca vem de volume de tráfego. Vem de:
- Deploy com bug indo direto pra produção
- Migration de banco mal aplicada
- Política de RLS mal configurada (vazando dado de um restaurante pra outro, ou bloqueando algo que devia funcionar)

Por isso o foco abaixo é **processo de deploy seguro**, não "escalar servidor".

## 2. Ambientes: Dev / Staging / Produção

| Ambiente | Banco | Deploy |
|---|---|---|
| Local (dev) | Supabase local (`supabase start` via CLI) | `next dev` na máquina |
| Staging | Projeto Supabase separado (ou branch de banco, se o plano permitir) | Preview Deployment automático da Vercel a cada PR |
| Produção | Projeto Supabase de produção | Deploy da branch principal (`main`) |

**Regra de ouro:** nenhuma mudança de schema ou funcionalidade nova vai direto pra produção sem passar por staging primeiro. Isso vale ainda mais forte pra vocês por ser uma operação que não pode parar.

## 3. Banco de Dados: Migrations, Backup e Conexões

- **Migrations versionadas**: usar Supabase CLI (pasta `supabase/migrations` no repo), nunca alterar schema direto pelo dashboard em produção. Aplicar em staging → testar → só depois aplicar em produção.
- **Backup automático**: habilitar assim que sair do plano gratuito do Supabase (o plano Pro já inclui backup diário). Com clientes pagantes de verdade, o custo se paga pela segurança.
- **Point-in-time recovery**: vale ativar antes de bater a marca de 50 restaurantes — permite restaurar o banco pra qualquer minuto específico se algo sair errado (ex: migration que apaga dado sem querer).
- **Conexões (ponto técnico que realmente importa pra escala):** as duas aplicações rodam em serverless (Vercel), então cada requisição pode abrir uma conexão nova com o banco. Usar conexão direta nesse cenário esgota rápido conforme o tráfego cresce. A solução é usar o **connection pooler do próprio Supabase (Supavisor), em modo "transaction"**, que é feito exatamente pra ambientes serverless. Migrations continuam usando a conexão direta; o app do dia a dia usa a pooler. Isso já vem configurado como uma segunda connection string no painel do Supabase — é só usar a certa em cada lugar.

## 4. Deploy e Rollback (Vercel)

- Cada repositório conectado a um projeto Vercel próprio (ver documento principal, seção de repositórios)
- `main` → deploy automático em produção; qualquer outra branch/PR → preview (staging)
- **Rollback instantâneo**: a Vercel guarda os deploys anteriores. Se um deploy novo quebrar produção, dá pra reverter pro anterior em segundos pelo dashboard, sem precisar reverter código e esperar novo build
- Variáveis de ambiente configuradas separadamente para Preview e Production, pra nunca testar em staging usando o banco de produção por engano

## 5. Monitoramento e Alertas

- Logs de erro: Vercel (funções) e Supabase (banco/API) já expõem isso no dashboard — vale revisar periodicamente, principalmente logo após cada deploy
- Monitoramento de disponibilidade: uma ferramenta simples e gratuita (ex: UptimeRobot) pingando o admin e o cardápio, com alerta por e-mail/WhatsApp se algum dos dois cair
- **Nunca** expor a `service_role key` do Supabase no código do frontend — só a `anon key` (que respeita as políticas de RLS). A `service_role` ignora RLS e só deveria existir em ambiente de servidor controlado por vocês, nunca no bundle que vai pro navegador

## 6. RLS como checklist antes de qualquer deploy em produção

- Toda tabela pública tem RLS habilitado, sem exceção
- Testar manualmente antes de liberar: logar como dono de um restaurante e tentar acessar/editar dado de outro restaurante — se conseguir, a policy está errada
- Nunca confiar em filtro feito só no frontend (ex: `.eq('restaurant_id', x)` no client); o filtro de segurança real precisa estar na policy do banco, porque o frontend pode ser manipulado

---

## 7. Clean Architecture — Estrutura de Pastas (Next.js)

Mesma estrutura nos dois projetos (Admin e Cardápio), adaptando os casos de uso de cada um:

```
src/
  domain/                    ← regras de negócio puras, sem depender de nada externo
    entities/
      Order.ts
      Product.ts
      Restaurant.ts
    repositories/            ← interfaces (contratos), não implementações
      IOrderRepository.ts
      IProductRepository.ts

  application/                ← casos de uso, depende só do domain
    use-cases/
      CreateOrder.ts
      UpdateOrderStatus.ts
      ListProducts.ts

  infrastructure/              ← implementações concretas (Supabase)
    supabase/
      client.ts
      SupabaseOrderRepository.ts
      SupabaseProductRepository.ts

  app/                         ← rotas do Next.js (App Router), UI
    pedidos/page.tsx
    api/orders/route.ts
```

A regra principal: **`domain` e `application` nunca importam nada de `infrastructure`**. É o `infrastructure` que implementa as interfaces definidas no `domain`. Isso é o que te dá a flexibilidade de trocar Supabase por outra coisa no futuro sem reescrever a lógica de negócio.

## 8. Aplicando SOLID na prática

- **S — Responsabilidade única:** `CreateOrder` só cria pedido. `UpdateOrderStatus` é outra classe, separada. Nenhum caso de uso faz duas coisas ao mesmo tempo.
- **O — Aberto/fechado:** dá pra adicionar uma nova forma de guardar pedidos (outra fonte de dados) criando uma nova classe que implementa `IOrderRepository`, sem alterar o caso de uso existente.
- **L — Substituição de Liskov:** qualquer implementação de `IOrderRepository` pode substituir outra sem quebrar quem a utiliza.
- **I — Segregação de interface:** interfaces enxutas e focadas (`IOrderRepository` só cuida de pedido, não vira uma interface gigante de "tudo").
- **D — Inversão de dependência:** o caso de uso depende da interface (abstração), não do Supabase diretamente. A implementação concreta é "injetada" de fora, no ponto de entrada (rota/página).

## 9. Exemplo Prático: Criar Pedido

```typescript
// domain/entities/Order.ts
export type OrderStatus = 'recebido' | 'preparo' | 'saiu_entrega' | 'entregue' | 'cancelado';

export interface OrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
}
```

```typescript
// domain/repositories/IOrderRepository.ts
import { Order } from '../entities/Order';

export interface IOrderRepository {
  create(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order>;
  findByRestaurant(restaurantId: string): Promise<Order[]>;
  updateStatus(orderId: string, status: Order['status']): Promise<void>;
}
```

```typescript
// application/use-cases/CreateOrder.ts
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';

export class CreateOrder {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(input: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
    if (input.items.length === 0) {
      throw new Error('Pedido precisa ter pelo menos um item');
    }
    return this.orderRepository.create({ ...input, status: 'recebido' });
  }
}
```

```typescript
// infrastructure/supabase/SupabaseOrderRepository.ts
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';
import { supabase } from './client';

export class SupabaseOrderRepository implements IOrderRepository {
  async create(order: Omit<Order, 'id' | 'createdAt'>) {
    const { data, error } = await supabase.from('orders').insert(order).select().single();
    if (error) throw error;
    return data as Order;
  }

  async findByRestaurant(restaurantId: string) {
    const { data, error } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId);
    if (error) throw error;
    return data as Order[];
  }

  async updateStatus(orderId: string, status: Order['status']) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }
}
```

```typescript
// app/api/orders/route.ts
import { CreateOrder } from '@/application/use-cases/CreateOrder';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';

export async function POST(request: Request) {
  const body = await request.json();
  const useCase = new CreateOrder(new SupabaseOrderRepository());

  try {
    const order = await useCase.execute(body);
    return Response.json(order, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

Repare que a rota (`app/api/orders/route.ts`) só conecta as peças — quem decide as regras é o `CreateOrder`, e quem fala com o banco é o `SupabaseOrderRepository`. Isso facilita testar `CreateOrder` sozinho (sem precisar de banco real) e trocar a fonte de dados no futuro sem tocar na regra de negócio.

## 10. Checklist de Arquitetura (replicar nos dois projetos)

- [ ] Criar as pastas `domain/`, `application/`, `infrastructure/` desde o início do projeto
- [ ] Nenhum arquivo em `domain/` ou `application/` importa nada de `infrastructure/`
- [ ] Cada caso de uso em `application/use-cases/` faz **uma coisa só**
- [ ] Componentes de UI chamam casos de uso, nunca o Supabase diretamente
- [ ] Configurar staging (projeto Supabase + Preview Deployment) antes do primeiro deploy em produção
- [ ] Usar a connection string da pooler (Supavisor, modo transação) nas queries da aplicação; conexão direta só para migrations
- [ ] RLS testado manualmente (seção 6) antes de qualquer deploy em produção
