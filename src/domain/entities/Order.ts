export type OrderStatus = 'recebido' | 'preparo' | 'saiu_entrega' | 'entregue' | 'cancelado';

export interface OrderItem {
  id: string;
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
