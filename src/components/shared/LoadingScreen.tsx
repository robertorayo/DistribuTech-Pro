import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Spinner de carga a pantalla completa.
 * Reemplaza el bloque de loading duplicado en 7+ páginas.
 */
export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="text-gray-500 font-medium animate-pulse">{t('app.loading')}</p>
    </div>
  );
};
