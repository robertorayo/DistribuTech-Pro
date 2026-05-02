import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan variables de entorno de Supabase. Revisa tu archivo .env');
}

// Inicializa el cliente de Supabase con Tipado Estricto de la Base de Datos
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
