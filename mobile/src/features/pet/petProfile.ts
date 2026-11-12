import { kv } from '@/lib/kv';

/** Optional, told by the owner: used only to write the line (gender agreement) and the male Diva. */
export type PetSex = 'male' | 'female';
export type PetProfile = { sex?: PetSex };

const KEY = 'pet-profile-v1';

/** The last pet described on this device: usually the same one next time. */
export async function loadPetProfile(): Promise<PetProfile> {
  try {
    const raw = await kv.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { sex: data.sex === 'male' || data.sex === 'female' ? data.sex : undefined };
  } catch {
    return {};
  }
}

export async function savePetProfile(profile: PetProfile): Promise<void> {
  try {
    await kv.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Only a convenience: nothing breaks if it is not remembered.
  }
}
