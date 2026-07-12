"use client";

import { useState, useEffect } from "react";

/* Maps raw DB enum strings → human-readable sentence case labels */
const ACTION_LABELS: Record<string, string> = {
  RegisterAsset:       "Asset registered",
  UpdateAsset:         "Asset updated",
  DeleteAsset:         "Asset deleted",
  AllocateAsset:       "Asset allocated",
  ReturnAsset:         "Asset returned",
  TransferAsset:       "Asset transferred",
  CreateBooking:       "Booking created",
  CancelBooking:       "Booking cancelled",
  CreateMaintenance:   "Maintenance request raised",
  UpdateMaintenance:   "Maintenance status updated",
  CloseMaintenance:    "Maintenance closed",
  CreateAudit:         "Audit cycle started",
  UpdateAuditItem:     "Audit item checked",
  CloseAudit:          "Audit cycle closed",
  PromoteEmployee:     "Employee promoted",
  CreateDepartment:    "Department created",
  CreateCategory:      "Category created",
  Login:               "User signed in",
  Logout:              "User signed out",
};

function humanize(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  /* Fallback: split camelCase → "Asset allocated" */
  return action
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase()
    .replace(/^./, s => s.toUpperCase());
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ActivityLogs() {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/logs")
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        /* Stagger-in animation trigger */
        setTimeout(() => setVisible(true), 60);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>Activity log</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          Append-only audit trail of every action in the system.
        </p>
      </div>

      <div className="ui-card">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No activity recorded yet.</p>
        ) : (
          <div className="space-y-0">
            {logs.map((log, i) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
                style={{
                  borderColor: "var(--border-subtle)",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 280ms ease ${i * 30}ms, transform 280ms ease ${i * 30}ms`,
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                    {humanize(log.action)}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                    {log.details}
                    {log.employee?.name ? ` — ${log.employee.name}` : ""}
                  </p>
                </div>
                <span className="text-xs whitespace-nowrap flex-shrink-0 tabular-nums" style={{ color: "var(--muted)" }}>
                  {timeAgo(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
