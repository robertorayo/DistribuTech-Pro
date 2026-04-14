import { BrowserRouter, Routes, Route } from 'react-router-dom';

/**
 * App.tsx — Componente raíz de DistribuTech Pro
 *
 * TODO: Configurar rutas completas con React Router DOM v6
 * TODO: Envolver con AuthContext
 * TODO: Envolver con CartContext
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página temporal de bienvenida mientras se implementan las páginas reales */}
        <Route
          path="*"
          element={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
              <h1>DistribuTech Pro</h1>
              <p>Plataforma B2B para distribución multisectorial</p>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>🚧 En construcción...</p>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
