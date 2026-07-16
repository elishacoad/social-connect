import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';

// Storage RLS policies key ownership off the first path segment matching
// auth.uid(), so uploads must always be written under `${userId}/...`.
async function uploadImage(bucket: string, userId: string, localUri: string, prefix: string) {
  const extMatch = /\.(\w+)$/.exec(localUri);
  const ext = extMatch?.[1] ?? 'jpg';
  const path = `${userId}/${prefix}-${Date.now()}.${ext}`;

  const base64 = await FileSystem.readAsStringAsync(localUri, { encoding: 'base64' });

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: `image/${ext}`, upsert: false });
  if (error) throw error;

  return path;
}

export async function uploadAvatar(userId: string, localUri: string) {
  const path = await uploadImage('avatars', userId, localUri, 'avatar');
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

// The moments bucket is private — visibility is relationship-gated, not
// public — so callers resolve a short-lived signed URL per read instead of
// a stable public one.
export async function uploadMomentMedia(userId: string, localUri: string) {
  return uploadImage('moments', userId, localUri, 'moment');
}

export async function getMomentMediaUrl(path: string) {
  const { data, error } = await supabase.storage.from('moments').createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
