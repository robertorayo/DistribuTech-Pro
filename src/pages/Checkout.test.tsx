import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Checkout } from './Checkout';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/cartStore';
import { crearProducto } from '@/test/fixtures';

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const taladro = crearProducto({ id: 'taladro', nombre: 'Taladro percutor', precio: 100, tipo_iva: 21, stock: 2 });
const brocas = crearProducto({ id: 'brocas', nombre: 'Juego de brocas', precio: 50, tipo_iva: 10, stock: 20 });

/**
 * Simula las dos inserciones que hace Checkout (cotizaciones y detalle_cotizacion)
 * y devuelve lo que recibe cada tabla para poder comprobarlo.
 */
const simularSupabase = (
  errorDetalle: { message: string } | null = null,
  errorCabecera: { message: string } | null = null
) => {
  const insertado: Record<string, unknown> = {};
  vi.mocked(supabase.from).mockImplementation(((tabla: string) => ({
    insert: (filas: unknown) => {
      insertado[tabla] = filas;
      if (tabla === 'cotizaciones') {
        const respuesta = errorCabecera ? { data: null, error: errorCabecera } : { data: { id: 'cot-1' }, error: null };
        return { select: () => ({ single: async () => respuesta }) };
      }
      return Promise.resolve({ error: errorDetalle });
    },
  })) as never);
  return insertado;
};

const renderCheckout = () =>
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/catalogo" element={<p>Página del catálogo</p>} />
      </Routes>
    </MemoryRouter>
  );

/** Importe en formato español; \s acepta el espacio duro que pone Intl antes de €. */
const euros = (importe: string) => new RegExp(`^${importe.replace('.', '\\.')}\\s€$`);

describe('Checkout', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: 'cliente-1' } } as Session,
      user: null,
      rol: 'cliente',
      isLoading: false,
      signOut: vi.fn(),
    });
  });

  it('muestra el estado vacío si no hay productos', () => {
    renderCheckout();
    expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('calcula base imponible, IVA del 21 % y total', () => {
    // Todos al 21 %: Checkout aplica hoy un 21 % fijo a toda la base, sin mirar el
    // tipo_iva de cada producto (pendiente de corregir, no se fija aquí como correcto).
    const llave = crearProducto({ id: 'llave', precio: 50, tipo_iva: 21, stock: 20 });
    useCartStore.setState({ items: [{ producto: taladro, cantidad: 2 }, { producto: llave, cantidad: 1 }] });
    renderCheckout();

    expect(screen.getByText(euros('250,00'))).toBeInTheDocument();
    expect(screen.getByText(euros('52,50'))).toBeInTheDocument();
    expect(screen.getByText(euros('302,50'))).toBeInTheDocument();
  });

  it('no deja subir la cantidad por encima del stock', async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [{ producto: taladro, cantidad: 1 }] });
    renderCheckout();

    await user.click(screen.getByRole('button', { name: '+' }));

    expect(useCartStore.getState().items[0].cantidad).toBe(2);
    expect(screen.getByRole('button', { name: '+' })).toBeDisabled();
  });

  it('crea la cotización con su detalle, vacía el carrito y vuelve al catálogo', async () => {
    const user = userEvent.setup();
    const insertado = simularSupabase();
    useCartStore.setState({ items: [{ producto: taladro, cantidad: 2 }, { producto: brocas, cantidad: 1 }] });
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /Enviar a Comercial/ }));

    expect(await screen.findByText('Página del catálogo')).toBeInTheDocument();
    expect(insertado.cotizaciones).toEqual({ usuario_id: 'cliente-1', creado_por: 'cliente-1', estado: 'pendiente' });
    expect(insertado.detalle_cotizacion).toEqual([
      { cotizacion_id: 'cot-1', producto_id: 'taladro', cantidad: 2, precio_unitario: 100, tipo_iva: 21 },
      { cotizacion_id: 'cot-1', producto_id: 'brocas', cantidad: 1, precio_unitario: 50, tipo_iva: 10 },
    ]);
    expect(useCartStore.getState().items).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith('¡Cotización generada correctamente!');
  });

  it('si falla la creación de la cotización no inserta el detalle', async () => {
    const user = userEvent.setup();
    const insertado = simularSupabase(null, { message: 'permiso denegado' });
    useCartStore.setState({ items: [{ producto: brocas, cantidad: 3 }] });
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /Enviar a Comercial/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('permiso denegado')));
    expect(insertado.detalle_cotizacion).toBeUndefined();
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  // Si falla el detalle, la cabecera de la cotización ya se ha creado: no hay transacción.
  it('si falla el detalle avisa del error y conserva el carrito', async () => {
    const user = userEvent.setup();
    simularSupabase({ message: 'sin conexión' });
    useCartStore.setState({ items: [{ producto: brocas, cantidad: 3 }] });
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /Enviar a Comercial/ }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('sin conexión')));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(screen.queryByText('Página del catálogo')).not.toBeInTheDocument();
  });
});
