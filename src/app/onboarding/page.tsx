import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { OnboardingForm } from './OnboardingForm';
import { cardClass } from '@/components/ui/styles';

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
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f7f7fb] p-6">
      <div className={`${cardClass} flex w-full max-w-md flex-col gap-6 p-8`}>
        <div>
          <p className="text-sm font-medium text-primary">Painel do restaurante</p>
          <h1 className="mt-1 text-2xl font-semibold text-black">Cria teu restaurante</h1>
          <p className="mt-1 text-sm text-black/50">
            Esses dados aparecem no teu cardapio publico. Da pra editar depois.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
