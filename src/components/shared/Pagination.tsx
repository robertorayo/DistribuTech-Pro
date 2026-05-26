import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '../ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [jumpPage, setJumpPage] = useState(String(currentPage));

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setJumpPage(String(currentPage));
    }
  };

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 3;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 2;
      }
      
      if (start > 2) pages.push('ellipsis-start');
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) pages.push('ellipsis-end');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-card border border-border/50 rounded-xl shadow-sm mt-4">
      {/* Page Info */}
      <div className="text-xs font-semibold text-muted-foreground">
        Página <span className="text-foreground font-bold">{currentPage}</span> de{' '}
        <span className="text-foreground font-bold">{totalPages}</span>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Primera página"
          className="border-border"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Página anterior"
          className="border-border"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {getPageNumbers().map((p, idx) => {
          if (p === 'ellipsis-start' || p === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground/70 font-bold">
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isCurrent = pageNum === currentPage;

          return (
            <Button
              key={`page-${pageNum}`}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`h-7 w-7 text-xs font-bold ${
                isCurrent 
                  ? 'bg-primary hover:bg-primary/90 text-white border-blue-600 shadow-sm' 
                  : 'border-border hover:bg-muted/10 text-foreground/90'
              }`}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Página siguiente"
          className="border-border"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Última página"
          className="border-border"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Direct Jump to Page Form */}
      <form onSubmit={handleJump} className="flex items-center gap-2">
        <label htmlFor="jump-page-input" className="text-xs font-semibold text-muted-foreground">
          Ir a:
        </label>
        <input
          id="jump-page-input"
          type="number"
          min="1"
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          className="w-12 h-7 rounded-lg border border-border text-center text-xs font-bold focus:border-primary focus:outline-none"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-7 text-[10px] uppercase font-bold tracking-wider px-2 hover:bg-primary/5 hover:text-primary border-border transition-colors"
        >
          Saltar
        </Button>
      </form>
    </div>
  );
};
