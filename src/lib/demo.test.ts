import { describe, expect, it } from 'vitest';
import { esCuentaDemo } from './demo';

describe('esCuentaDemo', () => {
  it('reconoce las cuentas de la demo sin distinguir mayúsculas ni espacios', () => {
    expect(esCuentaDemo('admin@distributechpro.com')).toBe(true);
    expect(esCuentaDemo(' Cliente@DistribuTechPro.com ')).toBe(true);
  });

  it('no marca como demo otras cuentas ni un correo vacío', () => {
    expect(esCuentaDemo('otra@empresa.com')).toBe(false);
    expect(esCuentaDemo('')).toBe(false);
    expect(esCuentaDemo(null)).toBe(false);
  });
});
