-- Añadir columnas a usuarios para control de sesión única
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS current_session_id UUID;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_session_activity TIMESTAMPTZ;

-- RPC para registrar el "latido" de sesión o verificar en login
CREATE OR REPLACE FUNCTION registrar_actividad_sesion()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
  v_current UUID;
  v_last_activity TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_session_id := (current_setting('request.jwt.claims', true)::jsonb->>'session_id')::UUID;
  
  -- Leer estado actual
  SELECT current_session_id, last_session_activity 
  INTO v_current, v_last_activity
  FROM usuarios 
  WHERE id = v_user_id;

  -- Permitir acceso si:
  -- 1. No hay sesión activa registrada.
  -- 2. Es la misma sesión.
  -- 3. La última actividad fue hace más de 5 minutos (sesión "zombie" / abandonada).
  IF v_current IS NULL OR v_current = v_session_id OR v_last_activity < (now() - interval '5 minutes') THEN
    UPDATE usuarios 
    SET current_session_id = v_session_id, 
        last_session_activity = now()
    WHERE id = v_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- RPC para limpiar la sesión activa al hacer logout
CREATE OR REPLACE FUNCTION cerrar_sesion_activa()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN
    v_session_id := (current_setting('request.jwt.claims', true)::jsonb->>'session_id')::UUID;
    -- Solo limpiar si la sesión activa es la nuestra
    UPDATE usuarios 
    SET current_session_id = NULL 
    WHERE id = v_user_id AND current_session_id = v_session_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_actividad_sesion() TO authenticated;
GRANT EXECUTE ON FUNCTION cerrar_sesion_activa() TO authenticated;
