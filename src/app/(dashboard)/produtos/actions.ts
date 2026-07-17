'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { SupabaseProductRepository } from '@/infrastructure/supabase/SupabaseProductRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { CreateCategory } from '@/application/use-cases/CreateCategory';
import { DeleteCategory } from '@/application/use-cases/DeleteCategory';
import { CreateProduct } from '@/application/use-cases/CreateProduct';
import { UpdateProduct } from '@/application/use-cases/UpdateProduct';
import { DeleteProduct } from '@/application/use-cases/DeleteProduct';

export type FormState = { error: string | null };

async function requireOwnRestaurant() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const restaurant = await new GetOwnRestaurant(
    new SupabaseRestaurantRepository(supabase)
  ).execute(user.id);
  if (!restaurant) redirect('/onboarding');

  return { supabase, restaurant };
}

function parseVariants(raw: FormDataEntryValue | null): { name: string; price: number }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => ({ name: String(v.name ?? ''), price: Number(v.price ?? 0) }));
  } catch {
    return [];
  }
}

export async function createCategoryAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, restaurant } = await requireOwnRestaurant();
  const name = String(formData.get('name') ?? '').trim();

  try {
    await new CreateCategory(new SupabaseProductRepository(supabase)).execute({
      restaurantId: restaurant.id,
      name,
      sortOrder: 0,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/produtos');
  return { error: null };
}

export async function deleteCategoryAction(categoryId: string): Promise<void> {
  const { supabase } = await requireOwnRestaurant();
  await new DeleteCategory(new SupabaseProductRepository(supabase)).execute(categoryId);
  revalidatePath('/produtos');
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, restaurant } = await requireOwnRestaurant();

  try {
    await new CreateProduct(new SupabaseProductRepository(supabase)).execute({
      restaurantId: restaurant.id,
      categoryId: String(formData.get('categoryId') ?? ''),
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      imageUrl: null,
      active: formData.get('active') === 'on',
      variants: parseVariants(formData.get('variants')),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/produtos');
  return { error: null };
}

export async function updateProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase } = await requireOwnRestaurant();
  const productId = String(formData.get('productId') ?? '');

  try {
    await new UpdateProduct(new SupabaseProductRepository(supabase)).execute(productId, {
      categoryId: String(formData.get('categoryId') ?? ''),
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      active: formData.get('active') === 'on',
      variants: parseVariants(formData.get('variants')),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/produtos');
  return { error: null };
}

export async function deleteProductAction(productId: string): Promise<void> {
  const { supabase } = await requireOwnRestaurant();
  await new DeleteProduct(new SupabaseProductRepository(supabase)).execute(productId);
  revalidatePath('/produtos');
}
