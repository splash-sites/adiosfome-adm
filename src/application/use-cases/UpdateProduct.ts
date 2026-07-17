import { IProductRepository, ProductInput } from '../../domain/repositories/IProductRepository';

export class UpdateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(id: string, data: Partial<Omit<ProductInput, 'restaurantId'>>): Promise<void> {
    if (data.name !== undefined && !data.name.trim()) {
      throw new Error('Nome do produto e obrigatorio');
    }
    if (data.variants !== undefined) {
      if (data.variants.length === 0) {
        throw new Error('Produto precisa ter pelo menos uma variante (sabor/tamanho)');
      }
      if (data.variants.some((v) => !v.name.trim() || v.price < 0)) {
        throw new Error('Toda variante precisa de nome e preco valido');
      }
    }

    return this.productRepository.updateProduct(id, data);
  }
}
