import { Order, OrderStatus } from '../entities/Order';

export interface IOrderRepository {
  findByRestaurant(restaurantId: string, status?: OrderStatus): Promise<Order[]>;
  findById(orderId: string): Promise<Order | null>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
  subscribeToNewOrders(restaurantId: string, onNewOrder: (order: Order) => void): () => void;
}
