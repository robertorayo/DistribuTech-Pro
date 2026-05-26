import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/10 p-4 font-sans">
      <div className="w-full max-w-md rounded-2xl bg-card p-10 shadow-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-foreground tracking-tight">DistribuTech Pro</h2>
          <p className="mt-2 text-muted-foreground font-medium">{t('auth.forgot_password_title')}</p>
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('auth.reset_link_sent')}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.back_to_login')}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('auth.forgot_password_subtitle')}
            </p>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground/90">{t('auth.email')}</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-muted-foreground/70" aria-hidden="true" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10/50 p-3.5 pl-10 transition-all focus:border-primary focus:bg-card focus:outline-none focus:ring-4 focus:ring-primary/10"
                  placeholder="empresa@ejemplo.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('auth.sending_link')}
                </div>
              ) : (
                t('auth.send_reset_link')
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
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
