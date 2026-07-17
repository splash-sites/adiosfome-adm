'use client';

import { useActionState } from 'react';
import { createRestaurant, type OnboardingState } from './actions';

const initialState: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createRestaurant, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nome do restaurante
        <input name="name" type="text" required className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Slug (usado na URL do cardapio)
        <input
          name="slug"
          type="text"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="ex: pizzaria-do-joao"
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Endereco
        <input name="address" type="text" required className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Telefone
        <input name="phone" type="tel" required className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Taxa de entrega (R$)
        <input
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={0}
          required
          className="rounded border px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? 'Aguarda...' : 'Criar restaurante'}
      </button>
    </form>
  );
}
