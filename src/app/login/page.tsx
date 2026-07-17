'use client';

import { useActionState, useState } from 'react';
import { login, signup, type AuthActionState } from './actions';

const initialState: AuthActionState = { error: null, info: null };

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);

  const state = mode === 'login' ? loginState : signupState;
  const pending = mode === 'login' ? loginPending : signupPending;
  const action = mode === 'login' ? loginAction : signupAction;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-xl font-semibold">
        {mode === 'login' ? 'Entrar' : 'Criar conta'}
      </h1>

      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded border px-3 py-2"
          />
        </label>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.info && <p className="text-sm text-green-700">{state.info}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? 'Aguarda...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="text-sm underline"
      >
        {mode === 'login' ? 'Nao tem conta? Cadastrar' : 'Ja tem conta? Entrar'}
      </button>
    </main>
  );
}
