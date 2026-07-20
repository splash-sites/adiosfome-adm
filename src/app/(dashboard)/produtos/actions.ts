'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
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

const IMAGE_BUCKET = 'products';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadProductImage(
  supabase: SupabaseClient,
  restaurantId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Imagem muito grande (maximo 5MB)');
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`Falha no upload da imagem: ${error.message}`);

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteProductImage(supabase: SupabaseClient, imageUrl: string | null) {
  if (!imageUrl) return;
  const marker = `/object/public/${IMAGE_BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;
  const path = imageUrl.slice(index + marker.length);
  await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}

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

function friendlyDeleteError(e: unknown, itemLabel: string): string {
  const err = e as { code?: string; message?: string };
  if (err?.code === '23503') {
    return `Nao da pra excluir ${itemLabel} porque ja tem pedidos vinculados. Desative em vez de excluir.`;
  }
  return err?.message || 'Erro ao excluir';
}

function parseVariants(
  raw: FormDataEntryValue | null
): { id?: string; name: string; price: number }[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v) => ({
      id: v.id ? String(v.id) : undefined,
      name: String(v.name ?? ''),
      price: Number(v.price ?? 0),
    }));
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

export type DeleteResult = { error: string | null };

export async function deleteCategoryAction(categoryId: string): Promise<DeleteResult> {
  const { supabase } = await requireOwnRestaurant();
  try {
    await new DeleteCategory(new SupabaseProductRepository(supabase)).execute(categoryId);
  } catch (e) {
    return { error: friendlyDeleteError(e, 'essa categoria') };
  }
  revalidatePath('/produtos');
  return { error: null };
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { supabase, restaurant } = await requireOwnRestaurant();

  try {
    const imageFile = formData.get('image');
    const imageUrl =
      imageFile instanceof File && imageFile.size > 0
        ? await uploadProductImage(supabase, restaurant.id, imageFile)
        : null;

    await new CreateProduct(new SupabaseProductRepository(supabase)).execute({
      restaurantId: restaurant.id,
      categoryId: String(formData.get('categoryId') ?? ''),
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      imageUrl,
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
  const { supabase, restaurant } = await requireOwnRestaurant();
  const productId = String(formData.get('productId') ?? '');
  const currentImageUrl = String(formData.get('currentImageUrl') ?? '') || null;
  const removeImage = formData.get('removeImage') === 'on';

  try {
    const imageFile = formData.get('image');
    let imageUrl: string | null | undefined = undefined;

    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await uploadProductImage(supabase, restaurant.id, imageFile);
      await deleteProductImage(supabase, currentImageUrl);
    } else if (removeImage) {
      await deleteProductImage(supabase, currentImageUrl);
      imageUrl = null;
    }

    await new UpdateProduct(new SupabaseProductRepository(supabase)).execute(productId, {
      categoryId: String(formData.get('categoryId') ?? ''),
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      active: formData.get('active') === 'on',
      variants: parseVariants(formData.get('variants')),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/produtos');
  return { error: null };
}

export async function deleteProductAction(productId: string): Promise<DeleteResult> {
  const { supabase } = await requireOwnRestaurant();
  try {
    await new DeleteProduct(new SupabaseProductRepository(supabase)).execute(productId);
  } catch (e) {
    return { error: friendlyDeleteError(e, 'esse produto') };
  }
  revalidatePath('/produtos');
  return { error: null };
}
