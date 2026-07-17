import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Category } from '../../domain/entities/Product';

export type CreateCategoryInput = Omit<Category, 'id'>;

export class CreateCategory {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    if (!input.name.trim()) {
      throw new Error('Nome da categoria e obrigatorio');
    }
    return this.productRepository.createCategory(input);
  }
}
