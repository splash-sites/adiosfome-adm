'use client';

import { useActionState, useState } from 'react';
import { login, signup, type AuthActionState } from './actions';
import { Button } from '@/components/ui/Button';
import { cardClass, inputClass, labelClass } from '@/components/ui/styles';

const initialState: AuthActionState = { error: null, info: null };

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);

  const state = mode === 'login' ? loginState : signupState;
  const pending = mode === 'login' ? loginPending : signupPending;
  const action = mode === 'login' ? loginAction : signupAction;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f7f7fb] p-6">
      <div className={`${cardClass} flex w-full max-w-sm flex-col gap-6 p-8`}>
        <div>
          <p className="text-sm font-medium text-primary">Painel do restaurante</p>
          <h1 className="mt-1 text-2xl font-semibold text-black">
            {mode === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
        </div>

        <form action={action} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <label className={labelClass}>
              Nome
              <input name="name" type="text" required className={inputClass} />
            </label>
          )}
          <label className={labelClass}>
            E-mail
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Senha
            <input name="password" type="password" required minLength={6} className={inputClass} />
          </label>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          {state.info && <p className="text-sm text-emerald-600">{state.info}</p>}

          <Button type="submit" disabled={pending} className="mt-1">
            {pending ? 'Aguarda...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="self-center"
        >
          {mode === 'login' ? 'Nao tem conta? Cadastrar' : 'Ja tem conta? Entrar'}
        </Button>
      </div>
    </main>
  );
}
