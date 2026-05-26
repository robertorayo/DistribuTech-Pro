import React from 'react';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
}

const DEFAULT_COLOR_MAP: Record<string, string> = {
  pendiente: 'bg-orange-50 text-orange-700 border-orange-200',
  aprobada: 'bg-green-50 text-green-700 border-green-200',
  rechazada: 'bg-red-50 text-red-700 border-red-200',
  activo: 'bg-green-50 text-green-700 border-green-200',
  inactivo: 'bg-red-50 text-red-600 border-red-200',
};

/**
 * Badge de estado con colores automáticos.
 * Unifica los badges de estados usados en ComercialDashboard y AdminProductos.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  colorMap = DEFAULT_COLOR_MAP,
}) => {
  const colorClasses = colorMap[status.toLowerCase()] || 'bg-muted/10 text-foreground/90 border-border';

  return (
    <span
      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClasses}`}
    >
      {status}
    </span>
  );
};
