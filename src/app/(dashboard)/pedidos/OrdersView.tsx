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
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/styles';

const COLUMNS: OrderStatus[] = ['recebido', 'preparo', 'saiu_entrega', 'entregue', 'cancelado'];

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function OrdersView({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-black">Pedidos</h1>
          <p className="text-sm text-black/50">Chega em tempo real assim que o cliente confirma.</p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-black/8 bg-white px-3 py-1.5 text-xs font-medium text-black/60">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Atualiza automaticamente
        </span>
      </div>

      {banner && (
        <div className="rounded-xl border border-primary/20 bg-primary-light px-4 py-3 text-sm font-medium text-primary-dark">
          {banner}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((status) => {
          const columnOrders = orders.filter((o) => o.status === status);
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <p className="text-sm font-semibold text-black/80">{ORDER_STATUS_LABEL[status]}</p>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/50">
                  {columnOrders.length}
                </span>
              </div>

              <div className="flex max-h-[calc(100vh-260px)] flex-col gap-3 overflow-y-auto pr-1">
                {columnOrders.length === 0 && (
                  <p className="px-1 text-sm text-black/35">Nenhum pedido aqui.</p>
                )}

                {columnOrders.map((order) => {
                  const nextStatus = NEXT_ORDER_STATUS[order.status];
                  const isTerminal = order.status === 'entregue' || order.status === 'cancelado';
                  const isPending = pendingIds.has(order.id);

                  return (
                    <div key={order.id} className={`${cardClass} flex flex-col gap-3 p-4`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-black">{order.customerName}</p>
                        <p className="shrink-0 text-xs text-black/40">{formatTime(order.createdAt)}</p>
                      </div>

                      <div className="flex flex-col gap-1 text-xs text-black/50">
                        <p>{order.customerPhone}</p>
                        <p className="line-clamp-2">{order.customerAddress}</p>
                      </div>

                      <ul className="flex flex-col gap-0.5 border-t border-black/6 pt-2 text-sm text-black/70">
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.quantity}x {item.productName} ({item.variantName})
                            {item.notes && <span className="text-black/40"> — {item.notes}</span>}
                          </li>
                        ))}
                      </ul>

                      <p className="text-sm font-semibold text-black">Total: {formatMoney(order.total)}</p>

                      {errors[order.id] && (
                        <p className="text-xs text-red-600">{errors[order.id]}</p>
                      )}

                      {!isTerminal && (
                        <div className="flex flex-col gap-2 border-t border-black/6 pt-3">
                          {nextStatus && (
                            <Button
                              variant="primary"
                              disabled={isPending}
                              onClick={() => handleStatusChange(order.id, nextStatus)}
                              className="w-full"
                            >
                              {isPending ? 'Aguarda...' : `Avancar para "${ORDER_STATUS_LABEL[nextStatus]}"`}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleStatusChange(order.id, 'cancelado')}
                            className="self-center text-red-600 hover:text-red-700"
                          >
                            Recusar/Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
