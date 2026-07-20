'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Eraser } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/infrastructure/supabase/browserClient';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';
import {
  NEXT_ORDER_STATUS,
  PREVIOUS_ORDER_STATUS,
  ORDER_STATUS_LABEL,
  type Order,
  type OrderStatus,
} from '@/domain/entities/Order';
import { updateOrderStatusAction } from './actions';
import { playBeep } from './playBeep';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/styles';

const COLUMNS: OrderStatus[] = ['recebido', 'preparo', 'saiu_entrega', 'entregue', 'cancelado'];

type ChangeKind = 'avancar' | 'voltar' | 'cancelar';

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

type ClearableStatus = 'entregue' | 'cancelado';

function clearedIdsKey(restaurantId: string, status: ClearableStatus) {
  return `pedidos-cleared-ids-${restaurantId}-${status}`;
}

function readClearedIds(restaurantId: string, status: ClearableStatus): Set<string> {
  try {
    const raw = localStorage.getItem(clearedIdsKey(restaurantId, status));
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeClearedIds(restaurantId: string, status: ClearableStatus, ids: Set<string>) {
  localStorage.setItem(clearedIdsKey(restaurantId, status), JSON.stringify([...ids]));
}

export function OrdersView({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Record<ClearableStatus, Set<string>>>({
    entregue: new Set(),
    cancelado: new Set(),
  });

  const browserClient = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    // le do localStorage apos montar (client-only) pra nao dar mismatch de hidratacao com o SSR
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClearedIds({
      entregue: readClearedIds(restaurantId, 'entregue'),
      cancelado: readClearedIds(restaurantId, 'cancelado'),
    });
  }, [restaurantId]);

  useEffect(() => {
    const repository = new SupabaseOrderRepository(browserClient);
    const unsubscribe = repository.subscribeToNewOrders(restaurantId, (order) => {
      setOrders((prev) => [order, ...prev]);
      playBeep();
      toast(`Novo pedido de ${order.customerName}!`);
    });
    return unsubscribe;
  }, [restaurantId, browserClient]);

  function handleClearColumn(status: ClearableStatus) {
    const visibleIds = orders
      .filter((o) => o.status === status && isToday(o.createdAt) && !clearedIds[status].has(o.id))
      .map((o) => o.id);

    const next = new Set(clearedIds[status]);
    visibleIds.forEach((id) => next.add(id));
    writeClearedIds(restaurantId, status, next);
    setClearedIds((prev) => ({ ...prev, [status]: next }));
    toast.success(`Coluna "${ORDER_STATUS_LABEL[status]}" limpa`);
  }

  function unclearOrder(orderId: string) {
    (['entregue', 'cancelado'] as ClearableStatus[]).forEach((status) => {
      setClearedIds((prev) => {
        if (!prev[status].has(orderId)) return prev;
        const next = new Set(prev[status]);
        next.delete(orderId);
        writeClearedIds(restaurantId, status, next);
        return { ...prev, [status]: next };
      });
    });
  }

  async function handleStatusChange(orderId: string, status: OrderStatus, kind: ChangeKind) {
    setPendingIds((prev) => new Set(prev).add(orderId));

    const result = await updateOrderStatusAction(orderId, status);

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    unclearOrder(orderId);

    if (kind === 'cancelar') {
      toast.success('Pedido cancelado com sucesso');
    } else if (kind === 'avancar') {
      toast.success(`Pedido avancado para "${ORDER_STATUS_LABEL[status]}"`);
    } else {
      toast.success(`Pedido voltou para "${ORDER_STATUS_LABEL[status]}"`);
    }
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

      <div className="flex gap-4 overflow-x-auto pb-2">
        {COLUMNS.map((status) => {
          const isTerminalColumn = status === 'entregue' || status === 'cancelado';
          const columnOrders = orders.filter((o) => {
            if (o.status !== status) return false;
            if (isTerminalColumn && !isToday(o.createdAt)) return false;
            if (isTerminalColumn && clearedIds[status as ClearableStatus].has(o.id)) return false;
            return true;
          });
          return (
            <div key={status} className="flex w-72 shrink-0 flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <p className="text-sm font-semibold text-black/80">{ORDER_STATUS_LABEL[status]}</p>
                <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-black/50">
                  {columnOrders.length}
                </span>
                {isTerminalColumn && (
                  <button
                    type="button"
                    title="Limpar coluna"
                    aria-label="Limpar coluna"
                    onClick={() => handleClearColumn(status as ClearableStatus)}
                    className="text-black/30 hover:text-black/70"
                  >
                    <Eraser className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {columnOrders.length === 0 && (
                  <p className="px-1 text-sm text-black/35">Nenhum pedido aqui.</p>
                )}

                {columnOrders.map((order) => {
                  const nextStatus = NEXT_ORDER_STATUS[order.status];
                  const previousStatus = PREVIOUS_ORDER_STATUS[order.status];
                  const isCancelled = order.status === 'cancelado';
                  const canCancel = order.status === 'recebido';
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

                      {!isCancelled && (
                        <div className="flex flex-col gap-2 border-t border-black/6 pt-3">
                          {nextStatus && (
                            <Button
                              variant="primary"
                              disabled={isPending}
                              onClick={() => handleStatusChange(order.id, nextStatus, 'avancar')}
                              className="w-full"
                            >
                              {isPending ? 'Aguarda...' : 'Avancar etapa'}
                            </Button>
                          )}
                          {previousStatus && (
                            <Button
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => handleStatusChange(order.id, previousStatus, 'voltar')}
                              className="self-center text-xs"
                            >
                              Voltar etapa
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => handleStatusChange(order.id, 'cancelado', 'cancelar')}
                              className="self-center text-red-600 hover:text-red-700"
                            >
                              Recusar/Cancelar
                            </Button>
                          )}
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
