'use client';

import { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browserClient';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';
import {
  NEXT_ORDER_STATUS,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from '@/domain/entities/Order';
import { updateOrderStatusAction } from './actions';
import { playBeep } from './playBeep';

const FILTERS: (OrderStatus | 'todos')[] = [
  'todos',
  'recebido',
  'preparo',
  'saiu_entrega',
  'entregue',
  'cancelado',
];

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

export function OrdersView({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'todos'>('todos');
  const [banner, setBanner] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const browserClient = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const repository = new SupabaseOrderRepository(browserClient);
    const unsubscribe = repository.subscribeToNewOrders(restaurantId, (order) => {
      setOrders((prev) => [order, ...prev]);
      playBeep();
      setBanner(`Novo pedido de ${order.customerName}!`);
      setTimeout(() => setBanner(null), 6000);
    });
    return unsubscribe;
  }, [restaurantId, browserClient]);

  const filtered = filter === 'todos' ? orders : orders.filter((o) => o.status === filter);

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setPendingIds((prev) => new Set(prev).add(orderId));
    setErrors((prev) => ({ ...prev, [orderId]: '' }));

    const result = await updateOrderStatusAction(orderId, status);

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    if (result.error) {
      setErrors((prev) => ({ ...prev, [orderId]: result.error! }));
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  }

  return (
    <div className="flex flex-col gap-4">
      {banner && (
        <div className="rounded bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900">
          {banner}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded border px-3 py-1 text-sm ${
              filter === f ? 'bg-black text-white' : ''
            }`}
          >
            {f === 'todos' ? 'Todos' : ORDER_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-500">Nenhum pedido aqui.</p>}

      <div className="flex flex-col gap-3">
        {filtered.map((order) => {
          const nextStatus = NEXT_ORDER_STATUS[order.status];
          const isTerminal = order.status === 'entregue' || order.status === 'cancelado';
          const isPending = pendingIds.has(order.id);

          return (
            <div key={order.id} className="rounded border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  <p className="text-sm text-gray-600">{order.customerAddress}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium">
                  {ORDER_STATUS_LABEL[order.status]}
                </span>
              </div>

              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.productName} ({item.variantName}) —{' '}
                    {formatMoney(item.unitPrice * item.quantity)}
                    {item.notes && <span className="text-gray-500"> — {item.notes}</span>}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm font-semibold">Total: {formatMoney(order.total)}</p>

              {errors[order.id] && (
                <p className="mt-2 text-sm text-red-600">{errors[order.id]}</p>
              )}

              {!isTerminal && (
                <div className="mt-3 flex gap-2">
                  {nextStatus && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleStatusChange(order.id, nextStatus)}
                      className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {isPending ? 'Aguarda...' : `Avancar para "${ORDER_STATUS_LABEL[nextStatus]}"`}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleStatusChange(order.id, 'cancelado')}
                    className="rounded border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50"
                  >
                    Recusar/Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
