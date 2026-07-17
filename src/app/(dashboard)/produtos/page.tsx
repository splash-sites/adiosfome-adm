import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';
import { SupabaseRestaurantRepository } from '@/infrastructure/supabase/SupabaseRestaurantRepository';
import { SupabaseProductRepository } from '@/infrastructure/supabase/SupabaseProductRepository';
import { GetOwnRestaurant } from '@/application/use-cases/GetOwnRestaurant';
import { ListCategories } from '@/application/use-cases/ListCategories';
import { ListProducts } from '@/application/use-cases/ListProducts';
import { CategoryForm } from './CategoryForm';
import { NewProductSection } from './NewProductSection';
import { ProductListItem } from './ProductListItem';
import { deleteCategoryAction } from './actions';

export default async function ProdutosPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const restaurant = await new GetOwnRestaurant(
    new SupabaseRestaurantRepository(supabase)
  ).execute(user.id);
  if (!restaurant) redirect('/onboarding');

  const productRepository = new SupabaseProductRepository(supabase);
  const [categories, products] = await Promise.all([
    new ListCategories(productRepository).execute(restaurant.id),
    new ListProducts(productRepository).execute(restaurant.id),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Produtos</h1>
        <p className="text-sm text-gray-600">Gerencia categorias, produtos e sabores/variacoes.</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase text-gray-500">Categorias</h2>
        {categories.length === 0 && (
          <p className="text-sm text-gray-500">Nenhuma categoria ainda.</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded border px-3 py-1 text-sm">
              {c.name}
              <form action={deleteCategoryAction.bind(null, c.id)}>
                <button type="submit" className="text-red-600 underline">
                  x
                </button>
              </form>
            </li>
          ))}
        </ul>
        <CategoryForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase text-gray-500">Produtos</h2>
        {products.length === 0 && <p className="text-sm text-gray-500">Nenhum produto ainda.</p>}
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <ProductListItem key={p.id} product={p} categories={categories} />
          ))}
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">Cria uma categoria antes de adicionar produtos.</p>
        ) : (
          <NewProductSection categories={categories} />
        )}
      </section>
    </div>
  );
}
