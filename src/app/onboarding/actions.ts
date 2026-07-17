'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { CreateRestaurant } from '@/application/use-cases/CreateRestaurant';

export type OnboardingState = { error: string | null };

export async function createRestaurant(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const name = String(formData.get('name') ?? '').trim();
  const slug = String(formData.get('slug') ?? '').trim().toLowerCase();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const deliveryFee = Number(formData.get('deliveryFee') ?? 0);

  const useCase = new CreateRestaurant(new SupabaseRestaurantRepository(supabase));

  try {
    await useCase.execute({
      ownerId: user.id,
      name,
      slug,
      address,
      phone,
      deliveryFee,
      openingHours: [],
    });
  } catch (e) {
    return { error: (e as Error).message };
  }

  redirect('/pedidos');
}
