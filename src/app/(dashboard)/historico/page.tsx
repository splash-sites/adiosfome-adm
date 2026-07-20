import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { ListOrderHistory } from '@/application/use-cases/ListOrderHistory';
import { ORDER_STATUS_LABEL } from '@/domain/entities/Order';
import type { FinishedOrderStatus } from '@/domain/repositories/IOrderRepository';
import { cardClass, inputClass, labelClass } from '@/components/ui/styles';

const PAGE_SIZES = [10, 20, 50] as const;
const DEFAULT_PAGE_SIZE = 10;

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const restaurant = await new GetOwnRestaurant(
    new SupabaseRestaurantRepository(supabase)
  ).execute(user.id);
  if (!restaurant) redirect('/onboarding');

  const status: FinishedOrderStatus | undefined =
    params.status === 'entregue' || params.status === 'cancelado' ? params.status : undefined;
  const from = params.from || undefined;
  const to = params.to || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = PAGE_SIZES.includes(Number(params.pageSize) as (typeof PAGE_SIZES)[number])
    ? Number(params.pageSize)
    : DEFAULT_PAGE_SIZE;

  const { orders, total } = await new ListOrderHistory(new SupabaseOrderRepository(supabase)).execute(
    restaurant.id,
    { status, from, to, page, pageSize }
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const baseQuery = { status: params.status, from, to, pageSize: String(pageSize) };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Historico</h1>
        <p className="text-sm text-black/50">Pedidos entregues e cancelados.</p>
      </div>

      <form className={`${cardClass} flex flex-wrap items-end gap-4 p-5`}>
        <label className={labelClass}>
          Status
          <select name="status" defaultValue={params.status ?? ''} className={inputClass}>
            <option value="">Todos</option>
            <option value="entregue">Entregue</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </label>
        <label className={labelClass}>
          De
          <input name="from" type="date" defaultValue={from} className={inputClass} />
        </label>
        <label className={labelClass}>
          Ate
          <input name="to" type="date" defaultValue={to} className={inputClass} />
        </label>
        <label className={labelClass}>
          Por pagina
          <select name="pageSize" defaultValue={String(pageSize)} className={inputClass}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          Filtrar
        </button>
        {(params.status || from || to) && (
          <Link href="/historico" className="text-sm text-black/50 underline">
            Limpar filtros
          </Link>
        )}
      </form>

      <div className="flex flex-col gap-3">
        {orders.length === 0 && (
          <p className="text-sm text-black/40">Nenhum pedido encontrado nesse filtro.</p>
        )}

        {orders.map((order) => (
          <div key={order.id} className={`${cardClass} flex flex-col gap-3 p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-black">{order.customerName}</p>
                <p className="text-xs text-black/40">{formatDateTime(order.createdAt)}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  order.status === 'cancelado'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>

            <ul className="flex flex-col gap-0.5 border-t border-black/6 pt-2 text-sm text-black/70">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}x {item.productName} ({item.variantName})
                </li>
              ))}
            </ul>

            <p className="text-sm font-semibold text-black">Total: {formatMoney(order.total)}</p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-black/60">
          <span>
            Pagina {page} de {totalPages} · {total} pedidos
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/historico${buildQuery({ ...baseQuery, page: String(page - 1) })}`}
                className="rounded-lg border border-black/10 px-3 py-1.5 hover:bg-black/5"
              >
                Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/historico${buildQuery({ ...baseQuery, page: String(page + 1) })}`}
                className="rounded-lg border border-black/10 px-3 py-1.5 hover:bg-black/5"
              >
                Proxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
