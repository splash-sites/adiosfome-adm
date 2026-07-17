import { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { NEXT_ORDER_STATUS, OrderStatus } from '../../domain/entities/Order';

export class UpdateOrderStatus {
  constructor(private orderRepository: IOrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<void> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Pedido nao encontrado');
    }
    if (order.status === 'entregue' || order.status === 'cancelado') {
      throw new Error('Pedido ja finalizado, nao da pra mudar o status');
    }
    if (newStatus !== 'cancelado' && NEXT_ORDER_STATUS[order.status] !== newStatus) {
      throw new Error('Transicao de status invalida');
    }

    return this.orderRepository.updateStatus(orderId, newStatus);
  }
}
