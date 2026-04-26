import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  es: {
    translation: {
      "app": {
        "title": "DistribuTech Pro",
        "catalog": "Catálogo B2B",
        "login": "Iniciar Sesión",
        "logout": "Cerrar Sesión",
        "loading": "Cargando..."
      }
    }
  },
  en: {
    translation: {
      "app": {
        "title": "DistribuTech Pro",
        "catalog": "B2B Catalog",
        "login": "Login",
        "logout": "Logout",
        "loading": "Loading..."
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
