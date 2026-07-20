import { IProductRepository } from '../../domain/repositories/IProductRepository';

export class DeleteProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    const hasActiveOrders = await this.productRepository.hasActiveOrderReferences(id);
    if (hasActiveOrders) {
      throw new Error(
        'Nao da pra excluir esse produto porque ele tem pedidos em andamento ou ja finalizados. Desative em vez de excluir.'
      );
    }

    await this.productRepository.deleteOrderItemsForProduct(id);
    await this.productRepository.deleteProduct(id);
  }
}
