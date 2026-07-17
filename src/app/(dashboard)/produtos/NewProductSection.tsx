'use client';

import { useState } from 'react';
import { ProductForm } from './ProductForm';
import { Button } from '@/components/ui/Button';
import type { Category } from '@/domain/entities/Product';

export function NewProductSection({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} className="self-start">
        + Novo produto
      </Button>
    );
  }

  return <ProductForm categories={categories} onDone={() => setOpen(false)} />;
}
