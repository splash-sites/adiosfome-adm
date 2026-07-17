'use client';

import { useState } from 'react';
import { deleteProductAction } from './actions';
import { ProductForm } from './ProductForm';
import type { Category, Product } from '@/domain/entities/Product';
import { Button } from '@/components/ui/Button';
import { cardClass } from '@/components/ui/styles';

export function ProductListItem({
  product,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <ProductForm categories={categories} product={product} onDone={() => setEditing(false)} />;
  }

  return (
    <div className={`${cardClass} flex items-center justify-between p-4`}>
      <div className="flex items-center gap-3">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-12 w-12 rounded-lg border border-black/8 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-black/15 text-[10px] text-black/25">
            sem foto
          </div>
        )}
        <div>
          <p className="font-medium text-black">
            {product.name}{' '}
            {!product.active && <span className="text-xs font-normal text-black/40">(inativo)</span>}
          </p>
          <p className="text-sm text-black/50">
            {product.variants.map((v) => `${v.name}: R$ ${v.price.toFixed(2)}`).join(' | ')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <form action={deleteProductAction.bind(null, product.id)}>
          <Button type="submit" variant="ghost" className="text-red-600 hover:text-red-700">
            Excluir
          </Button>
        </form>
      </div>
    </div>
  );
}
