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
        className="w-full text-left bg-(--surface) border border-(--border) text-(--fg) px-3 py-2 text-xs rounded-sm flex items-center justify-between transition-colors hover:border-(--accent-subtle) focus:outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent-subtle)"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`text-(--muted) shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[999] top-full left-0 min-w-full w-max max-w-[320px] mt-1 bg-(--surface) border border-(--border) rounded-sm shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <ul className="max-h-60 overflow-y-auto py-1 scrollbar-thin">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`pl-3 pr-8 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors hover:bg-(--surface-2) ${String(value) === String(opt.value) ? "bg-(--surface-2) text-(--accent) font-semibold" : "text-(--fg)"}`}
              >
                <span className="truncate pr-2">{opt.label}</span>
                {String(value) === String(opt.value) && <Check size={14} className="shrink-0 text-(--success) ml-3" />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
