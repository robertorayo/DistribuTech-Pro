import React from 'react';
import { FilterX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';

interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, onClear, showClear }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full bg-card/50 p-1 rounded-xl">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3 w-full">
        {children}
      </div>
      {showClear && onClear && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear} 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 font-medium shrink-0 h-10 lg:h-9"
        >
          <FilterX className="w-4 h-4" />
          <span className="lg:hidden">{t('common.clear_filters')}</span>
          <span className="hidden lg:inline">{t('common.clear')}</span>
        </Button>
      )}
    </div>
  );
};
