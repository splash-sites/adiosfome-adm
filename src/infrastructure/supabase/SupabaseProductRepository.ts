import type { SupabaseClient } from '@supabase/supabase-js';
import {
  IProductRepository,
  ProductInput,
  ProductUpdateInput,
} from '../../domain/repositories/IProductRepository';
import { Category, Product, ProductVariant } from '../../domain/entities/Product';

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  price: number;
};

type ProductRow = {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  product_variants: VariantRow[];
};

function categoryToEntity(row: CategoryRow): Category {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

function variantToEntity(row: VariantRow): ProductVariant {
  return { id: row.id, productId: row.product_id, name: row.name, price: row.price };
}

function productToEntity(row: ProductRow): Product {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    categoryId: row.category_id,
    name: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url,
    active: row.active,
    variants: (row.product_variants ?? []).map(variantToEntity),
  };
}

export class SupabaseProductRepository implements IProductRepository {
  constructor(private supabase: SupabaseClient) {}

  async listCategories(restaurantId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as CategoryRow[]).map(categoryToEntity);
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        restaurant_id: category.restaurantId,
        name: category.name,
        sort_order: category.sortOrder,
      })
      .select('*')
      .single();
    if (error) throw error;
    return categoryToEntity(data as CategoryRow);
  }

  async updateCategory(
    id: string,
    data: Partial<Omit<Category, 'id' | 'restaurantId'>>
  ): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;

    const { error } = await this.supabase.from('categories').update(payload).eq('id', id);
    if (error) throw error;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async listProducts(restaurantId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('restaurant_id', restaurantId);
    if (error) throw error;
    return (data as ProductRow[]).map(productToEntity);
  }

  async createProduct(product: ProductInput): Promise<Product> {
    const { data: productRow, error: productError } = await this.supabase
      .from('products')
      .insert({
        restaurant_id: product.restaurantId,
        category_id: product.categoryId,
        name: product.name,
        description: product.description || null,
        image_url: product.imageUrl,
        active: product.active,
      })
      .select('*')
      .single();
    if (productError) throw productError;

    const created = productRow as Omit<ProductRow, 'product_variants'>;

    if (product.variants.length > 0) {
      const { error: variantsError } = await this.supabase.from('product_variants').insert(
        product.variants.map((v) => ({ product_id: created.id, name: v.name, price: v.price }))
      );
      if (variantsError) throw variantsError;
    }

    const { data: variantRows, error: fetchVariantsError } = await this.supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', created.id);
    if (fetchVariantsError) throw fetchVariantsError;

    return productToEntity({ ...created, product_variants: variantRows as VariantRow[] });
  }

  async updateProduct(id: string, data: Partial<ProductUpdateInput>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (data.categoryId !== undefined) payload.category_id = data.categoryId;
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.imageUrl !== undefined) payload.image_url = data.imageUrl;
    if (data.active !== undefined) payload.active = data.active;

    if (Object.keys(payload).length > 0) {
      const { error } = await this.supabase.from('products').update(payload).eq('id', id);
      if (error) throw error;
    }

    if (data.variants !== undefined) {
      await this.syncVariants(id, data.variants);
    }
  }

  private async syncVariants(
    productId: string,
    submitted: { id?: string; name: string; price: number }[]
  ): Promise<void> {
    const { data: existingRows, error: fetchError } = await this.supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);
    if (fetchError) throw fetchError;

    const existingIds = new Set((existingRows as { id: string }[]).map((r) => r.id));
    const submittedIds = new Set(submitted.filter((v) => v.id).map((v) => v.id));
    const removedIds = [...existingIds].filter((vid) => !submittedIds.has(vid));

    for (const variantId of removedIds) {
      const hasActive = await this.hasActiveOrderReferencesForVariant(variantId);
      if (hasActive) {
        throw new Error(
          'Nao da pra remover essa variante porque ela tem pedidos em andamento ou ja finalizados. Desative o produto em vez de remover a variante.'
        );
      }
    }

    for (const variantId of removedIds) {
      await this.deleteOrderItemsForVariant(variantId);
      const { error } = await this.supabase.from('product_variants').delete().eq('id', variantId);
      if (error) throw error;
    }

    const toUpdate = submitted.filter((v) => v.id && existingIds.has(v.id));
    for (const v of toUpdate) {
      const { error } = await this.supabase
        .from('product_variants')
        .update({ name: v.name, price: v.price })
        .eq('id', v.id as string);
      if (error) throw error;
    }

    const toInsert = submitted.filter((v) => !v.id || !existingIds.has(v.id));
    if (toInsert.length > 0) {
      const { error } = await this.supabase.from('product_variants').insert(
        toInsert.map((v) => ({ product_id: productId, name: v.name, price: v.price }))
      );
      if (error) throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async hasActiveOrderReferences(productId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('order_items')
      .select('orders ( status )')
      .eq('product_id', productId);
    if (error) throw error;

    return (data as unknown as { orders: { status: string } | null }[]).some(
      (row) => row.orders?.status !== 'cancelado'
    );
  }

  async deleteOrderItemsForProduct(productId: string): Promise<void> {
    const { error } = await this.supabase.from('order_items').delete().eq('product_id', productId);
    if (error) throw error;
  }

  async hasActiveOrderReferencesForVariant(variantId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('order_items')
      .select('orders ( status )')
      .eq('variant_id', variantId);
    if (error) throw error;

    return (data as unknown as { orders: { status: string } | null }[]).some(
      (row) => row.orders?.status !== 'cancelado'
    );
  }

  async deleteOrderItemsForVariant(variantId: string): Promise<void> {
    const { error } = await this.supabase.from('order_items').delete().eq('variant_id', variantId);
    if (error) throw error;
  }
}
