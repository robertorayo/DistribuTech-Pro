// Build fix for Vercel
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Catalogo } from './pages/Catalogo';
import { Checkout } from './pages/Checkout';
import { MisPedidos } from './pages/MisPedidos';
import { ComercialDashboard } from './pages/ComercialDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProductos } from './pages/AdminProductos';
import { AdminCategorias } from './pages/AdminCategorias';
import { AdminFabricantes } from './pages/AdminFabricantes';
import { PrivateRoute } from './components/PrivateRoute';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';

const HomeRedirect = () => {
  const { session, rol } = useAuth();
  
  if (!session) return <Navigate to="/login" replace />;
  
  if (rol === 'admin') return <Navigate to="/admin" replace />;
  if (rol === 'comercial') return <Navigate to="/comercial" replace />;
  return <Navigate to="/catalogo" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Redirección inteligente en la raíz */}
        <Route path="/" element={<HomeRedirect />} />

        {/* ENVOLTORIO MAESTRO DE DISEÑO PARA RUTAS PROTEGIDAS */}
        <Route element={<Layout />}>
        
          {/* Rutas Protegidas Genéricas (Todos los roles B2B pueden ver catálogo) */}
          <Route element={<PrivateRoute allowedRoles={['cliente', 'comercial', 'admin']} />}>
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* Rutas exclusivas Cliente */}
          <Route element={<PrivateRoute allowedRoles={['cliente']} />}>
            <Route path="/mis-pedidos" element={<MisPedidos />} />
          </Route>

          {/* Rutas Exclusivas Comercial y Admin */}
          <Route element={<PrivateRoute allowedRoles={['comercial', 'admin']} />}>
            <Route path="/comercial" element={<ComercialDashboard />} />
            <Route path="/admin/productos" element={<AdminProductos />} />
            <Route path="/admin/categorias" element={<AdminCategorias />} />
            <Route path="/admin/fabricantes" element={<AdminFabricantes />} />
          </Route>

          {/* Rutas Exclusivas Administrador */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Rutas Exclusivas Comercial */}
          <Route element={<PrivateRoute allowedRoles={['comercial']} />}>
            <Route path="/comercial" element={<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">Panel de Gestión Comercial</div>} />
          </Route>

        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
