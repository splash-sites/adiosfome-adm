import type { SupabaseClient } from '@supabase/supabase-js';
import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order, OrderItem, OrderStatus } from '../../domain/entities/Order';

const ORDER_SELECT = `
  *,
  order_items (
    id, product_id, variant_id, quantity, unit_price, notes,
    products ( name ),
    product_variants ( name )
  )
`;

type OrderItemRow = {
  id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  products: { name: string } | null;
  product_variants: { name: string } | null;
};

type OrderRow = {
  id: string;
  restaurant_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items: OrderItemRow[];
};

function itemToEntity(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? '(produto removido)',
    variantId: row.variant_id,
    variantName: row.product_variants?.name ?? '(variante removida)',
    quantity: row.quantity,
    unitPrice: row.unit_price,
    notes: row.notes ?? undefined,
  };
}

function orderToEntity(row: OrderRow): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    status: row.status,
    total: row.total,
    items: (row.order_items ?? []).map(itemToEntity),
    createdAt: row.created_at,
  };
}

export class SupabaseOrderRepository implements IOrderRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByRestaurant(restaurantId: string, status?: OrderStatus): Promise<Order[]> {
    let query = this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as unknown as OrderRow[]).map(orderToEntity);
  }

  async findById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw error;
    return data ? orderToEntity(data as unknown as OrderRow) : null;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await this.supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) throw error;
  }

  subscribeToNewOrders(restaurantId: string, onNewOrder: (order: Order) => void): () => void {
    const channel = this.supabase
      .channel(`orders-inserts-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const order = await this.findById((payload.new as { id: string }).id);
          if (order) onNewOrder(order);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}
