import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import i18n from '@/i18n';
import { useFormatCurrency, useFormatDate } from './formatters';

describe('useFormatCurrency', () => {
  it('formatea en euros con el formato español', () => {
    const { result } = renderHook(() => useFormatCurrency());
    // \s también acepta el espacio duro que pone Intl antes del símbolo €
    expect(result.current(12345.6)).toMatch(/^12\.345,60\s€$/);
  });

  it('cambia al formato inglés al cambiar el idioma', async () => {
    const { result } = renderHook(() => useFormatCurrency());
    await act(() => i18n.changeLanguage('en'));
    expect(result.current(12345.6)).toBe('€12,345.60');
  });
});

describe('useFormatDate', () => {
  // Hora local a mediodía para que la zona horaria no cambie el día
  const fecha = '2026-03-05T12:00:00';

  it('usa día, mes abreviado y año por defecto', () => {
    const { result } = renderHook(() => useFormatDate());
    expect(result.current(fecha)).toMatch(/^05 mar 2026$/i);
  });

  it('respeta las opciones que se le pasan', () => {
    const { result } = renderHook(() => useFormatDate());
    expect(result.current(new Date(fecha), { year: 'numeric' })).toBe('2026');
  });

  it('formatea en inglés si el idioma es inglés', async () => {
    const { result } = renderHook(() => useFormatDate());
    await act(() => i18n.changeLanguage('en'));
    expect(result.current(fecha)).toBe('Mar 05, 2026');
  });
});
