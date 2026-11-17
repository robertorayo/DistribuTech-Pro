import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { imagenProducto } from './imagenProducto';

const raiz = resolve(__dirname, '../..');

describe('imagenProducto', () => {
  it('elige la ilustración por el tipo de producto, sin depender de tildes ni mayúsculas', () => {
    expect(imagenProducto({ nombre: 'Válvula de Esfera 3/4" Latón' })).toBe('/productos/valvula.svg');
    expect(imagenProducto({ nombre: 'DEPÓSITO MEMBRANA 24L' })).toBe('/productos/vaso.svg');
    expect(imagenProducto({ nombre: 'Plato de Ducha Extraplano 90x90' })).toBe('/productos/plato.svg');
    // «Knipex» contiene «pex»: no debe salir el rollo de tubo PEX.
    expect(imagenProducto({ nombre: 'Alicates Presión Knipex 200mm' })).toBe('/productos/alicates.svg');
  });

  it('usa la categoría si el nombre no se reconoce y, si tampoco, la genérica', () => {
    expect(imagenProducto({ nombre: 'Kit X-200', categorias: { nombre: 'Sistemas de Riego' } })).toBe('/productos/aspersor.svg');
    expect(imagenProducto({ nombre: 'Kit X-200', categorias: null })).toBe('/productos/generico.svg');
  });

  it('da una ilustración propia y existente a todos los productos de los datos de ejemplo', () => {
    const datos = readFileSync(resolve(raiz, 'database/data.sql'), 'utf8');
    const nombres = [...datos.matchAll(/^\('([^']+)',$/gm)].map((m) => m[1]);
    expect(nombres.length).toBeGreaterThan(50);

    for (const nombre of nombres) {
      const ruta = imagenProducto({ nombre });
      expect(ruta, nombre).not.toBe('/productos/generico.svg');
      expect(existsSync(resolve(raiz, 'public', ruta.slice(1))), ruta).toBe(true);
    }
  });
});
