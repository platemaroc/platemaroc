'use server';
import { redirect } from 'next/navigation';
import { supabaseForRequest } from '../../lib/supabase-server.ts';

export async function signOut(): Promise<void> {
  const supabase = await supabaseForRequest();
  await supabase.auth.signOut();
  redirect('/');
}
