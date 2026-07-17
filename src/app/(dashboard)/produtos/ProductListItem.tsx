'use client';

import { useState } from 'react';
import { deleteProductAction } from './actions';
import { ProductForm } from './ProductForm';
import type { Category, Product } from '@/domain/entities/Product';

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
    <div className="flex items-center justify-between rounded border p-3">
      <div>
        <p className="font-medium">
          {product.name} {!product.active && <span className="text-xs text-gray-500">(inativo)</span>}
        </p>
        <p className="text-sm text-gray-600">
          {product.variants.map((v) => `${v.name}: R$ ${v.price.toFixed(2)}`).join(' | ')}
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="underline">
          Editar
        </button>
        <form action={deleteProductAction.bind(null, product.id)}>
          <button type="submit" className="text-red-600 underline">
            Excluir
          </button>
        </form>
      </div>
    </div>
  );
}
