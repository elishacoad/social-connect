import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';

export async function createConnectSession() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const token = Crypto.randomUUID();
  const { data, error } = await supabase
    .from('connect_sessions')
    .insert({ user_id: userData.user.id, token })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function matchConnectSession(scannedToken: string, mySessionId: string) {
  const { data, error } = await supabase.rpc('match_connect_session', {
    scanned_token: scannedToken,
    my_session_id: mySessionId,
  });
  if (error) throw error;
  return data; // friendship id
}

export async function cancelConnectSession(id: string) {
  const { error } = await supabase.from('connect_sessions').update({ status: 'cancelled' }).eq('id', id);
  if (error) throw error;
}
