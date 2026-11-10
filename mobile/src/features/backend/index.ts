import { supabase } from '@/lib/supabase';

import { localBackend } from './local';
import { remoteBackend } from './remote';

export * from './types';

/** Remote when Supabase is configured (.env), local otherwise. */
export const backend = supabase ? remoteBackend(supabase) : localBackend;
