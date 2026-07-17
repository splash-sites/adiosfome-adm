import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { Sidebar } from './Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const useCase = new GetOwnRestaurant(new SupabaseRestaurantRepository(supabase));
  const restaurant = await useCase.execute(user.id);

  if (!restaurant) {
    redirect('/onboarding');
  }

  const email = user.email ?? '';
  const initial = email.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex min-h-screen bg-[#f7f7fb]">
      <Sidebar restaurantName={restaurant.name} restaurantSlug={restaurant.slug} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end border-b border-black/8 bg-white px-8 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {initial}
            </span>
            <span className="text-sm font-medium text-black/80">{email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
