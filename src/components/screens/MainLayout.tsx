"use client";

import { useState, useEffect } from "react";

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
  { id: "logs",        label: "Activity logs", managerOnly: true },
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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.setAttribute("data-theme", initial);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const fetchNotifs = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

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
        className="px-5 py-5 flex items-center"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <span
          className="font-bold text-3xl tracking-tight"
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
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-(--radius-sm) text-sm font-medium text-left transition-colors"
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
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
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
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
          <button
            onClick={() => setShowNotifs(true)}
            className="relative text-xs flex items-center gap-1.5 font-medium text-(--sidebar-muted) hover:text-(--sidebar-fg)"
          >
            <span className="relative flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </span>
            <span>Alerts</span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="text-xs transition-colors text-(--sidebar-muted) hover:text-(--sidebar-fg) flex items-center gap-1.5"
            title="Toggle color theme"
          >
            {theme === "light" ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                <span>Dark</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M9.75 12h4.5M3 12h2.25m13.5 0H21M5.757 6.543l1.591 1.591m8.889 8.89l1.591 1.591M5.757 17.457l1.591-1.591M16.243 7.757l1.591-1.591M12 7.5A4.5 4.5 0 1012 16.5 4.5 4.5 0 0012 7.5z" />
                </svg>
                <span>Light</span>
              </>
            )}
          </button>
          
          <button
            onClick={onLogout}
            className="text-xs transition-colors text-(--sidebar-muted) hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: "var(--bg)" }}>
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
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden mesh-bg">
        {/* Mobile topbar */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 shrink-0"
          style={{
            background: "var(--sidebar-bg)",
            borderBottom: "1px solid var(--sidebar-border)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-(--radius-sm)"
            style={{ color: "var(--sidebar-muted)" }}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center">
            <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--sidebar-fg)" }}>AssetFlow</span>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto" style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>

      {/* Notification Center Pop-up Modal */}
      {showNotifs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4 animate-fade-in">
          <div className="erp-card w-full max-w-md space-y-4 max-h-[85vh] flex flex-col bg-(--surface) border border-(--border)">
            <div className="flex justify-between items-center border-b border-(--border) pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-(--fg)">Notification Center</span>
                {unreadCount > 0 && (
                  <span className="badge badge-danger text-[10px]">{unreadCount} unread</span>
                )}
              </div>
              <button
                onClick={() => setShowNotifs(false)}
                className="text-xs text-(--muted) hover:text-(--foreground) font-semibold"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
              {notifications.length === 0 ? (
                <p className="text-xs text-center text-(--muted) py-8">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 border rounded-(--radius-sm) text-xs transition-colors ${
                      n.isRead 
                        ? "bg-(--background) border-(--border) opacity-60" 
                        : "bg-white/5 border-(--accent) font-medium"
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${
                        n.type === "Alert" 
                          ? "text-(--danger-text)" 
                          : n.type === "Warning" 
                          ? "text-(--warning-text)" 
                          : "text-(--success-text)"
                      }`}>{n.type}</span>
                      <span className="text-[10px] text-(--muted)">
                        {new Date(n.createdDate).toLocaleDateString()} {new Date(n.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-(--fg) leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>

            {unreadCount > 0 && (
              <div className="border-t border-(--border) pt-3">
                <button
                  onClick={handleMarkAllRead}
                  className="erp-btn-secondary w-full text-xs font-semibold"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
