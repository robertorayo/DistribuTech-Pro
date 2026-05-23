-- Solución para permitir que los usuarios actualicen su propio perfil en public.usuarios
-- y proteger las columnas sensibles (rol, descuento_global, etc.) de escalada de privilegios.

-- 1. Política RLS para permitir al usuario actualizar su propio registro
DROP POLICY IF EXISTS "usuario_update_own_profile" ON usuarios;
CREATE POLICY "usuario_update_own_profile" ON usuarios FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 2. Trigger de seguridad para evitar que un usuario normal se dé a sí mismo el rol de 'admin' o cambie descuentos
CREATE OR REPLACE FUNCTION check_usuario_update() RETURNS TRIGGER AS $$
BEGIN
  -- Evitar que usuarios que no sean admin cambien columnas sensibles
  IF (SELECT rol FROM public.usuarios WHERE id = auth.uid()) != 'admin' THEN
    NEW.rol = OLD.rol;
    NEW.activo = OLD.activo;
    NEW.descuento_global = OLD.descuento_global;
    NEW.empresa_id = OLD.empresa_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_usuario_update ON usuarios;
CREATE TRIGGER trg_check_usuario_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION check_usuario_update();
