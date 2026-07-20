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
import { DeleteCategoryButton } from './DeleteCategoryButton';
import { cardClass, pillClass } from '@/components/ui/styles';

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
        <h1 className="text-2xl font-semibold text-black">Produtos</h1>
        <p className="text-sm text-black/50">Gerencia categorias, produtos e sabores/variacoes.</p>
      </div>

      <section className={`${cardClass} flex flex-col gap-3 p-5`}>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-black/40">Categorias</h2>
        {categories.length === 0 && (
          <p className="text-sm text-black/40">Nenhuma categoria ainda.</p>
        )}
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id} className={pillClass}>
              {c.name}
              <DeleteCategoryButton categoryId={c.id} />
            </li>
          ))}
        </ul>
        <CategoryForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-black/40">Produtos</h2>
        {products.length === 0 && <p className="text-sm text-black/40">Nenhum produto ainda.</p>}
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <ProductListItem key={p.id} product={p} categories={categories} />
          ))}
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-black/40">Cria uma categoria antes de adicionar produtos.</p>
        ) : (
          <NewProductSection categories={categories} />
        )}
      </section>
    </div>
  );
}
