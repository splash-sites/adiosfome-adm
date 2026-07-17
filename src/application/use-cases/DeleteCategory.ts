import { IProductRepository } from '../../domain/repositories/IProductRepository';

export class DeleteCategory {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    return this.productRepository.deleteCategory(id);
  }
}
