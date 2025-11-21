'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useEffect } from 'react';

const MONTHS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Fev' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Abr' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Ago' },
  { value: 9, label: 'Set' },
  { value: 10, label: 'Out' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dez' },
];

export function MonthSelector({ selectedMonth, onMonthChange, availableMonths, disabled = false }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && selectedMonth) {
      const selectedButton = scrollRef.current.querySelector(`[data-month="${selectedMonth}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedMonth]);

  if (!availableMonths || availableMonths.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="text-sm text-gray-500">Nenhum mês disponível</p>
      </div>
    );
  }

  const displayMonths = MONTHS.filter((m) => availableMonths.includes(m.value));
  const currentIndex = displayMonths.findIndex((m) => m.value === selectedMonth);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onMonthChange(displayMonths[currentIndex - 1].value);
    }
  };

  const handleNext = () => {
    if (currentIndex < displayMonths.length - 1) {
      onMonthChange(displayMonths[currentIndex + 1].value);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={handlePrevious}
        disabled={disabled || currentIndex <= 0}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mês anterior">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide max-w-xs sm:max-w-md md:max-w-3xl px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displayMonths.map((month) => (
          <button
            key={month.value}
            data-month={month.value}
            onClick={() => onMonthChange(month.value)}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              month.value === selectedMonth
                ? 'bg-blue-600 text-white scale-110'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}>
            {month.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={disabled || currentIndex >= displayMonths.length - 1}
        className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Próximo mês">
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
