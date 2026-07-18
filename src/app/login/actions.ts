'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/infrastructure/supabase/serverClient';

export type AuthActionState = { error: string | null; info?: string | null };

export async function login(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect('/pedidos');
}

export async function signup(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  if (!name) {
    return { error: 'Nome e obrigatorio' };
  }
  if (password.length < 6) {
    return { error: 'Senha precisa ter pelo menos 6 caracteres' };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: null, info: 'Conta criada! Confirma o e-mail antes de fazer login.' };
  }

  redirect('/onboarding');
}
