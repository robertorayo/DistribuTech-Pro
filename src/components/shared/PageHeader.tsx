import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  children?: React.ReactNode;
}

/**
 * Cabecera de página con título, subtítulo, icono y botón de acción opcional.
 * Unifica la cabecera duplicada en todas las páginas del panel.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  children,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2 sm:gap-3">
          {Icon && <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor}`} />}
          {title}
        </h1>
        {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="flex-1 sm:flex-none gap-2 font-bold shadow-md">
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {actionLabel}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
};
