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

import { Pagination } from "@/components/ui/Pagination";
import { Download } from "lucide-react";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const fetchLogs = (page: number = 1) => {
    setLoading(true);
    fetch(`/api/logs?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        if (d.meta) setMeta(d.meta);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setVisible(true);
      });
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const exportCSV = () => {
    const headers = ["Timestamp", "Action", "Employee", "Details"];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      humanize(l.action),
      l.employee?.name || "System",
      l.details,
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_page_${meta.page}.csv`;
    link.click();
  };

  const DiffViewer = ({ detailsStr }: { detailsStr: string }) => {
    try {
      // Try to parse as JSON diff { before: {}, after: {} }
      const data = JSON.parse(detailsStr);
      if (data.before && data.after) {
        return (
          <div className="mt-2 space-y-1 bg-black/10 p-2 rounded-md border border-white/5 text-[11px] font-mono">
            {Object.keys(data.after).map((key) => {
              const oldVal = data.before[key];
              const newVal = data.after[key];
              if (oldVal === newVal) return null;
              return (
                <div key={key} className="flex items-start gap-3">
                  <span className="text-(--muted) w-20 shrink-0">{key}:</span>
                  {oldVal !== undefined && (
                    <span className="text-(--danger-text) line-through mr-2 break-all">{String(oldVal)}</span>
                  )}
                  <span className="text-(--success-text) break-all">{String(newVal)}</span>
                </div>
              );
            })}
          </div>
        );
      }
    } catch {
      // Not JSON, just normal string
    }
    return <span className="block mt-0.5">{detailsStr}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-(--fg)">Activity log</h1>
          <p className="text-base text-(--muted) mt-1">
            Append-only audit trail of every action in the system.
          </p>
        </div>
        <button onClick={exportCSV} className="erp-btn-secondary text-xs flex items-center gap-2">
          <Download size={14} /> Export Page
        </button>
      </div>

      <div className="ui-card flex flex-col p-0">
        <div className="flex-1 p-5 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-sm animate-pulse" style={{ background: "var(--surface-2)" }} />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No activity recorded yet.</p>
          ) : (
            <div className="space-y-0">
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-4 py-4 border-b last:border-0"
                  style={{
                    borderColor: "var(--border-subtle)",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity 280ms ease ${i * 30}ms, transform 280ms ease ${i * 30}ms`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                        {humanize(log.action)}
                      </p>
                      {log.employee?.name && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-(--accent) text-white font-medium">
                          {log.employee.name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-(--muted) mt-1">
                      <DiffViewer detailsStr={log.details} />
                    </div>
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap shrink-0 tabular-nums text-(--muted) mt-1">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Pagination Footer */}
        {!loading && meta.totalPages > 1 && (
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            itemsPerPage={meta.limit}
            totalItems={meta.total}
            onPageChange={(p) => fetchLogs(p)}
          />
        )}
      </div>
    </div>
  );
}
