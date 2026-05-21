import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper de campo de formulario con label consistente.
 * Elimina la repetición de <div><label>...<input> en todos los formularios CRUD.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
};

/* Estilos reutilizables para inputs */
export const inputClasses =
  'w-full rounded-md border border-gray-300 p-2.5 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors';

export const selectClasses = `${inputClasses} bg-white`;

export const textareaClasses = `${inputClasses} resize-none`;
