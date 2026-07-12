"use client";

import { useState, useEffect } from "react";

interface MaintenanceManagementProps {
  user: any;
}

export default function MaintenanceManagement({ user }: MaintenanceManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  
  // New Request Form
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [showForm, setShowForm] = useState(false);

  // Assign Technician / Resolution details
  const [activeRequestForTech, setActiveRequestForTech] = useState<any | null>(null);
  const [techId, setTechId] = useState("");
  const [activeRequestForResolve, setActiveRequestForResolve] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/maintenance");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadAssets();
  }, []);

  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: parseInt(selectedAssetId),
          description,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to raise maintenance request");

      setSuccess("Maintenance request raised successfully");
      setSelectedAssetId("");
      setDescription("");
      setPriority("Medium");
      setShowForm(false);
      loadRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: number, status: string, additionalPayload: object = {}) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/maintenance/${requestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...additionalPayload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setSuccess(`Request status updated to: ${status}`);
      loadRequests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canManage = user.role === "AssetManager" || user.role === "Admin";

  const renderKanbanColumn = (columnTitle: string, statusKeys: string[]) => {
    const colRequests = requests.filter((r) => statusKeys.includes(r.status));
    return (
      <div className="flex-1 min-w-[260px] bg-[var(--surface)] border border-[var(--border)] flex flex-col h-[550px]">
        <div className="p-3 border-b border-[var(--border)] bg-[var(--background)] flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{columnTitle}</span>
          <span className="tech-code text-[10px] px-2 py-0.5 border border-[var(--border)]">{colRequests.length}</span>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-3">
          {colRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-[var(--muted)]">No requests in this stage.</div>
          ) : (
            colRequests.map((req) => (
              <div key={req.id} className="erp-card bg-[var(--background)] border border-[var(--border)] p-3 space-y-3">
                <div className="flex justify-between items-start">
                  <span className="tech-code text-[var(--accent)] font-bold">{req.asset.tag}</span>
                  <span className={`badge ${req.priority === "Critical" ? "badge-danger" : req.priority === "High" ? "badge-warning" : "badge-success"}`}>
                    {req.priority}
                  </span>
                </div>
                <div className="text-xs font-semibold">{req.asset.name}</div>
                <p className="text-[11px] text-[var(--muted)] leading-tight">{req.description}</p>
                <div className="text-[10px] text-[var(--muted)]">
                  Raised by: {req.employee.name} | Status: <span className="font-semibold text-[var(--foreground)]">{req.status}</span>
                </div>

                {/* Workflow actions for Managers/Admins */}
                {canManage && (
                  <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-2">
                    {req.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, "Approved")}
                          className="text-[10px] text-[var(--success-text)] font-bold hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, "Rejected")}
                          className="text-[10px] text-[var(--danger-text)] font-bold hover:underline"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {req.status === "Approved" && (
                      <button
                        onClick={() => setActiveRequestForTech(req)}
                        className="text-[10px] text-[var(--accent)] font-bold hover:underline"
                      >
                        Assign Technician
                      </button>
                    )}
                    {req.status === "Assigned" && (
                      <button
                        onClick={() => handleUpdateStatus(req.id, "InProgress")}
                        className="text-[10px] text-[var(--warning-text)] font-bold hover:underline"
                      >
                        Start Repair Work
                      </button>
                    )}
                    {req.status === "InProgress" && (
                      <button
                        onClick={() => setActiveRequestForResolve(req)}
                        className="text-[10px] text-[var(--success-text)] font-bold hover:underline"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Maintenance Management</h1>
          <p className="text-xs text-[var(--muted)]">Route asset repairs, track technician workflows, and review resolution reports.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="erp-btn-primary text-xs">
            Raise Request
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

      {/* Raise Request Form Panel */}
      {showForm && (
        <div className="erp-card space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Raise Maintenance Request</h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </button>
          </div>
          <form onSubmit={handleRaiseRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Select Asset</label>
              <select
                required
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="erp-input"
              >
                <option value="">Select Asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.tag})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="erp-input"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Problem Description</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="erp-input h-20 resize-none"
                placeholder="Please explain the breakdown details (e.g. screen blank, engine noise)..."
              />
            </div>

            <div className="md:col-span-3">
              <button type="submit" disabled={loading} className="erp-btn-primary">
                Submit Repair Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Layout Columns Container */}
      <div className="flex flex-col xl:flex-row gap-4 overflow-x-auto pb-4">
        {renderKanbanColumn("Pending Review", ["Pending", "Rejected"])}
        {renderKanbanColumn("Approved / Assigned", ["Approved", "Assigned"])}
        {renderKanbanColumn("Repair In Progress", ["InProgress"])}
        {renderKanbanColumn("Resolved", ["Resolved"])}
      </div>

      {/* Assign Tech Pop-up Overlay Card */}
      {activeRequestForTech && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider">Assign Technician</h3>
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                required
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="erp-input text-xs"
                placeholder="Enter Technician / Agent Name..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(activeRequestForTech.id, "Assigned", { assignedTechnicianId: 99 }); // simulated ID
                    setActiveRequestForTech(null);
                    setTechId("");
                  }}
                  className="erp-btn-primary text-xs"
                >
                  Confirm Assignment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequestForTech(null);
                    setTechId("");
                  }}
                  className="erp-btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolution Notes Pop-up Overlay Card */}
      {activeRequestForResolve && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider">Submit Resolution Details</h3>
            <div className="flex flex-col space-y-3">
              <textarea
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="erp-input h-20 resize-none text-xs"
                placeholder="Explain resolution (e.g. bulb replaced, tested successfully)..."
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(activeRequestForResolve.id, "Resolved", { resolutionNotes });
                    setActiveRequestForResolve(null);
                    setResolutionNotes("");
                  }}
                  className="erp-btn-primary text-xs"
                >
                  Submit & Resolve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRequestForResolve(null);
                    setResolutionNotes("");
                  }}
                  className="erp-btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
