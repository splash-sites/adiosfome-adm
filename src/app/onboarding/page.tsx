import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { OnboardingForm } from './OnboardingForm';

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const useCase = new GetOwnRestaurant(new SupabaseRestaurantRepository(supabase));
  const existing = await useCase.execute(user.id);

  if (existing) {
    redirect('/pedidos');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Cria teu restaurante</h1>
        <p className="text-sm text-gray-600">
          Esses dados aparecem no teu cardapio publico. Da pra editar depois.
        </p>
      </div>
      <OnboardingForm />
    </main>
  );
}
