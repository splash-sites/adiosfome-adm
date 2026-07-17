'use client';

import { useState } from 'react';
import { ProductForm } from './ProductForm';
import type { Category } from '@/domain/entities/Product';

export function NewProductSection({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded bg-black px-4 py-2 text-sm text-white"
      >
        + Novo produto
      </button>
    );
  }

  return <ProductForm categories={categories} onDone={() => setOpen(false)} />;
}
