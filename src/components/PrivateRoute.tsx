import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Database } from '../types';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

interface PrivateRouteProps {
  allowedRoles?: RolUsuario[];
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRoles }) => {
  const { session, rol, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {/* Usamos clases crudas de Tailwind temporalmente hasta inicializar shadcn/ui */}
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  // 1. Si no hay sesión iniciada, redigir al Login y guardar a dónde intentaba ir
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Si la ruta es exclusiva para unos roles concretos y el usuario no encaja
  if (allowedRoles && rol && !allowedRoles.includes(rol)) {
    // TODO: Redirigir a una página oficial 403 (No autorizado) en el futuro
    return <Navigate to="/" replace />;
  }

  // 3. Todo en orden, cargar la ruta/componente que el usuario ha solicitado
  return <Outlet />;
};
