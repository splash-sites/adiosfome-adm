import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { ConfiguracoesForm } from './ConfiguracoesForm';

export default async function ConfiguracoesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const restaurant = await new GetOwnRestaurant(
    new SupabaseRestaurantRepository(supabase)
  ).execute(user.id);
  if (!restaurant) redirect('/onboarding');

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-black">Configuracoes</h1>
        <p className="text-sm text-black/50">Dados do restaurante, visiveis no cardapio publico.</p>
      </div>
      <ConfiguracoesForm restaurant={restaurant} />
    </div>
  );
}
