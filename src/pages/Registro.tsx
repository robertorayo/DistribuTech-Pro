import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

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
      <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-10 shadow-2xl text-center border border-border/50 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">¡Casi listo!</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Hemos enviado un enlace de confirmación a <strong className="text-foreground">{email}</strong>.<br />
            Por favor, revisa tu correo para activar tu cuenta.
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-xl bg-primary py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-card p-10 shadow-2xl border border-border/50">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight">{t('auth.register_title')}</h2>
          <p className="mt-2 text-muted-foreground font-medium">{t('auth.register_subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="mb-1 block text-sm font-medium text-foreground/90">{t('auth.name')}</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-md border border-border p-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="w-1/2">
              <label className="mb-1 block text-sm font-medium text-foreground/90">{t('auth.last_name')}</label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="w-full rounded-md border border-border p-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/90">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border p-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-foreground/90">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border p-2.5 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/70 hover:text-primary transition-colors rounded-md hover:bg-primary/5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Indicador de fortaleza */}
            {password.length > 0 && (
              <div className="pt-2 space-y-2 animate-in fade-in duration-300">
                <div className="flex gap-1.5 h-1.5">
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 1 ? (strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-primary/70' : 'bg-green-500') : 'bg-muted'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 2 ? (strength === 2 ? 'bg-amber-400' : strength === 3 ? 'bg-primary/70' : 'bg-green-500') : 'bg-muted'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 3 ? (strength === 3 ? 'bg-primary/70' : 'bg-green-500') : 'bg-muted'}`} />
                  <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 4 ? 'bg-green-500' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                  {strength === 0 && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Muy Débil</span>}
                  {strength === 1 && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Débil</span>}
                  {strength === 2 && <span className="text-amber-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Media</span>}
                  {strength === 3 && <span className="text-primary/80 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Fuerte</span>}
                  {strength === 4 && <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Muy Fuerte</span>}
                </div>

                {/* Requisitos Checklist */}
                <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                  <div className={`flex items-center gap-1 ${criteria.length ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.length ? 'bg-green-500' : 'bg-muted/50'}`} />
                    Mín. 6 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.uppercase ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.uppercase ? 'bg-green-500' : 'bg-muted/50'}`} />
                    Mayúsculas
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.number ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.number ? 'bg-green-500' : 'bg-muted/50'}`} />
                    Números
                  </div>
                  <div className={`flex items-center gap-1 ${criteria.special ? 'text-green-600 font-semibold' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${criteria.special ? 'bg-green-500' : 'bg-muted/50'}`} />
                    Especiales (!@#...)
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="mb-1 block text-sm font-medium text-foreground/90">{t('auth.confirm_password')}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-border p-2.5 pr-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Repite tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground/70 hover:text-primary transition-colors rounded-md hover:bg-primary/5"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-primary py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? t('auth.creating_account') : t('auth.create_account')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth.already_have_account')}{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline">
            {t('auth.login_now')}
          </Link>
        </p>
      </div>
    </div>
  );
};
