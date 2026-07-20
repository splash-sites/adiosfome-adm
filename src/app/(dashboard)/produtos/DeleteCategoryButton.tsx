'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { deleteCategoryAction } from './actions';

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCategoryAction(categoryId);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Categoria excluida com sucesso');
    }
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={handleDelete}
      className="text-black/30 hover:text-red-600 disabled:opacity-50"
    >
      ✕
    </button>
  );
}
