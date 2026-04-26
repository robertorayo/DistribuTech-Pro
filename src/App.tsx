import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { PrivateRoute } from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';

// Componente inteligente que redirige al usuario a su dashboard/zona correcta según su rol
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

        {/* Rutas Protegidas Genéricas (Todos los roles B2B pueden ver catálogo) */}
        <Route element={<PrivateRoute allowedRoles={['cliente', 'comercial', 'admin']} />}>
          <Route path="/catalogo" element={
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col">
              <h1 className="text-3xl font-bold">Catálogo B2B</h1>
              <p className="mt-4">¡Has iniciado sesión correctamente!</p>
              <button onClick={() => window.location.href = '/'} className="mt-8 text-blue-600 underline">Volver al inicio</button>
            </div>
          } />
        </Route>

        {/* Rutas Exclusivas Administrador */}
        <Route element={<PrivateRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<div className="p-8 text-center text-xl font-bold">Panel de Administración Secreto</div>} />
        </Route>

        {/* Rutas Exclusivas Comercial */}
        <Route element={<PrivateRoute allowedRoles={['comercial']} />}>
          <Route path="/comercial" element={<div className="p-8 text-center text-xl font-bold">Panel de Gestión Comercial</div>} />
        </Route>

        {/* Fallback 404 (Lo tiramos a la raíz para que el Redirect trabaje) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
