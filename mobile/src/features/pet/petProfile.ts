import { kv } from '@/lib/kv';

/** Optional, told by the owner: used only to write the line (gender agreement, the pet's name). */
export type PetSex = 'male' | 'female';
export type PetProfile = { sex?: PetSex; name?: string };

/** Same limit as the server. */
export const PET_NAME_MAX = 20;

const KEY = 'pet-profile-v1';

/** The last pet described on this device: usually the same one next time. */
export async function loadPetProfile(): Promise<PetProfile> {
  try {
    const raw = await kv.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return {
      sex: data.sex === 'male' || data.sex === 'female' ? data.sex : undefined,
      name: typeof data.name === 'string' && data.name ? data.name.slice(0, PET_NAME_MAX) : undefined,
    };
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
