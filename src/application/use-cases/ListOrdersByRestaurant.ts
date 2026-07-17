import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';

export class ListOrdersByRestaurant {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(restaurantId: string, status?: OrderStatus): Promise<Order[]> {
    return this.orderRepository.findByRestaurant(restaurantId, status);
  }
}
