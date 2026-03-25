
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, prefix, className, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        {prefix && (
          <div className="absolute left-4 inset-y-0 flex items-center pointer-events-none">
            <span className="text-[11px] font-black text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              {prefix}
            </span>
          </div>
        )}
        <input
          {...props}
          className={`
            w-full min-h-[48px] px-4 py-2
            border border-slate-200 bg-slate-50/50
            transition-all duration-300
            placeholder:text-slate-300 text-[11px] font-medium
            focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white
            ${prefix ? 'pl-11' : ''}
            ${error ? 'border-red-500' : 'hover:border-slate-300'}
            disabled:opacity-50
            ${className}
          `}
        />
      </div>
      {error && <span className="text-[10px] font-semibold text-red-500 mt-1">{error}</span>}
    </div>
  );
};

interface SelectProps {
  label: string;
  options: string[];
  value?: string;
  onChange: (e: { target: { value: string } }) => void;
  error?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({ label, options, value, onChange, error, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) updateCoords();
  }, [isOpen]);

  useEffect(() => {
    const handleEvents = () => {
      if (isOpen) updateCoords();
    };
    window.addEventListener('scroll', handleEvents, true);
    window.addEventListener('resize', handleEvents);
    
    const handleClickOutside = (event: MouseEvent) => {
      // Ignora se o clique for dentro do portal do select
      const portal = document.querySelector('[data-select-portal]');
      if (portal?.contains(event.target as Node)) return;
      
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleEvents, true);
      window.removeEventListener('resize', handleEvents);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange({ target: { value: option } });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full text-left relative" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full min-h-[48px] px-4 py-2 flex items-center justify-between
          border border-slate-200 bg-slate-50/50 text-left
          transition-all duration-300 text-[11px] font-medium
          focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white
          ${error ? 'border-red-500' : 'hover:border-slate-300'}
          ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white' : ''}
        `}
      >
        <span className={value ? 'text-slate-900 font-bold' : 'text-slate-300'}>
          {value || 'Selecione...'}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && coords.width > 0 && createPortal(
        <div 
          data-select-portal
          style={{ 
            position: 'fixed', 
            top: coords.top + 4, 
            left: coords.left, 
            width: coords.width,
            zIndex: 9999 
          }}
          className="bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 rounded-sm"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => e.preventDefault()} // Impede perda de foco antes do click
                onClick={() => handleSelect(opt)}
                className={`
                  w-full px-4 py-3 text-[11px] text-left font-semibold transition-colors
                  ${value === opt ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
      
      {error && <span className="text-[10px] font-semibold text-red-500 mt-1">{error}</span>}
    </div>
  );
};

// Fix: Redefined prop types for DatePicker to include 'value' and 'onChange' which were previously omitted by mistake.
export const DatePicker: React.FC<Omit<InputProps, 'type'>> = ({ 
  label, 
  value, 
  onChange, 
  error, 
  required 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) updateCoords();
  }, [isOpen]);

  useEffect(() => {
    const handleEvents = () => {
      if (isOpen) updateCoords();
    };
    window.addEventListener('scroll', handleEvents, true);
    window.addEventListener('resize', handleEvents);
    
    const handleClickOutside = (event: MouseEvent) => {
      const portal = document.querySelector('[data-datepicker-portal]');
      if (portal?.contains(event.target as Node)) return;
      
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleEvents, true);
      window.removeEventListener('resize', handleEvents);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, '0');
    const dd = String(selected.getDate()).padStart(2, '0');
    const formatted = `${yyyy}-${mm}-${dd}`;
    
    if (onChange) {
      onChange({ target: { value: formatted } } as any);
    }
    setIsOpen(false);
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Cálculo de linhas necessárias (evita espaço vazio)
  const totalSlotsNeeded = firstDay + daysInMonth;
  const rowsNeeded = Math.ceil(totalSlotsNeeded / 7);
  const totalGridSlots = rowsNeeded * 7;

  const displayValue = value ? (value as string).split('-').reverse().join('/') : '';
  const selectedDate = value ? new Date(value as string + 'T00:00:00') : null;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left relative" ref={containerRef}>
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full min-h-[48px] px-4 py-2 flex items-center justify-between
          border border-slate-200 bg-slate-50/50 text-left
          transition-all duration-300 text-[11px] font-medium
          focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white
          ${error ? 'border-red-500' : 'hover:border-slate-300'}
          ${isOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10 bg-white' : ''}
        `}
      >
        <span className={value ? 'text-slate-900 font-bold' : 'text-slate-300'}>
          {displayValue || 'Escolha uma data..'}
        </span>
        <svg className={`w-5 h-5 text-slate-400 transition-colors ${isOpen ? 'text-indigo-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isOpen && coords.width > 0 && createPortal(
        <div 
          data-datepicker-portal
          style={{ 
            position: 'fixed', 
            top: coords.top + 8, 
            left: coords.left, 
            zIndex: 9999 
          }}
          className="w-[280px] bg-white border border-slate-200 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] p-4 animate-in fade-in slide-in-from-top-2 duration-200 rounded-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight text-center flex-1">
              {months[currentMonth]} {currentYear}
            </div>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2 border-b border-slate-50 pb-2">
            {daysOfWeek.map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[9px] font-black text-slate-300 uppercase">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 overflow-hidden">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white aspect-square" />
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDate?.getDate() === day && 
                               selectedDate?.getMonth() === currentMonth && 
                               selectedDate?.getFullYear() === currentYear;
              
              const today = new Date();
              const isToday = today.getDate() === day && 
                            today.getMonth() === currentMonth && 
                            today.getFullYear() === currentYear;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`
                    relative bg-white aspect-square flex items-center justify-center text-[11px] font-bold transition-all
                    hover:bg-indigo-50 hover:text-indigo-600
                    ${isSelected ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white ring-2 ring-indigo-600 ring-inset' : 'text-slate-600'}
                  `}
                >
                  {day}
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
            
            {/* Slots dinâmicos de final de grade para manter o alinhamento */}
            {Array.from({ length: totalGridSlots - totalSlotsNeeded }).map((_, i) => (
              <div key={`empty-end-${i}`} className="bg-white aspect-square" />
            ))}
          </div>
        </div>,
        document.body
      )}

      {error && <span className="text-[10px] font-semibold text-red-500 mt-1">{error}</span>}
    </div>
  );
};
