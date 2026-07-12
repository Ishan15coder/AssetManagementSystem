import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}

export function CustomSelect({ value, onChange, options, className = "", placeholder = "Select an option" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] px-3 py-2 text-xs rounded-[var(--radius-sm)] flex items-center justify-between transition-colors hover:border-[var(--accent-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`text-[var(--muted)] shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[999] top-full left-0 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors hover:bg-[var(--surface-2)] ${String(value) === String(opt.value) ? "bg-[var(--surface-2)] text-[var(--accent)] font-semibold" : "text-[var(--fg)]"}`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {String(value) === String(opt.value) && <Check size={14} className="shrink-0 text-[var(--success)]" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
