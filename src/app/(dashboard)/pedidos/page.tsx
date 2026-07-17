import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { SupabaseOrderRepository } from '@/infrastructure/supabase/SupabaseOrderRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { ListOrdersByRestaurant } from '@/application/use-cases/ListOrdersByRestaurant';
import { OrdersView } from './OrdersView';

export default async function PedidosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const restaurant = await new GetOwnRestaurant(
    new SupabaseRestaurantRepository(supabase)
  ).execute(user.id);
  if (!restaurant) redirect('/onboarding');

  const orders = await new ListOrdersByRestaurant(new SupabaseOrderRepository(supabase)).execute(
    restaurant.id
  );

  return <OrdersView restaurantId={restaurant.id} initialOrders={orders} />;
}
