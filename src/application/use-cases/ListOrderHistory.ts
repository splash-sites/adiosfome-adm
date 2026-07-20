import {
  IOrderRepository,
  OrderHistoryFilters,
  OrderHistoryResult,
} from '../../domain/repositories/IOrderRepository';

export class ListOrderHistory {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(restaurantId: string, filters: OrderHistoryFilters): Promise<OrderHistoryResult> {
    return this.orderRepository.findHistory(restaurantId, filters);
  }
}
