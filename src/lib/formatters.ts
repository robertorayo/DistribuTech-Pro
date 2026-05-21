import { useTranslation } from 'react-i18next';

/**
 * Formatea un número como moneda EUR, adaptándose al idioma activo.
 * Centraliza la lógica que antes se duplicaba en 5+ componentes.
 */
export const useFormatCurrency = () => {
  const { i18n } = useTranslation();

  return (valor: number): string => {
    return new Intl.NumberFormat(i18n.language === 'es' ? 'es-ES' : 'en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(valor);
  };
};

/**
 * Formatea una fecha adaptándose al idioma activo.
 */
export const useFormatDate = () => {
  const { i18n } = useTranslation();

  return (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    };
    return new Date(date).toLocaleDateString(
      i18n.language === 'es' ? 'es-ES' : 'en-US',
      options || defaultOptions
    );
  };
};
