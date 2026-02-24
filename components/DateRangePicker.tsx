import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
  value: { start: string; end: string };
  onChange: (range: { start: string; end: string }) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Helper to convert string YYYY-MM-DD to Date object
  const stringToDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to convert Date object to string YYYY-MM-DD
  const dateToString = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Internal state for the picker logic
  const [internalRange, setInternalRange] = useState<{ start: Date | null; end: Date | null }>({
    start: stringToDate(value.start),
    end: stringToDate(value.end)
  });
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state when props change (e.g. when cleared from outside)
  useEffect(() => {
    setInternalRange({
      start: stringToDate(value.start),
      end: stringToDate(value.end)
    });
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateClick = (date: Date) => {
    if (!internalRange.start || (internalRange.start && internalRange.end)) {
      setInternalRange({ start: date, end: null });
    } else if (date < internalRange.start) {
      setInternalRange({ start: date, end: null });
    } else {
      setInternalRange({ ...internalRange, end: date });
    }
  };

  const isSelected = (date: Date) => {
    if (!date) return false;
    return (
      (internalRange.start && date.toDateString() === internalRange.start.toDateString()) ||
      (internalRange.end && date.toDateString() === internalRange.end.toDateString())
    );
  };

  const isInRange = (date: Date) => {
    if (!date || !internalRange.start) return false;
    const endValue = internalRange.end || hoverDate;
    if (!endValue) return false;
    return date > internalRange.start && date < endValue;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(currentMonth);

    const daySize = "h-5 w-5"; 

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={daySize}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const selected = isSelected(date);
      const highlighted = isInRange(date);

      days.push(
        <button
          key={d}
          type="button"
          onClick={() => handleDateClick(date)}
          onMouseEnter={() => !internalRange.end && setHoverDate(date)}
          className={`${daySize} flex items-center justify-center text-[9px] transition-all relative rounded-md
            ${selected ? 'bg-[#0f172a] text-white font-bold z-10' : ''}
            ${highlighted ? 'bg-blue-50 text-[#0f172a]' : ''}
            ${!selected && !highlighted ? 'hover:bg-gray-100 text-gray-700' : ''}
          `}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="flex flex-col w-[210px] h-[200px] bg-white rounded-lg shadow-xl border border-gray-200 select-none overflow-hidden">
        <div className="flex items-center justify-between p-2 pb-0.5">
          <button type="button" onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <h3 className="text-[9px] font-bold text-[#0f172a] uppercase tracking-wider">
            {monthName} {year}
          </h3>
          <button type="button" onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="px-2 py-0.5 flex-1">
          <div className="grid grid-cols-7 mb-0.5 text-center justify-items-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
              <div key={`${day}-${index}`} className="text-[8px] font-bold text-gray-400 h-4 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0 text-center justify-items-center">
            {days}
          </div>
        </div>

        <div className="p-2 border-t border-gray-100 flex justify-end items-center gap-2 bg-gray-50/30">
          <button 
            type="button"
            onClick={() => {
              setInternalRange({
                start: stringToDate(value.start),
                end: stringToDate(value.end)
              });
              setIsOpen(false);
            }}
            className="text-[8px] font-bold text-gray-400 uppercase hover:text-gray-600 transition-colors"
          >
            CANCELAR
          </button>
          <button 
            type="button"
            disabled={!internalRange.start || !internalRange.end}
            onClick={() => {
              onChange({
                start: dateToString(internalRange.start),
                end: dateToString(internalRange.end)
              });
              setIsOpen(false);
            }}
            className="px-2 py-1 text-[8px] font-bold text-white bg-[#0f172a] rounded uppercase tracking-wider hover:opacity-90 disabled:opacity-30 transition-all shadow-sm"
          >
            APLICAR
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-xs" ref={containerRef}>
      <label className="block text-[10px] font-bold text-[#64748b] mb-1 uppercase tracking-widest ml-1">
        Período Registros
      </label>
      
      <div className="relative">
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-gray-300 h-[38px] px-3 rounded flex items-center justify-between cursor-pointer transition-all hover:border-gray-400 outline-none shadow-sm"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className={`text-[12px] truncate ${!internalRange.start ? 'text-gray-400' : 'text-[#1e293b] font-medium'}`}>
              {internalRange.start 
                ? `${formatDate(internalRange.start)} - ${internalRange.end ? formatDate(internalRange.end) : 'DD/MM/AAAA'}`
                : 'DD/MM/AAAA - DD/MM/AAAA'
              }
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {internalRange.start && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange({ start: '', end: '' }); }}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isOpen && (
          <div className="absolute top-full right-0 mt-1 z-50 animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xl">
            {renderCalendar()}
          </div>
        )}
      </div>
    </div>
  );
};
