import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
      toast.error('Error al cargar perfil: ' + error.message);
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
      newErrors.nombre = 'El nombre es obligatorio.';
    } else if (nombreTrim.length < 2 || nombreTrim.length > 50) {
      newErrors.nombre = 'El nombre debe tener entre 2 y 50 caracteres.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreTrim)) {
      newErrors.nombre = 'El nombre solo puede contener letras y espacios.';
    } else {
      newErrors.nombre = '';
    }

    // Validate Apellidos
    const apellidosTrim = apellidos.trim();
    if (!apellidosTrim) {
      newErrors.apellidos = 'Los apellidos son obligatorios.';
    } else if (apellidosTrim.length < 2 || apellidosTrim.length > 50) {
      newErrors.apellidos = 'Los apellidos deben tener entre 2 y 50 caracteres.';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidosTrim)) {
      newErrors.apellidos = 'Los apellidos solo pueden contener letras y espacios.';
    } else {
      newErrors.apellidos = '';
    }

    // Validate Email format
    const emailTrim = email.trim();
    if (!emailTrim) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^\S+@\S+\.\S+$/.test(emailTrim)) {
      newErrors.email = 'El formato del correo electrónico es inválido.';
    } else {
      newErrors.email = '';
    }

    // Validate Telefono (optional)
    const telefonoTrim = telefono.trim();
    if (telefonoTrim && !/^\d{9}$/.test(telefonoTrim)) {
      newErrors.telefono = 'El teléfono debe tener exactamente 9 dígitos numéricos (ej: 600000000).';
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
        toast.success('¡Perfil guardado! Se ha enviado un correo de confirmación a tu nueva dirección.');
      } else {
        toast.success('Cambios guardados correctamente.');
      }
    } catch (error: any) {
      toast.error('Error al guardar los cambios: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 font-sans">
      <PageHeader 
        title="Mi Perfil" 
        subtitle="Gestiona tu información personal y los datos de tu cuenta corporativa."
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
                Rol: {rol}
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-50 rounded-xl p-4 mt-2 text-left">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-900">Seguridad RLS activa</p>
                <p className="text-[10px] text-gray-500 leading-normal mt-0.5">
                  El acceso a tus datos está blindado por políticas de nivel de fila. Solo tú y el personal autorizado comercial tienen acceso.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card principal con Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm md:col-span-2">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900">Información de la Cuenta</h3>
            <p className="text-xs text-gray-500 mt-0.5">Mantén tus datos de contacto corporativo actualizados para agilizar la facturación y la logística.</p>
          </div>

          <form onSubmit={handleGuardar} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Nombre" required>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder="Tu nombre"
                    disabled={saving}
                  />
                </div>
                {errors.nombre && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                    {errors.nombre}
                  </p>
                )}
              </FormField>

              <FormField label="Apellidos" required>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    className={`${inputClasses} pl-10`}
                    placeholder="Tus apellidos"
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

            <FormField label="Correo Electrónico" required>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClasses} pl-10 ${emailInUse ? 'border-red-300 focus:ring-red-600 focus:border-red-600' : ''}`}
                  placeholder="ejemplo@empresa.com"
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
                  Este correo electrónico ya está en uso por otro usuario.
                </p>
              )}
            </FormField>

            <FormField label="Teléfono Corporativo">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className={`${inputClasses} pl-10`}
                  placeholder="Ej: 600123456"
                  disabled={saving}
                />
              </div>
              {errors.telefono ? (
                <p className="text-xs text-red-600 mt-1.5 font-medium animate-in slide-in-from-top-1 duration-200">
                  {errors.telefono}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Opcional. Formato de 9 dígitos numéricos de España. Puede guardarse vacío.
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
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
