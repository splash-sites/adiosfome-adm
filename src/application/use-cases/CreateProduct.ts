import { IProductRepository, ProductInput } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';

export class CreateProduct {
  constructor(private productRepository: IProductRepository) {}

  async execute(input: ProductInput): Promise<Product> {
    if (!input.name.trim()) {
      throw new Error('Nome do produto e obrigatorio');
    }
    if (input.variants.length === 0) {
      throw new Error('Produto precisa ter pelo menos uma variante (sabor/tamanho)');
    }
    if (input.variants.some((v) => !v.name.trim() || v.price < 0)) {
      throw new Error('Toda variante precisa de nome e preco valido');
    }

    return this.productRepository.createProduct(input);
  }
}
