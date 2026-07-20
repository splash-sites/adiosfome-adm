import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { Sidebar } from './Sidebar';
import { UserMenu } from './UserMenu';

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

  const displayName = (user.user_metadata?.full_name as string | undefined) || user.email || '';

  return (
    <div className="flex min-h-screen bg-[#f7f7fb]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-black/8 bg-white px-8">
          <UserMenu displayName={displayName} />
        </header>
        <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
