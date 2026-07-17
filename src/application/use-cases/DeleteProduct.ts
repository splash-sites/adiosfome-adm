import { IProductRepository } from '../../domain/repositories/IProductRepository';

export class DeleteProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string): Promise<void> {
    return this.productRepository.deleteProduct(id);
  }
}
