-- ==============================================================================
-- DISTRIBUTECH PRO - Registro de auditoría y limpieza de permisos
-- ==============================================================================
-- ESTADO: APLICADA en producción el 18-11-2026. Integrada en database/schema.sql.
--
-- 1. Tabla `auditoria`: quién (auth.uid()), qué tabla, qué operación, fila, valor anterior
--    y nuevo, y cuándo. La rellena un trigger en productos, categorias, fabricantes,
--    usuarios y cotizaciones. Solo el admin puede leerla; nadie puede escribirla, editarla
--    ni borrarla desde la API (RLS sin políticas de escritura).
-- 2. El admin puede leer pedido_historial_estados (antes no la leía nadie).
-- 3. Las funciones de trigger dejan de ser invocables por la API (aviso del linter de
--    Supabase). No era explotable, pero sobraba.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.auditoria (
  id BIGSERIAL PRIMARY KEY,
  tabla TEXT NOT NULL,
  operacion TEXT NOT NULL CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
  fila_id UUID,
  usuario_id UUID,               -- NULL si el cambio no viene de un usuario (SQL Editor, cron)
  anterior JSONB,
  nuevo JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla_fila ON public.auditoria (tabla, fila_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria (created_at DESC);

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS auditoria_leer_admin ON public.auditoria;
CREATE POLICY auditoria_leer_admin ON public.auditoria FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'admin');
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.auditoria FROM anon, authenticated;

-- Columnas que cambian solas en cada visita o recalculo: no generan entrada por sí solas.
CREATE OR REPLACE FUNCTION public.registrar_auditoria() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ignoradas TEXT[] := ARRAY['updated_at', 'last_session_activity', 'current_session_id'];
  v_anterior JSONB := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_nuevo JSONB := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
BEGIN
  IF TG_OP = 'UPDATE' AND (v_anterior - v_ignoradas) = (v_nuevo - v_ignoradas) THEN
    RETURN NULL;
  END IF;
  INSERT INTO auditoria (tabla, operacion, fila_id, usuario_id, anterior, nuevo)
  VALUES (TG_TABLE_NAME, TG_OP,
          COALESCE(v_nuevo ->> 'id', v_anterior ->> 'id')::UUID,
          auth.uid(), v_anterior, v_nuevo);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria ON public.productos;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.categorias;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.fabricantes;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.fabricantes
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.usuarios;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();
DROP TRIGGER IF EXISTS trg_auditoria ON public.cotizaciones;
CREATE TRIGGER trg_auditoria AFTER INSERT OR UPDATE OR DELETE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.registrar_auditoria();

-- Historial de estados de pedidos: lectura para el admin.
DROP POLICY IF EXISTS historial_leer_admin ON public.pedido_historial_estados;
CREATE POLICY historial_leer_admin ON public.pedido_historial_estados FOR SELECT TO authenticated
  USING (public.get_my_rol() = 'admin');

-- Funciones de trigger: solo las ejecuta PostgreSQL al dispararse el trigger.
REVOKE EXECUTE ON FUNCTION
  public.registrar_auditoria(),
  public.handle_new_user(),
  public.sync_totales_cotizacion(),
  public.sync_totales_pedido(),
  public.log_cambio_estado_pedido(),
  public.check_usuario_update(),
  public.bloquear_credenciales_demo(),
  public.proteger_insert_cotizacion(),
  public.proteger_update_cotizacion(),
  public.proteger_insert_detalle_cotizacion(),
  public.proteger_usuario_demo(),
  public.procesar_pedidos_en_espera()
FROM PUBLIC, anon, authenticated;
