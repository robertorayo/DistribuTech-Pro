import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';

import { ThemeProvider } from './context/ThemeContext';

// Inicializar configuración i18n
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-center" 
          richColors 
          closeButton 
          toastOptions={{ 
            style: { fontSize: '15px', padding: '16px' },
            className: 'text-base' 
          }} 
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
