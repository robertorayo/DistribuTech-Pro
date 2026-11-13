import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('une clases e ignora los valores vacíos', () => {
    expect(cn('px-2', null, undefined, { oculto: false }, 'font-bold')).toBe('px-2 font-bold');
  });

  it('resuelve conflictos de Tailwind dejando la última clase', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
