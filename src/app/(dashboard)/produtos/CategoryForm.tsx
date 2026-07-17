'use client';

import { useActionState } from 'react';
import { createCategoryAction, type FormState } from './actions';

const initialState: FormState = { error: null };

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategoryAction, initialState);

  return (
    <form action={action} className="flex items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Nova categoria
        <input name="name" type="text" required className="rounded border px-3 py-2" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? 'Aguarda...' : 'Adicionar'}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
