import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line } from "recharts";

const COLORS: Record<string, string> = {
  Available: "var(--success-text)",
  Allocated: "var(--accent)",
  UnderMaintenance: "var(--warning-text)",
  Reserved: "var(--warning-text)",
  Retired: "var(--danger-text)",
  Lost: "var(--danger-text)",
  Disposed: "var(--danger-text)",
};

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
  const [statusData, setStatusData] = useState<any[]>([]);
  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [maintenanceTrend, setMaintenanceTrend] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [visible, setVisible]       = useState(false);

  // Scanner Simulator States
  const [showScanner, setShowScanner] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [scannedAsset, setScannedAsset] = useState<any | null>(null);
  const [scannerActionMsg, setScannerActionMsg] = useState("");
  const [scannerErrorMsg, setScannerErrorMsg] = useState("");
  const [scannerLoading, setScannerLoading] = useState(false);

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
        
        setStatusData(sc.map((s: any) => ({ name: s.status, value: Number(s._count?.id ?? s.count ?? 0) })).filter((s:any) => s.value > 0));
        setBookingTrend(rr.bookingTrend ?? []);
        setMaintenanceTrend(rr.maintenanceTrend ?? []);

        const now = new Date();
        const overdue: any[] = [];
        (ra.assets ?? []).forEach((asset: any) => {
          (asset.allocations ?? []).forEach((alloc: any) => {
            if (alloc.status === "Active" && alloc.expectedReturnDate) {
              // Ensure standard employees only see their own overdue items
              if (rr.isManager === false && String(alloc.employeeId) !== String(user.id)) return;
              
              const due = new Date(alloc.expectedReturnDate);
              if (due < now) overdue.push({ ...alloc, assetTag: asset.tag, assetName: asset.name, days: Math.round((now.getTime() - due.getTime()) / 86_400_000) });
            }
          });
        });

        if (rr.isManager === false) {
          setStats({
            available: 0,
            allocated: rr.myAllocations ?? 0,
            maintenance: rr.myMaintenance ?? 0,
            bookings: rr.myBookings ?? 0,
            overdue: overdue.length,
            maintenanceToday: 0,
            pendingTransfers: 0,
            upcomingReturns: 0
          });
        } else {
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
        }
        setOverdueItems(overdue);
        setRecentLogs((rl.logs ?? []).slice(0, 8));
        setAssets(ra.assets || []);
      } catch { /* silent */ } finally {
        setLoading(false);
        setTimeout(() => setVisible(true), 60);
      }
    };
    load();
  }, []);

  const handleQuickReturn = async (assetId: number) => {
    setScannerLoading(true);
    setScannerActionMsg("");
    setScannerErrorMsg("");
    try {
      const res = await fetch(`/api/allocations/${assetId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionOnCheckIn: "Good - returned via Scanner Simulator" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to return asset");
      
      setScannerActionMsg("Asset successfully returned! Status updated to Available.");
      setScannedAsset((prev: any) => prev ? { ...prev, status: "Available" } : null);
      
      // Refresh database stats
      const [rr, ra] = await Promise.all([
        fetch("/api/reports").then(r => r.json()),
        fetch("/api/assets").then(r => r.json())
      ]);
      setAssets(ra.assets || []);
      const sc = rr.statusCounts ?? [];
      const count = (status: string) => Number(sc.find((s: any) => s.status === status)?._count?.id ?? sc.find((s: any) => s.status === status)?.count ?? 0);
      setStatusData(sc.map((s: any) => ({ name: s.status, value: Number(s._count?.id ?? s.count ?? 0) })).filter((s:any) => s.value > 0));
      setStats((prev: any) => ({
        ...prev,
        available: count("Available"),
        allocated: count("Allocated"),
      }));
    } catch (err: any) {
      setScannerErrorMsg(err.message);
    } finally {
      setScannerLoading(false);
    }
  };

  const handleQuickMaintenance = async (assetId: number) => {
    setScannerLoading(true);
    setScannerActionMsg("");
    setScannerErrorMsg("");
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          description: "Reported via Scanner Simulator",
          priority: "Medium"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log maintenance request");
      
      setScannerActionMsg("Maintenance request logged successfully! Asset status is now Under Maintenance.");
      setScannedAsset((prev: any) => prev ? { ...prev, status: "UnderMaintenance" } : null);
      
      // Refresh database stats
      const [rr, ra] = await Promise.all([
        fetch("/api/reports").then(r => r.json()),
        fetch("/api/assets").then(r => r.json())
      ]);
      setAssets(ra.assets || []);
      const sc = rr.statusCounts ?? [];
      const count = (status: string) => Number(sc.find((s: any) => s.status === status)?._count?.id ?? sc.find((s: any) => s.status === status)?.count ?? 0);
      setStatusData(sc.map((s: any) => ({ name: s.status, value: Number(s._count?.id ?? s.count ?? 0) })).filter((s:any) => s.value > 0));
      setStats((prev: any) => ({
        ...prev,
        available: count("Available"),
        allocated: count("Allocated"),
        maintenance: count("UnderMaintenance"),
      }));
    } catch (err: any) {
      setScannerErrorMsg(err.message);
    } finally {
      setScannerLoading(false);
    }
  };

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

  const statItems = isManager ? [
    { label: "Available", value: stats.available, color: "var(--success-text)" },
    { label: "Allocated", value: stats.allocated, color: "var(--fg)" },
    { label: "Maintenance", value: stats.maintenance, color: "var(--warning-text)", trend: maintenanceTrend },
    { label: "Active bookings", value: stats.bookings, color: "var(--accent)", trend: bookingTrend },
    { label: "Pending Transfers", value: stats.pendingTransfers, color: "var(--warning)" },
    { label: "Upcoming Returns", value: stats.upcomingReturns, color: "var(--success)" },
    { label: "Overdue",     value: stats.overdue,          color: stats.overdue > 0 ? "var(--danger)" : "var(--fg)" },
  ] : [
    { label: "My Allocations", value: stats.allocated, color: "var(--fg)" },
    { label: "My Bookings", value: stats.bookings, color: "var(--fg)" },
    { label: "My Maintenance", value: stats.maintenance, color: "var(--warning)" },
    { label: "My Overdue Returns", value: stats.overdue, color: stats.overdue > 0 ? "var(--danger)" : "var(--fg)" },
  ];

  return (
    <div
      className="space-y-8"
    >
      {/* Heading */}
      <div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-(--fg)">Overview</h1>
        <p className="text-sm sm:text-base text-(--muted) mt-1">Real-time asset counts and recent activity.</p>
      </div>

      {/* Stats strip */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-px" style={{ background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {[...Array(isManager ? 7 : 4)].map((_, i) => (
            <div key={i} className="px-5 py-5 animate-pulse" style={{ background: "var(--surface)" }}>
              <div className="h-3 w-16 rounded-sm mb-3" style={{ background: "var(--surface-2)" }} />
              <div className="h-8 w-10 rounded-sm" style={{ background: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-px"
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
              
              <div className="flex items-end justify-between mt-2">
                <p
                  className="font-semibold tabular-nums text-2xl"
                  style={{ lineHeight: 1, color: s.color }}
                >
                  {s.value}
                </p>
                {/* Mini Sparkline */}
                {s.trend && s.trend.length > 0 && (
                  <div className="h-6 w-16 opacity-70">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={s.trend}>
                        <Line type="monotone" dataKey="count" stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={true} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
        {isManager && (
          <button onClick={() => setActiveScreen("assets")} className="erp-btn-primary w-full sm:w-auto">
            Register asset
          </button>
        )}
        <button onClick={() => { setShowScanner(true); setScannedAsset(null); setScannerActionMsg(""); setScannerErrorMsg(""); }} className="erp-btn-secondary text-(--accent) border-(--accent) w-full sm:w-auto flex items-center justify-center gap-1.5 font-bold">
          Scan QR Code
        </button>
        <button onClick={() => setActiveScreen("bookings")}    className="erp-btn-secondary w-full sm:w-auto">Book a resource</button>
        <button onClick={() => setActiveScreen("maintenance")} className="erp-btn-secondary w-full sm:w-auto">Raise maintenance ticket</button>
        {user.role === "Admin" && (
          <button onClick={() => setActiveScreen("org-setup")} className="erp-btn-secondary w-full sm:w-auto">Manage organization</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Overdue */}
        <div
          className={isManager ? "lg:col-span-3" : "lg:col-span-5"}
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
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 rounded-sm animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {overdueItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-3" style={{ background: "var(--surface-2)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--muted)" }}>
                        <path d="M5 12l5 5l10 -10"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>All clear</p>
                      <p className="text-xs text-(--muted) mt-0.5">No overdue return handovers registered in the system.</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="erp-table min-w-full">
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
                            <td className="font-semibold" style={{ color: "var(--fg)" }}>{item.assetName}</td>
                            <td style={{ color: "var(--fg)" }}>{item.employeeName ?? item.departmentName ?? "Unassigned"}</td>
                            <td><span className="badge badge-danger tabular-nums">{item.days}d</span></td>
                            <td className="text-right">
                              {isManager && (
                                <button
                                  onClick={() => setActiveScreen("allocations")}
                                  className="text-xs font-semibold text-(--accent) hover:underline"
                                >
                                  Resolve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        {isManager && (
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
                    <div key={i} className="h-10 rounded-sm animate-pulse" style={{ background: "var(--surface-2)" }} />
                  ))}
                </div>
              ) : (
                <div className="relative border-l border-(--border) ml-3 mt-4 space-y-6 pb-2">
                  {recentLogs.length === 0 ? (
                    <p className="text-sm pl-4" style={{ color: "var(--muted)" }}>No recent activity.</p>
                  ) : recentLogs.map((log, i) => (
                    <div key={i} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 0 4px var(--surface)" }}></div>
                      
                      <p className="text-sm" style={{ color: "var(--fg)" }}>
                        <span className="font-semibold text-(--accent)">{log.employeeName || log.action}</span>{" "}
                        <span style={{ color: "var(--muted)" }}>{log.employeeName ? log.action.toLowerCase() : ""}</span>{" "}
                        {log.details && (
                          <span className="font-medium" style={{ color: "var(--fg)" }}>{log.details}</span>
                        )}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Scanner Simulator Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-400 flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-(--border) pb-2">
              <h3 className="text-sm font-semibold text-(--fg)">Scan Asset QR Code</h3>
              <button
                onClick={() => {
                  setShowScanner(false);
                  setScannedAsset(null);
                  setScannerActionMsg("");
                  setScannerErrorMsg("");
                }}
                className="text-xs text-(--muted) hover:text-(--foreground)"
              >
                Close
              </button>
            </div>

            {/* Stylized Scanner Frame */}
            {!scannedAsset && (
              <div className="relative border border-(--border) h-48 bg-black rounded-sm flex flex-col items-center justify-center overflow-hidden">
                {/* Viewfinder brackets */}
                <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-emerald-500"></div>
                <div className="absolute top-4 right-4 h-4 w-4 border-t-2 border-r-2 border-emerald-500"></div>
                <div className="absolute bottom-4 left-4 h-4 w-4 border-b-2 border-l-2 border-emerald-500"></div>
                <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-emerald-500"></div>
                
                {/* Laser animation line */}
                <div className="absolute left-0 w-full h-0.5 bg-emerald-500/80 shadow-[0_0_8px_#10b981] animate-[pulse_1.5s_infinite]" style={{ top: '50%' }}></div>
                
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest animate-pulse">Waiting for scan target...</span>
              </div>
            )}

            {scannerErrorMsg && (
              <div className="p-3 text-xs font-semibold border border-red-950/20 bg-red-950/10 text-(--danger-text) rounded-sm">
                {scannerErrorMsg}
              </div>
            )}
            {scannerActionMsg && (
              <div className="p-3 text-xs font-semibold border border-emerald-950/20 bg-emerald-950/10 text-(--success-text) rounded-sm">
                {scannerActionMsg}
              </div>
            )}

            {!scannedAsset ? (
              <div className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Select Registered Asset to Simulate Scanning</label>
                  <select
                    onChange={(e) => {
                      const matched = assets.find((a) => String(a.id) === e.target.value);
                      if (matched) {
                        setScannedAsset(matched);
                        setScannerActionMsg("");
                        setScannerErrorMsg("");
                      }
                    }}
                    className="erp-input text-xs"
                    defaultValue=""
                  >
                    <option value="" disabled>Choose Asset...</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.tag}) - {a.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-(--border) p-3 bg-(--surface-2) rounded-sm space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Asset Name:</span>
                    <span className="font-bold text-(--fg)">{scannedAsset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Asset Tag:</span>
                    <span className="font-mono font-bold text-(--accent)">{scannedAsset.tag}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Location:</span>
                    <span className="font-semibold text-(--fg)">{scannedAsset.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Current Status:</span>
                    <span className={`badge ${scannedAsset.status === "Available" ? "badge-success" : scannedAsset.status === "UnderMaintenance" ? "badge-warning" : "badge-danger"}`}>
                      {scannedAsset.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-(--muted) uppercase tracking-wider block">Contextual Quick Actions</span>
                  
                  {scannedAsset.status === "Available" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowScanner(false);
                          setActiveScreen("assets");
                        }}
                        className="erp-btn-primary text-xs"
                      >
                        Allocate Asset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowScanner(false);
                          setActiveScreen("bookings");
                        }}
                        className="erp-btn-secondary text-xs"
                      >
                        Book Time Slot
                      </button>
                    </div>
                  )}

                  {scannedAsset.status === "Allocated" && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickReturn(scannedAsset.id)}
                        disabled={scannerLoading}
                        className="erp-btn-primary text-xs"
                      >
                        {scannerLoading ? "Processing..." : "Quick Return (Check-in)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowScanner(false);
                          setActiveScreen("assets");
                        }}
                        className="erp-btn-secondary text-xs"
                      >
                        Request Transfer
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleQuickMaintenance(scannedAsset.id)}
                    disabled={scannerLoading || scannedAsset.status === "UnderMaintenance"}
                    className="erp-btn-secondary text-xs w-full text-(--warning-text) border-(--warning-text)"
                  >
                    {scannerLoading ? "Processing..." : scannedAsset.status === "UnderMaintenance" ? "Under Maintenance" : "Raise Repair / Maintenance Ticket"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setScannedAsset(null)}
                  className="w-full text-xs font-semibold text-(--muted) hover:text-(--fg) py-1 underline block text-center"
                >
                  Scan Another Asset
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
