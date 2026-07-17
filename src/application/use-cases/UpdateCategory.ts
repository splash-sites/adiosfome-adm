import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Category } from '../../domain/entities/Product';

export class UpdateCategory {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, data: Partial<Omit<Category, 'id' | 'restaurantId'>>): Promise<void> {
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('Nome da categoria e obrigatorio');
    }
    return this.productRepository.updateCategory(id, data);
  }
}
