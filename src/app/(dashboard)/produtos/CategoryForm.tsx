'use client';

import { useActionState } from 'react';
import { createCategoryAction, type FormState } from './actions';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/styles';

const initialState: FormState = { error: null };

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={action} className="flex items-end gap-2 pt-1">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-black/70">
        Nova categoria
        <input name="name" type="text" required className={inputClass} />
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? 'Aguarda...' : 'Adicionar'}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
