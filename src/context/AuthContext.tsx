import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  rol: RolUsuario | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  rol: null,
  isLoading: true,
  signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Función auxiliar para obtener el rol real de la base de datos
    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', userId)
          .single() as any;

        if (error) throw error;
        setRol(data?.rol || null);
      } catch (error) {
        console.error('Error al obtener el rol de la base de datos:', error);
        // Fallback al JWT si la base de datos falla
        setRol(null);
      } finally {
        setIsLoading(false);
      }
    };

    // 1. Obtener la sesión activa al recargar la página
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      // Limpieza del "recordar email" tras 24h (sin expulsar al usuario)
      const expiry = localStorage.getItem('session_expiry');
      if (expiry && Date.now() > parseInt(expiry)) {
        // Sesión expirada: limpiar por completo la credencial
        localStorage.removeItem('session_expiry');
        localStorage.removeItem('remembered_email');
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Escuchar cambios (login, logout, refresh de token automático)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setRol(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    localStorage.removeItem('session_expiry');      // Borra el temporizador
    localStorage.removeItem('remembered_email');    // Borra el rastro del email
    await supabase.auth.signOut();                  // Cierra sesión en Supabase
  };

  return (
    <AuthContext.Provider value={{ session, user, rol, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
