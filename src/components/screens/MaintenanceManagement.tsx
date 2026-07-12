"use client";

import { useState, useEffect } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface MaintenanceManagementProps {
  user: any;
}

export default function MaintenanceManagement({ user }: MaintenanceManagementProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
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

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadAssets();
    loadEmployees();
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
      <div className="flex-1 min-w-[260px] bg-(--surface) border border-(--border) flex flex-col h-[550px] rounded-(--radius-md) overflow-hidden">
        <div className="p-3 border-b border-(--border) bg-(--background) flex justify-between items-center">
          <span className="text-xs font-semibold text-(--muted)">{columnTitle}</span>
          <span className="tech-code text-[10px] px-2 py-0.5 border border-(--border) rounded-(--radius-sm)">{colRequests.length}</span>
        </div>
        <div className="p-3 flex-1 overflow-y-auto space-y-3">
          {colRequests.length === 0 ? (
            <div className="text-center py-8 text-xs text-(--muted)">No requests in this stage.</div>
          ) : (
            colRequests.map((req) => {
              const tech = employees.find(e => e.id === req.assignedTechnicianId);
              return (
                <div key={req.id} className="erp-card bg-(--background) border border-(--border) p-3 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="tech-code text-(--accent) font-bold">{req.asset.tag}</span>
                    <span className={`badge ${req.priority === "Critical" ? "badge-danger" : req.priority === "High" ? "badge-warning" : "badge-success"}`}>
                      {req.priority}
                    </span>
                  </div>
                  <div className="text-xs font-semibold">{req.asset.name}</div>
                  <p className="text-[11px] text-(--muted) leading-tight">{req.description}</p>
                  <div className="text-[10px] text-(--muted) space-y-0.5">
                    <div>Raised by: <span className="text-(--foreground) font-semibold">{req.employee.name}</span></div>
                    {req.assignedTechnicianId && (
                      <div>Technician: <span className="text-(--foreground) font-semibold">{tech ? tech.name : `ID: ${req.assignedTechnicianId}`}</span></div>
                    )}
                    <div>Status: <span className="font-semibold text-(--foreground)">{req.status}</span></div>
                  </div>

                  {/* Workflow actions for Managers/Admins */}
                  {canManage && (
                    <div className="pt-2 border-t border-(--border) flex flex-wrap gap-2">
                      {req.status === "Pending" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, "Approved")}
                            className="text-[10px] text-(--success-text) font-bold hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, "Rejected")}
                            className="text-[10px] text-(--danger-text) font-bold hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === "Approved" && (
                        <button
                          onClick={() => setActiveRequestForTech(req)}
                          className="text-[10px] text-(--accent) font-bold hover:underline"
                        >
                          Assign Technician
                        </button>
                      )}
                      {req.status === "Assigned" && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "InProgress")}
                          className="text-[10px] text-(--warning-text) font-bold hover:underline"
                        >
                          Start Repair Work
                        </button>
                      )}
                      {req.status === "InProgress" && (
                        <button
                          onClick={() => setActiveRequestForResolve(req)}
                          className="text-[10px] text-(--success-text) font-bold hover:underline"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
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
          <h1 className="text-3xl font-extrabold tracking-tight text-(--fg) mb-1">Maintenance Management</h1>
          <p className="text-base text-(--muted)">Route asset repairs, track technician workflows, and review resolution reports.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="erp-btn-primary text-xs">
            Raise Request
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 text-xs font-medium border border-red-950/20 bg-red-950/10 text-(--danger-text)">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-xs font-medium border border-emerald-950/20 bg-emerald-950/10 text-(--success-text)">
          {success}
        </div>
      )}

      {/* Raise Request Form Panel */}
      {showForm && (
        <div className="erp-card space-y-4">
          <div className="flex justify-between items-center border-b border-(--border) pb-2">
            <h3 className="text-sm font-semibold text-(--fg)">Raise Maintenance Request</h3>
            <button onClick={() => setShowForm(false)} className="text-xs text-(--muted) hover:text-(--foreground)">
              Cancel
            </button>
          </div>
          <form onSubmit={handleRaiseRequest} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Select Asset</label>
              <CustomSelect
                value={selectedAssetId}
                onChange={setSelectedAssetId}
                options={[
                  { value: "", label: "Select Asset" },
                  ...assets.map((a) => ({
                    value: String(a.id),
                    label: `${a.name} (${a.tag})`,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Priority Level</label>
              <CustomSelect
                value={priority}
                onChange={(val) => setPriority(val as any)}
                options={[
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "High", label: "High" },
                  { value: "Critical", label: "Critical" },
                ]}
              />
            </div>

            <div className="md:col-span-3 flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Problem Description</label>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-400 flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-(--fg)">Assign Technician</h3>
            <div className="flex flex-col space-y-3">
              <CustomSelect
                value={techId}
                onChange={setTechId}
                options={[
                  { value: "", label: "Choose Technician..." },
                  ...employees.map((emp) => ({
                    value: String(emp.id),
                    label: `${emp.name} (${emp.role})`,
                  })),
                ]}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (techId) {
                      handleUpdateStatus(activeRequestForTech.id, "Assigned", { assignedTechnicianId: techId });
                      setActiveRequestForTech(null);
                      setTechId("");
                    }
                  }}
                  className="erp-btn-primary text-xs"
                  disabled={!techId}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-400 flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4">
            <h3 className="text-sm font-semibold text-(--fg)">Submit Resolution Details</h3>
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
