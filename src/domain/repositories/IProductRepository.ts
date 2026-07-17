import { Category, Product } from '../entities/Product';

export interface IProductRepository {
  listCategories(restaurantId: string): Promise<Category[]>;
  createCategory(category: Omit<Category, 'id'>): Promise<Category>;
  updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'restaurantId'>>): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  listProducts(restaurantId: string): Promise<Product[]>;
  createProduct(product: Omit<Product, 'id'>): Promise<Product>;
  updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'restaurantId'>>): Promise<void>;
  deleteProduct(id: string): Promise<void>;
}
