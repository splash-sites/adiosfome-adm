'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { UpdateRestaurant } from '@/application/use-cases/UpdateRestaurant';
import type { OpeningHours } from '@/domain/entities/Restaurant';

export type FormState = { error: string | null; success: boolean };

function parseOpeningHours(raw: FormDataEntryValue | null): OpeningHours[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((oh) => ({
      day: Number(oh.day),
      opensAt: String(oh.opensAt),
      closesAt: String(oh.closesAt),
    }));
  } catch {
    return [];
  }
}

export async function updateRestaurantAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const repository = new SupabaseRestaurantRepository(supabase);
  const current = await new GetOwnRestaurant(repository).execute(user.id);
  if (!current) redirect('/onboarding');

  try {
    await new UpdateRestaurant(repository).execute(current, {
      name: String(formData.get('name') ?? '').trim(),
      slug: String(formData.get('slug') ?? '').trim().toLowerCase(),
      address: String(formData.get('address') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      deliveryFee: Number(formData.get('deliveryFee') ?? 0),
      openingHours: parseOpeningHours(formData.get('openingHours')),
    });
  } catch (e) {
    return { error: (e as Error).message, success: false };
  }

  revalidatePath('/', 'layout');
  return { error: null, success: true };
}
