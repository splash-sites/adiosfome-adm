'use client';

import { useActionState } from 'react';
import { updateProfileAction, type FormState } from './actions';
import { Button } from '@/components/ui/Button';
import { cardClass, inputClass, labelClass } from '@/components/ui/styles';

const initialState: FormState = { error: null, success: false };

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className={`${cardClass} flex flex-col gap-4 p-6`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Seu perfil</p>

      <label className={`${labelClass} max-w-sm`}>
        Seu nome
        <input name="name" type="text" required defaultValue={name} className={inputClass} />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Salvo!</p>}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
}
