export type OrderStatus = 'recebido' | 'preparo' | 'saiu_entrega' | 'entregue' | 'cancelado';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
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

export const NEXT_ORDER_STATUS: Record<OrderStatus, OrderStatus | null> = {
  recebido: 'preparo',
  preparo: 'saiu_entrega',
  saiu_entrega: 'entregue',
  entregue: null,
  cancelado: null,
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  recebido: 'Recebido',
  preparo: 'Em preparo',
  saiu_entrega: 'Saiu pra entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};
