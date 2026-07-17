'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';
import { UpdateOrderStatus } from '@/application/use-cases/UpdateOrderStatus';
import type { OrderStatus } from '@/domain/entities/Order';

export type UpdateStatusResult = { error: string | null };

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<UpdateStatusResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  try {
    await new UpdateOrderStatus(new SupabaseOrderRepository(supabase)).execute(orderId, status);
  } catch (e) {
    return { error: (e as Error).message };
  }

  revalidatePath('/pedidos');
  return { error: null };
}
