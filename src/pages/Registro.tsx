import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Shield, Check } from 'lucide-react';

export const Registro: React.FC = () => {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { t } = useTranslation();

  // Criterios de fortaleza de contraseña
  const criteria = {
    length: password.length >= 6,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strength = Object.values(criteria).filter(Boolean).length; // 0 a 4

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          apellidos,
          rol: 'cliente',
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Si la confirmación de email está activa, data.session será null
      setEnviado(true);
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl text-center border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Casi listo!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Hemos enviado un enlace de confirmación a <strong className="text-gray-900">{email}</strong>.<br/>
            Por favor, revisa tu correo para activar tu cuenta.
          </p>
          <Link 
            to="/login" 
            className="inline-block w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{t('auth.register_title')}</h2>
          <p className="mt-2 text-gray-500 font-medium">{t('auth.register_subtitle')}</p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.name')}</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div className="w-1/2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.last_name')}</label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Indicador de fortaleza */}
            {password.length > 0 && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-300">
                <div className="flex gap-1.5 h-1.5">
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-blue-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-blue-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 3 ? (strength === 3 ? 'bg-blue-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 4 ? 'bg-green-500' : 'bg-gray-200'}`} />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  {strength === 0 && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Muy Débil</span>}
                  {strength === 1 && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Débil</span>}
                  {strength === 2 && <span className="text-amber-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Media</span>}
                  {strength === 3 && <span className="text-blue-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Fuerte</span>}
                  {strength === 4 && <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Muy Fuerte</span>}
                </div>
                
                {/* Requisitos Checklist */}
                <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-500">
                  <div className={`flex items-center gap-1 ${criteria.length ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Mín. 6 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.uppercase ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.uppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Mayúsculas
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.number ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Números
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.special ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.special ? 'bg-green-500' : 'bg-gray-300'}`} />
                    Especiales (!@#...)
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('auth.confirm_password')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2.5 pr-10 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-md hover:bg-blue-50"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? t('auth.creating_account') : t('auth.create_account')}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth.already_have_account')}{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
            {t('auth.login_now')}
          </Link>
        </p>
      </div>
    </div>
  );
};
