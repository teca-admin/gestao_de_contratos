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

      {isOpen && (
        <div 
          className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 shadow-2xl rounded-sm flex flex-col z-50"
        >
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                className={`
                  w-full px-4 py-3 text-[11px] text-left font-bold transition-colors uppercase
                  ${value === opt ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}
                `}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {error && <span className="text-[10px] font-semibold text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export const DatePicker: React.FC<Omit<InputProps, 'type'>> = (props) => {
  return (
    <Input
      type="date"
      {...props}
      className={`uppercase ${props.className || ''}`}
    />
  );
};