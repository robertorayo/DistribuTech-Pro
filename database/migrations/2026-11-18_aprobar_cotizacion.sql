-- ==============================================================================
-- DISTRIBUTECH PRO - aprobar_cotizacion más estricta
-- ==============================================================================
-- ESTADO: APLICADA en producción el 18-11-2026. Integrada en database/schema.sql.
--
-- Cuerpo copiado de producción (pg_get_functiondef) con dos cambios:
--   1. COALESCE en la comprobación de rol: "NULL NOT IN (...)" es NULL y no lanzaba el error.
--   2. Solo se aprueba una cotización que existe y sigue pendiente, bloqueándola (FOR UPDATE).
--      Antes se podía aprobar dos veces la misma y descontar el stock dos veces.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.aprobar_cotizacion(p_cotizacion_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_detalle RECORD;
  v_todos_ok BOOLEAN := true;
  v_disponible JSONB := '[]'::JSONB;
  v_faltante JSONB := '[]'::JSONB;
  v_estado TEXT;
  v_tipo_incidencia VARCHAR;
BEGIN
  IF COALESCE(get_my_rol(), '') NOT IN ('admin', 'comercial') THEN
    RAISE EXCEPTION 'Sin permisos para aprobar cotizaciones';
  END IF;

  SELECT estado::TEXT, tipo_incidencia INTO v_estado, v_tipo_incidencia
  FROM cotizaciones WHERE id = p_cotizacion_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cotización no encontrada';
  END IF;
  IF v_estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Solo se puede aprobar una cotización pendiente (estado actual: %)', v_estado;
  END IF;

  -- Comprobar si la cotización ya está en espera de stock
  IF v_tipo_incidencia IN ('esperando_stock', 'esperando_stock_completo', 'pendiente_decision_cliente') THEN
    RETURN jsonb_build_object('resultado', 'ya_en_espera', 'tiene_incidencia', true);
  END IF;

  FOR v_detalle IN
    SELECT dc.id, dc.producto_id, dc.cantidad, p.nombre, p.stock
    FROM detalle_cotizacion dc
    JOIN productos p ON p.id = dc.producto_id
    WHERE dc.cotizacion_id = p_cotizacion_id
    FOR UPDATE OF p
  LOOP
    IF v_detalle.stock >= v_detalle.cantidad THEN
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.cantidad, 'cantidad_faltante', 0
      );
    ELSE
      v_todos_ok := false;
      v_disponible := v_disponible || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
      v_faltante := v_faltante || jsonb_build_object(
        'producto_id', v_detalle.producto_id, 'nombre', v_detalle.nombre,
        'cantidad_pedida', v_detalle.cantidad, 'cantidad_disponible', v_detalle.stock,
        'cantidad_faltante', v_detalle.cantidad - v_detalle.stock
      );
    END IF;
  END LOOP;

  IF v_todos_ok THEN
    FOR v_detalle IN
      SELECT dc.producto_id, dc.cantidad FROM detalle_cotizacion dc WHERE dc.cotizacion_id = p_cotizacion_id
    LOOP
      UPDATE productos SET stock = stock - v_detalle.cantidad WHERE id = v_detalle.producto_id;
    END LOOP;
    UPDATE cotizaciones SET estado = 'aprobada', notas_stock = NULL, tipo_incidencia = NULL, updated_at = now()
    WHERE id = p_cotizacion_id;
    RETURN jsonb_build_object('resultado', 'aprobada', 'tiene_incidencia', false);
  ELSE
    UPDATE cotizaciones
    SET tipo_incidencia = 'pendiente_decision_cliente',
        notas_stock = jsonb_build_object('disponible', v_disponible, 'faltante', v_faltante)::TEXT,
        updated_at = now()
    WHERE id = p_cotizacion_id;
    RETURN jsonb_build_object('resultado', 'pendiente_decision_cliente', 'tiene_incidencia', true,
      'disponible', v_disponible, 'faltante', v_faltante);
  END IF;
END;
$function$;
