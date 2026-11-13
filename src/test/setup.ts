import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import i18n from '@/i18n';

// El cliente real de Supabase nunca se carga en los tests: no hay red ni claves.
// Cualquier llamada que un test no haya simulado lanza un error en vez de salir a internet.
// Cada test configura lo que necesita con vi.mocked(supabase.from).mockImplementation(...).
vi.mock('@/lib/supabase', () => {
  const sinSimular = (nombre: string) => () => {
    throw new Error(`supabase.${nombre} no está simulado en este test`);
  };
  return {
    supabase: {
      from: vi.fn(sinSimular('from')),
      rpc: vi.fn(sinSimular('rpc')),
      auth: {
        getSession: vi.fn(sinSimular('auth.getSession')),
        onAuthStateChange: vi.fn(sinSimular('auth.onAuthStateChange')),
        signOut: vi.fn(sinSimular('auth.signOut')),
      },
    },
  };
});

beforeEach(async () => {
  localStorage.clear();
  // jsdom anuncia el navegador en inglés; los tests parten siempre del español.
  await i18n.changeLanguage('es');
});

// Las simulaciones se reinician solas entre tests (mockReset en vitest.config.ts).
afterEach(() => {
  cleanup();
});
