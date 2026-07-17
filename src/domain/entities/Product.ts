export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string | null;
  active: boolean;
  variants: ProductVariant[];
}
