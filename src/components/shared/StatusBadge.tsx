import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  /** Valor tal cual viene de la BD (pendiente, aprobada, rechazada, activo, inactivo). */
  status: string;
  colorMap?: Record<string, string>;
}

// Cada color lleva su variante oscura: los fondos -50 casi blancos no se leen en modo oscuro.
const DEFAULT_COLOR_MAP: Record<string, string> = {
  pendiente: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
  aprobada: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
  rechazada: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
  activo: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900',
  inactivo: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
};

// Clave de traducción de cada estado; los desconocidos se muestran tal cual.
const ETIQUETAS: Record<string, string> = {
  pendiente: 'common.status_pending',
  aprobada: 'common.status_approved',
  rechazada: 'common.status_rejected',
  activo: 'common.status_active',
  inactivo: 'common.status_inactive',
};

/**
 * Badge de estado con colores automáticos y texto traducido.
 * Unifica los badges de estados usados en ComercialDashboard, MisPedidos y AdminProductos.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap = DEFAULT_COLOR_MAP,
}) => {
  const { t } = useTranslation();
  const clave = status.toLowerCase();
  const colorClasses = colorMap[clave] || 'bg-muted/40 text-foreground/90 border-border';

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClasses}`}
    >
      {ETIQUETAS[clave] ? t(ETIQUETAS[clave]) : status}
    </span>
  );
};
