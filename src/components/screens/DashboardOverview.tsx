"use client";

import { useState, useEffect } from "react";

interface DashboardOverviewProps {
  user: any;
  setActiveScreen: (screen: string) => void;
}

export default function DashboardOverview({ user, setActiveScreen }: DashboardOverviewProps) {
  const [stats, setStats]           = useState({ 
    available: 0, 
    allocated: 0, 
    maintenance: 0, 
    bookings: 0, 
    overdue: 0,
    maintenanceToday: 0,
    pendingTransfers: 0,
    upcomingReturns: 0
  });
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visible, setVisible]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [rr, ra, rl] = await Promise.all([
          fetch("/api/reports").then(r => r.json()),
          fetch("/api/assets").then(r => r.json()),
          fetch("/api/logs").then(r => r.json()),
        ]);

        const sc = rr.statusCounts ?? [];
        const count = (status: string) => Number(sc.find((s: any) => s.status === status)?._count?.id ?? sc.find((s: any) => s.status === status)?.count ?? 0);

        const now = new Date();
        const overdue: any[] = [];
        (ra.assets ?? []).forEach((asset: any) => {
          (asset.allocations ?? []).forEach((alloc: any) => {
            if (alloc.status === "Active" && alloc.expectedReturnDate) {
              const due = new Date(alloc.expectedReturnDate);
              if (due < now) overdue.push({ ...alloc, assetTag: asset.tag, assetName: asset.name, days: Math.round((now.getTime() - due.getTime()) / 86_400_000) });
            }
          });
        });

        setStats({
          available:   count("Available"),
          allocated:   count("Allocated"),
          maintenance: count("UnderMaintenance"),
          bookings:    (rr.resourceBookings ?? []).reduce((a: number, b: any) => a + Number(b.count ?? 0), 0),
          overdue:     overdue.length,
          maintenanceToday: rr.maintenanceToday ?? 0,
          pendingTransfers: rr.pendingTransfers ?? 0,
          upcomingReturns: rr.upcomingReturns ?? 0,
        });
        setOverdueItems(overdue);
        setRecentLogs((rl.logs ?? []).slice(0, 8));
      } catch { /* silent */ } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    };
    load();
  }, []);

  const humanizeAction = (a: string) =>
    a.replace(/([A-Z])/g, " $1").trim().toLowerCase().replace(/^./, s => s.toUpperCase());

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  const isManager = user.role === "Admin" || user.role === "AssetManager";

  const statItems = [
    { label: "Available",   value: stats.available,        color: "var(--success)" },
    { label: "Allocated",   value: stats.allocated,        color: "var(--fg)" },
    { label: "Active Bookings", value: stats.bookings,     color: "var(--fg)" },
    { label: "Maint. Today", value: stats.maintenanceToday, color: "var(--warning)" },
    { label: "Pending Transfers", value: stats.pendingTransfers, color: "var(--warning)" },
    { label: "Upcoming Returns", value: stats.upcomingReturns, color: "var(--success)" },
    { label: "Overdue",     value: stats.overdue,          color: stats.overdue > 0 ? "var(--danger)" : "var(--fg)" },
  ];

  return (
    <div
      className="space-y-8"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 320ms ease, transform 320ms ease",
      }}
    >
      {/* Heading */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>Overview</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Real-time asset counts and recent activity.</p>
      </div>

      {/* Stats strip */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-px" style={{ background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {[...Array(7)].map((_, i) => (
            <div key={i} className="px-5 py-5 animate-pulse" style={{ background: "var(--surface)" }}>
              <div className="h-3 w-16 rounded-(--radius-sm) mb-3" style={{ background: "var(--surface-2)" }} />
              <div className="h-8 w-10 rounded-(--radius-sm)" style={{ background: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-px"
          style={{ background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}
        >
          {statItems.map((s, i) => (
            <div
              key={s.label}
              className="px-5 py-5"
              style={{
                background: "var(--surface)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: `opacity 300ms ease ${80 + i * 60}ms, transform 300ms ease ${80 + i * 60}ms`,
              }}
            >
              <p className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">{s.label}</p>
              <p
                className="mt-2 font-semibold tabular-nums text-2xl"
                style={{ lineHeight: 1, color: s.color }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {isManager && (
          <button onClick={() => setActiveScreen("assets")} className="erp-btn-primary">
            Register asset
          </button>
        )}
        <button onClick={() => setActiveScreen("bookings")}    className="erp-btn-secondary">Book a resource</button>
        <button onClick={() => setActiveScreen("maintenance")} className="erp-btn-secondary">Raise maintenance ticket</button>
        {user.role === "Admin" && (
          <button onClick={() => setActiveScreen("org-setup")} className="erp-btn-secondary">Manage organization</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Overdue */}
        <div
          className="lg:col-span-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 340ms ease 200ms, transform 340ms ease 200ms",
          }}
        >
          <div className="ui-card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Overdue returns</h2>
              {overdueItems.length > 0 && (
                <span className="badge badge-danger">{overdueItems.length} overdue</span>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded-(--radius-sm) animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            ) : overdueItems.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>No overdue assets — all clear.</p>
            ) : (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Asset</th>
                    <th>Held by</th>
                    <th>Overdue</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {overdueItems.map((item, i) => (
                    <tr key={i}>
                      <td><span className="tech-code font-medium" style={{ color: "var(--accent)" }}>{item.assetTag}</span></td>
                      <td className="font-medium" style={{ color: "var(--fg)" }}>{item.assetName}</td>
                      <td style={{ color: "var(--muted)" }}>{item.employee?.name ?? "—"}</td>
                      <td><span className="badge badge-danger">{item.days}d</span></td>
                      <td>
                        <button
                          onClick={() => setActiveScreen("allocations")}
                          className="text-xs font-medium underline-offset-2 hover:underline transition-colors"
                          style={{ color: "var(--fg)" }}
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div
          className="lg:col-span-2"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 340ms ease 280ms, transform 340ms ease 280ms",
          }}
        >
          <div className="ui-card h-full">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>Recent activity</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-(--radius-sm) animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {recentLogs.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No recent activity.</p>
                ) : recentLogs.map((log, i) => (
                  <div
                    key={log.id}
                    className="py-2.5 border-b last:border-0"
                    style={{
                      borderColor: "var(--border-subtle)",
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(6px)",
                      transition: `opacity 260ms ease ${320 + i * 35}ms, transform 260ms ease ${320 + i * 35}ms`,
                    }}
                  >
                    <div className="flex justify-between gap-3 items-baseline">
                      <p className="text-sm font-medium leading-snug" style={{ color: "var(--fg)" }}>
                        {humanizeAction(log.action)}
                      </p>
                      <span className="text-xs shrink-0 tabular-nums" style={{ color: "var(--muted)" }}>
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>{log.details}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
