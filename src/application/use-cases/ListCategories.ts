import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Category } from '../../domain/entities/Product';

export class ListCategories {
  constructor(private productRepository: IProductRepository) {}

  async execute(restaurantId: string): Promise<Category[]> {
    return this.productRepository.listCategories(restaurantId);
  }
}
