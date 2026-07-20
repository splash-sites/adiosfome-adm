'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/pedidos', label: 'Pedidos' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/historico', label: 'Historico' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-black/8 bg-white text-black">
      <div className="flex flex-col">
        <div className="flex h-16 items-center border-b border-black/8 px-6">
          <p className="text-lg font-semibold leading-none text-primary">AdiosFome</p>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-primary text-white' : 'text-black/60 hover:bg-black/5 hover:text-black'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 border-t border-black/8 p-4">
        <Link
          href="/configuracoes"
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            pathname?.startsWith('/configuracoes')
              ? 'bg-primary text-white'
              : 'text-black/60 hover:bg-black/5 hover:text-black'
          }`}
        >
          Configuracoes
        </Link>
      </div>
    </aside>
  );
}
