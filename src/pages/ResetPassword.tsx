import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, ShieldCheck, ShieldAlert, Shield, CheckCircle2, ArrowLeft } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  // Detectar Bloq Mayús
  const checkCapsLock = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setIsCapsLock(true);
    } else {
      setIsCapsLock(false);
    }
  };

  // Calcular fortaleza de contraseña
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength++;
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength++;
    if (pass.length >= 10 && /[^A-Za-z0-9]/.test(pass)) strength++;
    return strength; // 0: Muy Débil, 1: Débil, 2: Media, 3: Fuerte
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Borrar sesión local si fuera necesario o simplemente redirigir al login
        await supabase.auth.signOut();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">DistribuTech Pro</h2>
          <p className="mt-2 text-gray-500 font-medium">{t('auth.reset_password_title')}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('auth.password_updated_success')}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.login_now')}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('auth.reset_password_subtitle')}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">{t('auth.new_password')}</label>
                {isCapsLock && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                    <AlertCircle className="w-3 h-3" /> {t('auth.caps_lock_on')}
                  </span>
                )}
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={checkCapsLock}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 pr-12 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex gap-1.5 h-1.5">
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 0 ? (strength === 0 ? 'bg-red-400' : strength === 1 ? 'bg-amber-400' : strength === 2 ? 'bg-blue-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 2 ? (strength === 2 ? 'bg-blue-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                    <div className={`flex-1 rounded-full transition-all duration-500 ${strength >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                    {strength === 0 && <span className="text-red-500 flex items-center gap-1"><Shield className="w-3 h-3" /> {t('auth.strength_weak')}</span>}
                    {strength === 1 && <span className="text-amber-500 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> {t('auth.strength_weak')}</span>}
                    {strength === 2 && <span className="text-blue-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('auth.strength_medium')}</span>}
                    {strength === 3 && <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {t('auth.strength_strong')}</span>}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">{t('auth.confirm_password')}</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 pr-12 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.updating_password')}
                </div>
              ) : (
                t('auth.update_password')
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.back_to_login')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
