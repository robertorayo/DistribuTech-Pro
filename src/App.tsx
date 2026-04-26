import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
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

        {/* Redirección inteligente en la raíz */}
        <Route path="/" element={<HomeRedirect />} />

        {/* ENVOLTORIO MAESTRO DE DISEÑO PARA RUTAS PROTEGIDAS */}
        <Route element={<Layout />}>
        
          {/* Rutas Protegidas Genéricas (Todos los roles B2B pueden ver catálogo) */}
          <Route element={<PrivateRoute allowedRoles={['cliente', 'comercial', 'admin']} />}>
            <Route path="/catalogo" element={
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Catálogo B2B de Productos</h1>
                <p className="mt-4 text-gray-500 max-w-lg">Aquí cargaremos dinámicamente tu base de datos de productos y los carritos de cotización. Esta será tu página principal.</p>
              </div>
            } />
          </Route>

          {/* Rutas Exclusivas Administrador */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">Panel de Administración Secreto</div>} />
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
