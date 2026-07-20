import { Category, Product, ProductVariant } from '../entities/Product';

export type VariantInput = Omit<ProductVariant, 'id' | 'productId'>;
export type VariantUpdateInput = VariantInput & { id?: string };
export type ProductInput = Omit<Product, 'id' | 'variants'> & { variants: VariantInput[] };
export type ProductUpdateInput = Omit<ProductInput, 'restaurantId' | 'variants'> & {
  variants: VariantUpdateInput[];
};

export interface IProductRepository {
  listCategories(restaurantId: string): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'restaurantId'>>): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  listProducts(restaurantId: string): Promise<Product[]>;
  createProduct(product: ProductInput): Promise<Product>;
  updateProduct(id: string, data: Partial<ProductUpdateInput>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  hasActiveOrderReferences(productId: string): Promise<boolean>;
  deleteOrderItemsForProduct(productId: string): Promise<void>;
  hasActiveOrderReferencesForVariant(variantId: string): Promise<boolean>;
  deleteOrderItemsForVariant(variantId: string): Promise<void>;
}
