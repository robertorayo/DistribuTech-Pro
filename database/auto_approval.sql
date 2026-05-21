-- ==============================================================================
-- SCRIPT DE ACTUALIZACIÓN: APROBACIÓN AUTOMÁTICA DE STOCK
-- ==============================================================================

-- 1. Modificar aprobar_cotizacion para evitar que se apruebe manualmente si ya está en espera de stock
CREATE OR REPLACE FUNCTION aprobar_cotizacion(p_cotizacion_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_detalle RECORD;
  v_todos_ok BOOLEAN := true;
  v_disponible JSONB := '[]'::JSONB;
  v_faltante JSONB := '[]'::JSONB;
  v_tipo_incidencia VARCHAR;
BEGIN
  IF get_my_rol() NOT IN ('admin', 'comercial') THEN
    RAISE EXCEPTION 'Sin permisos para aprobar cotizaciones';
  END IF;

  -- Comprobar si la cotización ya está en espera de stock
  SELECT tipo_incidencia INTO v_tipo_incidencia FROM cotizaciones WHERE id = p_cotizacion_id;
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
$$;

-- 2. Función Trigger para aprobar automáticamente
CREATE OR REPLACE FUNCTION procesar_pedidos_en_espera()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cot RECORD;
  v_detalle RECORD;
  v_puede_aprobar BOOLEAN;
BEGIN
  -- Iterar sobre pedidos en espera que contengan el producto recién actualizado
  FOR v_cot IN 
    SELECT c.id, c.usuario_id
    FROM cotizaciones c
    WHERE c.tipo_incidencia IN ('esperando_stock', 'esperando_stock_completo')
      AND c.estado = 'pendiente'
      AND EXISTS (
        SELECT 1 FROM detalle_cotizacion dc 
        WHERE dc.cotizacion_id = c.id AND dc.producto_id = NEW.id
      )
    ORDER BY c.created_at ASC -- Prioridad FIFO
  LOOP
    v_puede_aprobar := true;
    
    -- Verificar si TODO el pedido tiene stock ahora (Bloqueando productos para atomicidad)
    FOR v_detalle IN 
      SELECT dc.cantidad, p.stock
      FROM detalle_cotizacion dc
      JOIN productos p ON p.id = dc.producto_id
      WHERE dc.cotizacion_id = v_cot.id
      FOR UPDATE OF p
    LOOP
      IF v_detalle.stock < v_detalle.cantidad THEN
        v_puede_aprobar := false;
        EXIT;
      END IF;
    END LOOP;

    IF v_puede_aprobar THEN
      -- Descontar stock
      FOR v_detalle IN 
        SELECT dc.producto_id, dc.cantidad
        FROM detalle_cotizacion dc
        WHERE dc.cotizacion_id = v_cot.id
      LOOP
        UPDATE productos SET stock = stock - v_detalle.cantidad WHERE id = v_detalle.producto_id;
      END LOOP;

      -- Aprobar pedido e indicar que fue automático
      UPDATE cotizaciones 
      SET estado = 'aprobada', 
          tipo_incidencia = 'auto_aprobado',
          notas_stock = 'El pedido ha sido procesado y aprobado automáticamente tras la recepción de nuevo stock.',
          updated_at = now()
      WHERE id = v_cot.id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- 3. Crear el Trigger (borrándolo primero por si existe)
DROP TRIGGER IF EXISTS tr_productos_stock_update ON productos;
CREATE TRIGGER tr_productos_stock_update
AFTER UPDATE OF stock ON productos
FOR EACH ROW
WHEN (NEW.stock > OLD.stock)
EXECUTE FUNCTION procesar_pedidos_en_espera();
