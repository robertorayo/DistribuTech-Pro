import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { User, Mail, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  LoadingScreen, 
  PageHeader, 
  FormField, 
  inputClasses 
} from '../components/shared';

interface OriginalData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
}

interface ValidationErrors {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
}

export const Perfil: React.FC = () => {
  const { user, rol } = useAuth();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailInUse, setEmailInUse] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Original state tracker
  const [originalData, setOriginalData] = useState<OriginalData | null>(null);

  // Validation error states
  const [errors, setErrors] = useState<ValidationErrors>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
  });

  useEffect(() => {
    if (user?.id) {
      cargarPerfil();
    }
  }, [user?.id]);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre, apellidos, email, telefono')
        .eq('id', user!.id)
        .single() as any;

      if (error) throw error;

      if (data) {
        const profile = {
          nombre: data.nombre || '',
          apellidos: data.apellidos || '',
          email: data.email || '',
          telefono: data.telefono || '',
        };
        setNombre(profile.nombre);
        setApellidos(profile.apellidos);
        setEmail(profile.email);
        setTelefono(profile.telefono);
        setOriginalData(profile);
      }
    } catch (error: any) {
      toast.error(`${t('profile.load_error')} ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Real-time field validations
  useEffect(() => {
    if (!originalData) return;

    const newErrors = { ...errors };

    // Validate Nombre
    const nombreTrim = nombre.trim();
    if (!nombreTrim) {
      newErrors.nombre = t('profile.error_name_req');
    } else if (nombreTrim.length < 2 || nombreTrim.length > 50) {
      newErrors.nombre = t('profile.error_name_len');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreTrim)) {
      newErrors.nombre = t('profile.error_name_format');
    } else {
      newErrors.nombre = '';
    }

    // Validate Apellidos
    const apellidosTrim = apellidos.trim();
    if (!apellidosTrim) {
      newErrors.apellidos = t('profile.error_lastname_req');
    } else if (apellidosTrim.length < 2 || apellidosTrim.length > 50) {
      newErrors.apellidos = t('profile.error_lastname_len');
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidosTrim)) {
      newErrors.apellidos = t('profile.error_lastname_format');
    } else {
      newErrors.apellidos = '';
    }

    // Validate Email format
    const emailTrim = email.trim();
    if (!emailTrim) {
      newErrors.email = t('profile.error_email_req');
    } else if (!/^\S+@\S+\.\S+$/.test(emailTrim)) {
      newErrors.email = t('profile.error_email_format');
    } else {
      newErrors.email = '';
    }

    // Validate Telefono (optional)
    const telefonoTrim = telefono.trim();
    if (telefonoTrim && !/^\d{9}$/.test(telefonoTrim)) {
      newErrors.telefono = t('profile.error_phone_format');
    } else {
      newErrors.telefono = '';
    }

    setErrors(newErrors);
  }, [nombre, apellidos, email, telefono, originalData]);

  // Debounced email check to verify if it is already in use by another user
  useEffect(() => {
    if (!email || !originalData || !user?.id) return;

    const emailTrim = email.trim().toLowerCase();
    const originalEmailTrim = originalData.email.trim().toLowerCase();

    // Check only if it changed and matches format
    if (emailTrim === originalEmailTrim || !/^\S+@\S+\.\S+$/.test(emailTrim)) {
      setEmailInUse(false);
      return;
    }

    setCheckingEmail(true);
    const checkEmailTimeout = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', emailTrim)
          .neq('id', user.id) as any;

        if (!error && data && data.length > 0) {
          setEmailInUse(true);
        } else {
          setEmailInUse(false);
        }
      } catch (e) {
        console.error('Error al comprobar disponibilidad de email:', e);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(checkEmailTimeout);
  }, [email, originalData, user?.id]);

  const hasChanges = originalData && (
    nombre.trim() !== originalData.nombre ||
    apellidos.trim() !== originalData.apellidos ||
    email.trim().toLowerCase() !== originalData.email.toLowerCase() ||
    telefono.trim() !== originalData.telefono
  );

  const hasErrors = !!(
    errors.nombre ||
    errors.apellidos ||
    errors.email ||
    errors.telefono ||
    emailInUse
  );

  const canSave = hasChanges && !hasErrors && !saving && !checkingEmail;

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !user?.id) return;

    try {
      setSaving(true);

      const tNombre = nombre.trim();
      const tApellidos = apellidos.trim();
      const tEmail = email.trim().toLowerCase();
      const tTelefono = telefono.trim() || null;

      // 1. Persist changes in custom profiles table (public.usuarios)
      const { error: dbError } = await (supabase.from('usuarios') as any)
        .update({
          nombre: tNombre,
          apellidos: tApellidos,
          email: tEmail,
          telefono: tTelefono,
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      // 2. Sync to Supabase Auth metadata for seamless sidebar & profile avatar rendering
      const authUpdatePayload: any = {
        data: {
          nombre: tNombre,
          apellidos: tApellidos,
        }
      };

      // Handle email update inside Auth context
      let emailChanged = false;
      if (tEmail !== originalData?.email.toLowerCase()) {
        authUpdatePayload.email = tEmail;
        emailChanged = true;
      }

      const { error: authError } = await supabase.auth.updateUser(authUpdatePayload);
      
      if (authError) {
        console.warn('Fallo parcial al sincronizar Auth email o requiere verificación doble:', authError.message);
      }

      // Update local state tracker
      const updatedProfile = {
        nombre: tNombre,
        apellidos: tApellidos,
        email: tEmail,
        telefono: tTelefono || '',
      };
      setOriginalData(updatedProfile);

      if (emailChanged) {
        toast.success(t('profile.save_success_email'));
      } else {
        toast.success(t('profile.save_success'));
      }
    } catch (error: any) {
      toast.error(`${t('profile.save_error')} ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 font-sans">
      <PageHeader 
        title={t('profile.title')} 
        subtitle={t('profile.subtitle')}
        icon={User}
        iconColor="text-blue-600"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card resumen lateral */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-between text-center md:col-span-1 h-fit">
          <div className="space-y-4 py-4 w-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-3xl shadow-md mx-auto">
              {originalData?.nombre?.charAt(0) || 'U'}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900 truncate">
                {originalData?.nombre} {originalData?.apellidos}
              </h4>
              <p className="text-xs text-gray-500 truncate">{originalData?.email}</p>
            </div>
            
            <div className="border-t border-gray-50 pt-4 flex justify-center items-center gap-1.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                {t('profile.role', { role: rol })}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-50 rounded-xl p-4 mt-2 text-left">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">{t('profile.rls_active')}</p>
                <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                  {t('profile.rls_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card principal con Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm md:col-span-2">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('profile.account_info')}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{t('profile.account_desc')}</p>
          </div>

          <form onSubmit={handleGuardar} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('profile.name')} required>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder={t('profile.name_placeholder')}
                    disabled={saving}
                  />
                </div>
                {errors.nombre && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                    {errors.nombre}
                  </p>
                )}
              </FormField>

              <FormField label={t('profile.last_name')} required>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder={t('profile.last_name_placeholder')}
                    disabled={saving}
                  />
                </div>
                {errors.apellidos && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                    {errors.apellidos}
                  </p>
                )}
              </FormField>
            </div>

            <FormField label={t('profile.email')} required>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClasses} pl-10 ${emailInUse ? 'border-red-300 focus:ring-red-600 focus:border-red-600' : ''}`}
                  placeholder={t('profile.email_placeholder')}
                  disabled={saving}
                />
                {checkingEmail && (
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </span>
                )}
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                  {errors.email}
                </p>
              )}
              {emailInUse && (
                <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                  {t('profile.email_in_use')}
                </p>
              )}
            </FormField>

            <FormField label={t('profile.phone')}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={`${inputClasses} pl-10`}
                  placeholder={t('profile.phone_placeholder')}
                  disabled={saving}
                />
              </div>
              {errors.telefono ? (
                <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                  {errors.telefono}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {t('profile.phone_desc')}
                </p>
              )}
            </FormField>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button 
                type="submit" 
                disabled={!canSave}
                className="font-bold min-w-[150px] shadow-sm shadow-blue-500/10"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  t('profile.save')
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
