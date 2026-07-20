import { Order, OrderStatus } from '../entities/Order';

export type FinishedOrderStatus = 'entregue' | 'cancelado';

export interface OrderHistoryFilters {
  status?: FinishedOrderStatus;
  from?: string;
  to?: string;
  page: number;
  pageSize: number;
}

export interface OrderHistoryResult {
  orders: Order[];
  total: number;
}

export interface IOrderRepository {
  findByRestaurant(restaurantId: string, status?: OrderStatus): Promise<Order[]>;
  findById(orderId: string): Promise<Order | null>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
  subscribeToNewOrders(restaurantId: string, onNewOrder: (order: Order) => void): () => void;
  findHistory(restaurantId: string, filters: OrderHistoryFilters): Promise<OrderHistoryResult>;
}
