import React from 'react';
import { FilterX } from 'lucide-react';
import { Button } from '../ui/button';

interface FilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ children, onClear, showClear }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-white/50 p-1 rounded-xl">
      <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
        {children}
      </div>
      {showClear && onClear && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClear} 
          className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 font-medium shrink-0"
        >
          <FilterX className="w-4 h-4" />
          <span className="hidden lg:inline">Limpiar</span>
        </Button>
      )}
    </div>
  );
};
