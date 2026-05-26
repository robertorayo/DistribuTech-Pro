import React from 'react';
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface DataTableProps {
  columns: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Wrapper de tabla de datos con cabecera y cuerpo estandarizados.
 * Reemplaza la estructura <table> duplicada en AdminProductos, AdminCategorias, 
 * AdminFabricantes y ComercialDashboard.
 */
export const DataTable: React.FC<DataTableProps> = ({ columns, children, footer }) => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/10 border-b border-border text-muted-foreground">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-5 py-4 font-bold uppercase tracking-wider text-[10px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{children}</tbody>
        </table>
      </div>
      {footer && (
        <div className="px-6 py-3 bg-muted/10 border-t border-border text-xs text-muted-foreground font-medium">
          {footer}
        </div>
      )}
    </div>
  );
};

/* ----- Componentes de acción para filas de tabla ----- */

interface RowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Botones de acción (editar/eliminar) para filas de tabla.
 */
export const RowActions: React.FC<RowActionsProps> = ({
  onEdit,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        onClick={onEdit}
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-red-600"
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
