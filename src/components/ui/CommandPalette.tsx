"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Command, LayoutDashboard, Building2, Package, Calendar, Wrench, FileCheck, BarChart3, Activity } from "lucide-react";

interface CommandPaletteProps {
  setActiveScreen: (screen: string) => void;
  userRole: string;
}

export function CommandPalette({ setActiveScreen, userRole }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} />, roles: ["Admin", "AssetManager", "DeptHead", "Employee"] },
    { id: "org-setup", label: "Organization Setup", icon: <Building2 size={14} />, roles: ["Admin"] },
    { id: "assets", label: "Asset Directory", icon: <Package size={14} />, roles: ["Admin", "AssetManager", "DeptHead", "Employee"] },
    { id: "allocations", label: "Allocations", icon: <Package size={14} />, roles: ["Admin", "AssetManager", "DeptHead"] },
    { id: "bookings", label: "Resource Booking", icon: <Calendar size={14} />, roles: ["Admin", "AssetManager", "DeptHead", "Employee"] },
    { id: "maintenance", label: "Maintenance Tickets", icon: <Wrench size={14} />, roles: ["Admin", "AssetManager", "DeptHead", "Employee"] },
    { id: "audits", label: "Audits", icon: <FileCheck size={14} />, roles: ["Admin", "AssetManager", "DeptHead"] },
    { id: "reports", label: "Reports & Analytics", icon: <BarChart3 size={14} />, roles: ["Admin", "AssetManager"] },
    { id: "logs", label: "Activity Logs", icon: <Activity size={14} />, roles: ["Admin", "AssetManager"] },
  ];

  const filteredItems = allItems.filter(
    (item) => item.roles.includes(userRole) && item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (id: string) => {
    setActiveScreen(id);
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-start justify-center pt-[15vh] p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)] gap-3">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-[var(--fg)] text-sm placeholder:text-[var(--placeholder)]"
            placeholder="Search pages and actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex gap-1">
            <kbd className="bg-[var(--surface-2)] text-[var(--muted)] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]">esc</kbd>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length > 0 ? (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 py-2">
                Navigation
              </div>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--fg)] hover:bg-[var(--surface-2)] rounded-lg transition-colors text-left group"
                >
                  <div className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--muted)]">
              No results found for "{query}"
            </div>
          )}
        </div>
        
        <div className="bg-[var(--surface-2)] border-t border-[var(--border)] px-4 py-2.5 flex items-center justify-between text-[10px] text-[var(--muted)]">
          <div className="flex items-center gap-1.5">
            <span>Use</span>
            <kbd className="bg-[var(--surface)] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]">↑</kbd>
            <kbd className="bg-[var(--surface)] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]">↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="bg-[var(--surface)] font-mono px-1.5 py-0.5 rounded border border-[var(--border)]">enter</kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
      
      {/* Click outside overlay handler */}
      <div className="absolute inset-0 z-[-1]" onClick={() => setIsOpen(false)}></div>
    </div>
  );
}
