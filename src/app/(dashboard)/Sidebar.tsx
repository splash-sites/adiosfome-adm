'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from './actions';

const NAV_ITEMS = [
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/produtos', label: 'Produtos' },
];

export function Sidebar({
  restaurantName,
  restaurantSlug,
}: {
  restaurantName: string;
  restaurantSlug: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col justify-between bg-black px-4 py-6 text-white">
      <div className="flex flex-col gap-8">
        <div className="px-2">
          <p className="text-lg font-semibold leading-tight">{restaurantName}</p>
          <p className="text-sm text-white/45">/{restaurantSlug}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
        <Link
          href="/configuracoes"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname?.startsWith('/configuracoes')
              ? 'bg-primary text-white'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          Configuracoes
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
