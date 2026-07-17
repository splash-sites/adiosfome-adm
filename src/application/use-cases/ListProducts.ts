import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';

export class ListProducts {
  constructor(private productRepository: IProductRepository) {}

  async execute(restaurantId: string): Promise<Product[]> {
    return this.productRepository.listProducts(restaurantId);
  }
}
