import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Desde Node 25 hay un localStorage global de Node activado por defecto que tapa el de jsdom
// (y sin --localstorage-file no tiene métodos). Se desactiva para usar el de jsdom.
const nodeMajor = Number(process.versions.node.split('.')[0]);
const execArgv = nodeMajor >= 25 ? ['--no-experimental-webstorage'] : [];

// Reutiliza la configuración de Vite (plugin de React y alias @/) y añade la de los tests.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      poolOptions: { forks: { execArgv } },
      // Antes de cada test, cada vi.fn vuelve a su implementación original
      // (por ejemplo, la de supabase que lanza un error si no se ha simulado).
      mockReset: true,
    },
  })
);
