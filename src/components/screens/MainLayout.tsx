"use client";

import { useState } from "react";

interface MainLayoutProps {
  user: any;
  onLogout: () => void;
  children: React.ReactNode;
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

const menuItems = [
  { id: "dashboard",   label: "Dashboard"               },
  { id: "org-setup",   label: "Organization",  adminOnly: true },
  { id: "assets",      label: "Asset directory"         },
  { id: "allocations", label: "Allocations"             },
  { id: "bookings",    label: "Resource booking"        },
  { id: "maintenance", label: "Maintenance"             },
  { id: "audits",      label: "Audits"                  },
  { id: "reports",     label: "Reports",       managerOnly: true },
  { id: "logs",        label: "Activity logs"           },
];

const roleLabel: Record<string, string> = {
  Admin:        "Admin",
  AssetManager: "Asset manager",
  DeptHead:     "Dept. head",
  Employee:     "Employee",
};

export default function MainLayout({
  user,
  onLogout,
  children,
  activeScreen,
  setActiveScreen,
}: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isManager = user.role === "Admin" || user.role === "AssetManager";
  const filtered = menuItems.filter(m => {
    if (m.adminOnly && user.role !== "Admin") return false;
    if (m.managerOnly && !isManager) return false;
    return true;
  });

  const SidebarContent = () => (
    <div
      className="sidebar-grain flex flex-col h-full"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Brand */}
      <div
        className="px-5 py-5 flex items-center gap-3"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          A
        </div>
        <span
          className="font-semibold text-sm tracking-tight"
          style={{ color: "var(--sidebar-fg)" }}
        >
          AssetFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filtered.map(item => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveScreen(item.id); setMobileOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors"
              style={{
                background:  isActive ? "var(--sidebar-active-bg)"   : "transparent",
                color:       isActive ? "var(--sidebar-active)"       : "var(--sidebar-muted)",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--sidebar-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--sidebar-fg)"; }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--sidebar-muted)"; } }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
            style={{ background: "var(--sidebar-active-bg)", color: "var(--sidebar-active)" }}
          >
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--sidebar-fg)" }}>
              {user.name}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--sidebar-muted)" }}>
              {roleLabel[user.role] ?? user.role}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-left text-xs px-1 py-1 rounded transition-colors"
          style={{ color: "var(--sidebar-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--sidebar-muted)"; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[200] md:hidden"
          style={{ background: "oklch(0% 0 0 / 0.5)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 z-[300] h-screen w-64 flex flex-col",
          "md:translate-x-0 md:static md:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{ transition: "transform 200ms var(--ease-out)" }}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3"
          style={{
            background: "var(--sidebar-bg)",
            borderBottom: "1px solid var(--sidebar-border)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded"
            style={{ color: "var(--sidebar-muted)" }}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--sidebar-fg)" }}>AssetFlow</span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto mesh-bg" style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
