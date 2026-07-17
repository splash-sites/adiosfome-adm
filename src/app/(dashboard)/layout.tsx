import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { logout } from './actions';

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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <p className="font-semibold">{restaurant.name}</p>
          <p className="text-xs text-gray-500">/{restaurant.slug}</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pedidos">Pedidos</Link>
          <Link href="/produtos">Produtos</Link>
          <Link href="/configuracoes">Configuracoes</Link>
          <form action={logout}>
            <button type="submit" className="underline">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
