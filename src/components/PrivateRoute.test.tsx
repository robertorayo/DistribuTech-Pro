import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { PrivateRoute } from './PrivateRoute';
import { useAuth } from '@/context/AuthContext';
import type { Database } from '@/types';

// Se sustituye solo el hook de sesión: el test decide quién está conectado y con qué rol.
vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }));

type RolUsuario = Database['public']['Enums']['rol_usuario'];

const simularAuth = (datos: Partial<ReturnType<typeof useAuth>>) => {
  vi.mocked(useAuth).mockReturnValue({
    session: null,
    user: null,
    rol: null,
    isLoading: false,
    signOut: vi.fn(),
    ...datos,
  });
};

const sesion = { user: { id: 'u-1' } } as Session;

const renderRuta = (allowedRoles?: RolUsuario[]) =>
  render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/login" element={<p>Página de login</p>} />
        <Route path="/" element={<p>Inicio</p>} />
        <Route element={<PrivateRoute allowedRoles={allowedRoles} />}>
          <Route path="/privada" element={<p>Zona privada</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('PrivateRoute', () => {
  it('no muestra la ruta mientras se comprueba la sesión', () => {
    simularAuth({ isLoading: true });
    renderRuta();
    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument();
    expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
  });

  it('manda al login si no hay sesión', () => {
    simularAuth({ session: null });
    renderRuta();
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  it('muestra la ruta si hay sesión y no se piden roles', () => {
    simularAuth({ session: sesion, rol: 'cliente' });
    renderRuta();
    expect(screen.getByText('Zona privada')).toBeInTheDocument();
  });

  it('muestra la ruta si el rol está permitido', () => {
    simularAuth({ session: sesion, rol: 'comercial' });
    renderRuta(['comercial', 'admin']);
    expect(screen.getByText('Zona privada')).toBeInTheDocument();
  });

  it('manda al inicio si el rol no está permitido', () => {
    simularAuth({ session: sesion, rol: 'cliente' });
    renderRuta(['admin']);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.queryByText('Zona privada')).not.toBeInTheDocument();
  });
});
