import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/shared';
import { Building2, Users, Target, Phone, Mail, MapPin } from 'lucide-react';

export const SobreNosotros: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-500 font-sans">
      <PageHeader 
        title={t('about.title')} 
        subtitle={t('about.subtitle')}
        icon={Building2}
        iconColor="text-primary"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('about.history_title')}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t('about.history_p1_1')}<strong>{t('about.history_p1_bold')}</strong>{t('about.history_p1_2')}
            </p>
          </section>

          <section className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('about.mission_title')}</h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>{t('about.mission_label')}</strong> {t('about.mission_desc')}
              </p>
              <p>
                <strong>{t('about.vision_label')}</strong> {t('about.vision_desc')}
              </p>
            </div>
          </section>

          <section className="bg-card rounded-2xl border border-border/50 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">{t('about.team_title')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/20 bg-muted/10/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground font-bold text-lg">
                  CJ
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t('about.ceo_name')}</h4>
                  <p className="text-xs text-primary font-medium">{t('about.ceo_role')}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-border/20 bg-muted/10/50 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0 flex items-center justify-center text-muted-foreground font-bold text-lg">
                  MR
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t('about.sales_director_name')}</h4>
                  <p className="text-xs text-primary font-medium">{t('about.sales_director_role')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Columna lateral: Contacto */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-2xl p-8 shadow-md text-white">
            <h3 className="text-xl font-bold mb-6">{t('about.contact_title')}</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-100">{t('about.hq_title')}</h4>
                  <p className="text-sm mt-1 leading-relaxed">
                    {t('about.hq_line1')}<br />
                    {t('about.hq_line2')}<br />
                    {t('about.hq_line3')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-100">{t('about.support_title')}</h4>
                  <p className="text-sm mt-1">+34 900 123 456</p>
                  <p className="text-xs text-blue-200 mt-0.5">{t('about.support_schedule')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-100">{t('about.email_title')}</h4>
                  <p className="text-sm mt-1">b2b@distributech.es</p>
                  <p className="text-sm">soporte@distributech.es</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
