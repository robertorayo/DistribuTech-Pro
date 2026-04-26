import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirige temporalmente a una ruta base tras login (lo cambiaremos al dashboard/catalogo)
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">DistribuTech Pro</h2>
        <p className="mb-8 text-center text-gray-500">Acceso a plataforma B2B</p>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="empresa@ejemplo.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Nueva empresa?{' '}
          <Link to="/registro" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            Solicita tu acceso B2B
          </Link>
        </p>
      </div>
    </div>
  );
};
