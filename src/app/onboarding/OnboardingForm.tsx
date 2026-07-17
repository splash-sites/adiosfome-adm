'use client';

import { useActionState } from 'react';
import { createRestaurant, type OnboardingState } from './actions';
import { Button } from '@/components/ui/Button';
import { inputClass, labelClass } from '@/components/ui/styles';

const initialState: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createRestaurant, initialState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className={labelClass}>
        Nome do restaurante
        <input name="name" type="text" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Slug (usado na URL do cardapio)
        <input
          name="slug"
          type="text"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="ex: pizzaria-do-joao"
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Endereco
        <input name="address" type="text" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Telefone
        <input name="phone" type="tel" required className={inputClass} />
      </label>
      <label className={labelClass}>
        Taxa de entrega (R$)
        <input
          name="deliveryFee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={0}
          required
          className={inputClass}
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? 'Aguarda...' : 'Criar restaurante'}
      </Button>
    </form>
  );
}
