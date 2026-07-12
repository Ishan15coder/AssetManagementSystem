"use client";

import { useState, useEffect } from "react";

interface AssetAuditProps {
  user: any;
}

export default function AssetAudit({ user }: AssetAuditProps) {
  const [cycles, setCycles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");

  // Create Cycle Form
  const [cycleName, setCycleName] = useState("");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [auditorId, setAuditorId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [resCycles, resEmployees] = await Promise.all([
        fetch("/api/audits"),
        fetch("/api/employees"),
      ]);
      const dataCycles = await resCycles.json();
      const dataEmployees = await resEmployees.json();

      setCycles(dataCycles.cycles || []);
      setEmployees(dataEmployees.employees || []);
      if (dataCycles.cycles?.length > 0 && !selectedCycleId) {
        setSelectedCycleId(String(dataCycles.cycles[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cycleName,
          startDate: new Date(startDateStr).toISOString(),
          endDate: new Date(endDateStr).toISOString(),
          auditorId: parseInt(auditorId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create cycle");

      setSuccess("Audit cycle created successfully");
      setCycleName("");
      setStartDateStr("");
      setEndDateStr("");
      setAuditorId("");
      setShowCreateForm(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckItem = async (itemId: number, status: "Verified" | "Missing" | "Damaged") => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/audits/${selectedCycleId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check item");

      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCloseCycle = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/${selectedCycleId}/close`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close cycle");

      setSuccess("Audit cycle closed. Discrepancies have been processed and assets updated.");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeCycle = cycles.find((c) => String(c.id) === selectedCycleId);
  const canManage = user.role === "AssetManager" || user.role === "Admin";
  const isAssignedAuditor = activeCycle ? activeCycle.auditorId === user.id : false;
  const canAudit = isAssignedAuditor || canManage;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Asset Audits</h1>
          <p className="text-xs text-[var(--muted)]">Initiate audit verification cycles, check off asset states, and lock discrepancy registers.</p>
        </div>
        {canManage && !showCreateForm && (
          <button onClick={() => setShowCreateForm(true)} className="erp-btn-primary text-xs">
            New Audit Cycle
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs font-medium border border-red-950/20 bg-red-950/10 text-[var(--danger-text)]">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-xs font-medium border border-emerald-950/20 bg-emerald-950/10 text-[var(--success-text)]">
          {success}
        </div>
      )}

      {/* Create Audit Form */}
      {showCreateForm && (
        <div className="erp-card space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Initialize Audit Cycle</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </button>
          </div>
          <form onSubmit={handleCreateCycle} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Cycle Name</label>
              <input
                type="text"
                required
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="erp-input"
                placeholder="e.g. Q3 IT Hardware Audit"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Start Date</label>
              <input
                type="date"
                required
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="erp-input text-xs"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">End Date</label>
              <input
                type="date"
                required
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="erp-input text-xs"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Assigned Auditor</label>
              <select
                required
                value={auditorId}
                onChange={(e) => setAuditorId(e.target.value)}
                className="erp-input"
              >
                <option value="">Choose Auditor</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 pt-2">
              <button type="submit" disabled={loading} className="erp-btn-primary">
                Launch Audit Cycle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Select active audit selector */}
      <div className="erp-card bg-[var(--surface)] p-4 flex flex-col md:flex-row items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Active Cycle:</span>
        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
          className="erp-input flex-1 md:max-w-xs"
        >
          <option value="">Select Audit Cycle</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.status})
            </option>
          ))}
        </select>
        {activeCycle && (
          <span className="text-xs text-[var(--muted)]">
            Auditor: <span className="text-[var(--foreground)] font-semibold">{activeCycle.auditor.name}</span> | Scope: <span className="text-[var(--foreground)] font-semibold">{activeCycle.items?.length || 0} assets</span>
          </span>
        )}
      </div>

      {activeCycle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main check-off checklist */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Verification Checklist</h2>
              {activeCycle.status === "Active" && canManage && (
                <button
                  onClick={handleCloseCycle}
                  disabled={loading}
                  className="erp-btn-secondary text-xs text-[var(--danger-text)] font-semibold border-red-950/20 hover:bg-red-950/10"
                >
                  Close & Lock Audit
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Asset Name</th>
                    <th>Serial Number</th>
                    <th>Verified Status</th>
                    {activeCycle.status === "Active" && canAudit && <th>Verify Check</th>}
                  </tr>
                </thead>
                <tbody>
                  {activeCycle.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="tech-code font-bold">{item.asset.tag}</td>
                      <td className="font-semibold">{item.asset.name}</td>
                      <td className="tech-code text-xs text-[var(--muted)]">{item.asset.serialNumber}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === "Verified"
                              ? "badge-success"
                              : item.status === "Pending"
                              ? "badge-warning"
                              : "badge-danger"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      {activeCycle.status === "Active" && canAudit && (
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleCheckItem(item.id, "Verified")}
                              className="text-[10px] px-2 py-0.5 border border-[var(--border)] hover:bg-[var(--background)] font-medium"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleCheckItem(item.id, "Missing")}
                              className="text-[10px] px-2 py-0.5 border border-red-950/20 text-[var(--danger-text)] hover:bg-red-950/15 font-medium"
                            >
                              Missing
                            </button>
                            <button
                              onClick={() => handleCheckItem(item.id, "Damaged")}
                              className="text-[10px] px-2 py-0.5 border border-amber-950/20 text-[var(--warning-text)] hover:bg-amber-950/15 font-medium"
                            >
                              Damage
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discrepancy stats card */}
          <div>
            <div className="erp-card space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider">Discrepancy Report</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--muted)]">Total Scoped Assets:</span>
                  <span className="font-semibold">{activeCycle.items?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--muted)]">Verified OK:</span>
                  <span className="font-semibold text-[var(--success-text)]">
                    {activeCycle.items?.filter((item: any) => item.status === "Verified").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--muted)]">Missing Assets:</span>
                  <span className="font-semibold text-[var(--danger-text)]">
                    {activeCycle.items?.filter((item: any) => item.status === "Missing").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--muted)]">Damaged Assets:</span>
                  <span className="font-semibold text-[var(--warning-text)]">
                    {activeCycle.items?.filter((item: any) => item.status === "Damaged").length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-[var(--border)] pt-2">
                  <span className="text-[var(--muted)]">Pending Verification:</span>
                  <span className="font-semibold">
                    {activeCycle.items?.filter((item: any) => item.status === "Pending").length || 0}
                  </span>
                </div>
              </div>

              {activeCycle.status === "Closed" && (
                <div className="p-3 mt-2 text-xs border border-red-950/20 bg-red-950/5 text-[var(--danger-text)]">
                  Discrepancy Report Locked. All confirmed missing items have automatically been transitioned to the Lost status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
