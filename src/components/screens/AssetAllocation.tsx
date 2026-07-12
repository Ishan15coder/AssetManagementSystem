"use client";

import { useState, useEffect } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface AssetAllocationProps {
  user: any;
}

export default function AssetAllocation({ user }: AssetAllocationProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeAllocations, setActiveAllocations] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);

  // Allocation Form
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assigneeType, setAssigneeType] = useState<"employee" | "department">("employee");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  // Transfer Form (triggered on conflict)
  const [conflictAlloc, setConflictAlloc] = useState<any | null>(null);
  const [transferReason, setTransferReason] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");

  // Return Form
  const [selectedAllocForReturn, setSelectedAllocForReturn] = useState<any | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [resAssets, resEmployees, resDepts, resTransfers] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/employees"),
        fetch("/api/departments"),
        fetch("/api/transfers"),
      ]);

      const dataAssets = await resAssets.json();
      const dataEmployees = await resEmployees.json();
      const dataDepts = await resDepts.json();
      const dataTransfers = await resTransfers.json();

      setAssets(dataAssets.assets || []);
      setEmployees(dataEmployees.employees || []);
      setDepartments(dataDepts.departments || []);
      setTransfers(dataTransfers.transfers || []);

      // Filter active allocations from assets list based on RBAC
      const active: any[] = [];
      (dataAssets.assets || []).forEach((asset: any) => {
        if (asset.status === "Allocated" && asset.allocations) {
          const activeAlloc = asset.allocations.find((a: any) => a.status === "Active");
          if (activeAlloc) {
            let shouldInclude = false;
            if (user.role === "Admin" || user.role === "AssetManager") {
              shouldInclude = true;
            } else if (user.role === "DeptHead") {
              // DeptHead sees allocations for their own department OR employees in their department
              if (activeAlloc.departmentId === user.departmentId) {
                shouldInclude = true;
              } else if (activeAlloc.employeeId) {
                const emp = (dataEmployees.employees || []).find((e: any) => e.id === activeAlloc.employeeId);
                if (emp && emp.departmentId === user.departmentId) {
                  shouldInclude = true;
                }
              }
            } else {
              // Standard Employee sees only their own allocations
              if (activeAlloc.employeeId === user.id) {
                shouldInclude = true;
              }
            }

            if (shouldInclude) {
              active.push({
                ...activeAlloc,
                assetTag: asset.tag,
                assetName: asset.name,
                assetId: asset.id,
              });
            }
          }
        }
      });
      setActiveAllocations(active);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setConflictAlloc(null);
    setLoading(true);

    const assetIdNum = parseInt(selectedAssetId);
    const asset = assets.find((a) => a.id === assetIdNum);

    // Conflict Guard check on client-side
    if (asset && asset.status !== "Available") {
      const activeAlloc = activeAllocations.find((a) => a.assetId === assetIdNum);
      if (activeAlloc) {
        setConflictAlloc(activeAlloc);
        setError(`Conflict Blocked: Asset ${asset.tag} is currently held by ${activeAlloc.employee?.name || activeAlloc.department?.name}.`);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: assetIdNum,
          employeeId: assigneeType === "employee" && targetEmployeeId ? parseInt(targetEmployeeId) : null,
          departmentId: assigneeType === "department" && targetDepartmentId ? parseInt(targetDepartmentId) : null,
          expectedReturnDate: expectedReturnDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to allocate asset");

      setSuccess("Asset allocated successfully");
      setSelectedAssetId("");
      setTargetEmployeeId("");
      setTargetDepartmentId("");
      setExpectedReturnDate("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          assetId: conflictAlloc.assetId,
          toEmployeeId: parseInt(transferTargetId),
          reason: transferReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to raise transfer");

      setSuccess("Transfer request raised successfully");
      setConflictAlloc(null);
      setTransferReason("");
      setTransferTargetId("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/allocations/${selectedAllocForReturn.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditionOnCheckIn: checkInNotes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to return asset");

      setSuccess("Asset returned successfully to Available status");
      setSelectedAllocForReturn(null);
      setCheckInNotes("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessTransfer = async (transferId: number, action: "approve" | "reject") => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id: transferId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process transfer");

      setSuccess(`Transfer request ${action}d successfully`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canManage = user.role === "AssetManager" || user.role === "Admin" || user.role === "DeptHead";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--fg) mb-1">Asset Allocation & Transfers</h1>
        <p className="text-base text-(--muted)">Manage handovers, process return check-ins, and approve transfers between personnel.</p>
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

      {/* Allocation Conflict Shield / Transfer Trigger Form */}
      {conflictAlloc && (
        <div className="erp-card border-(--danger-text) bg-red-950/5 space-y-4">
          <h3 className="text-sm font-semibold text-(--danger-text)">Double Allocation Shield Triggered</h3>
          <p className="text-xs text-(--muted)">
            Asset <span className="font-semibold text-(--foreground)">{conflictAlloc.assetTag}</span> cannot be allocated directly. It is currently held by <span className="font-semibold text-(--foreground)">{conflictAlloc.employee?.name || conflictAlloc.department?.name}</span>. 
            You can submit a **Transfer Request** to routing approvals instead.
          </p>
          <form onSubmit={handleRaiseTransfer} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <CustomSelect
                value={transferTargetId}
                onChange={setTransferTargetId}
                options={[
                  { value: "", label: "Select Target Employee" },
                  ...employees.map((emp) => ({
                    value: String(emp.id),
                    label: emp.name,
                  })),
                ]}
              />
            </div>
            <input
              type="text"
              required
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              className="erp-input flex-2"
              placeholder="Provide reason for transfer request..."
            />
            <div className="flex gap-2">
              <button type="submit" className="erp-btn-primary text-xs">
                Submit Request
              </button>
              <button type="button" onClick={() => setConflictAlloc(null)} className="erp-btn-secondary text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Handover Forms and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active Handouts List */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-(--muted)">Active Handovers</h2>
            <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
              <table className="erp-table min-w-[650px] w-full">
                <thead>
                  <tr>
                    <th>Tag</th>
                    <th>Asset Name</th>
                    <th>Held By</th>
                    <th>Return Target</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAllocations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-xs text-(--muted)">
                        No active asset handovers.
                      </td>
                    </tr>
                  ) : (
                    activeAllocations.map((alloc) => (
                      <tr key={alloc.id}>
                        <td className="tech-code font-bold">{alloc.assetTag}</td>
                        <td className="font-semibold">{alloc.assetName}</td>
                        <td className="text-xs">
                          {alloc.employee ? alloc.employee.name : `Dept: ${alloc.department?.name}`}
                        </td>
                        <td className="text-xs tech-code">
                          {alloc.expectedReturnDate
                            ? new Date(alloc.expectedReturnDate).toLocaleDateString()
                            : "Indefinite"}
                        </td>
                        <td>
                          {canManage && (
                            <button
                              onClick={() => setSelectedAllocForReturn(alloc)}
                              className="text-xs text-(--muted) hover:text-(--foreground) underline font-semibold"
                            >
                              Check-In Return
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer Requests approvals list (visible to Managers/Admins) */}
          {canManage && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-(--muted)">Pending Transfer Requests</h2>
              <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
                <table className="erp-table min-w-[750px] w-full">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>From Holder</th>
                      <th>To Target</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.filter((t) => t.status === "Pending").length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-xs text-(--muted)">
                          No pending transfer requests.
                        </td>
                      </tr>
                    ) : (
                      transfers
                        .filter((t) => t.status === "Pending")
                        .map((t) => (
                          <tr key={t.id}>
                            <td className="font-semibold">{t.asset.name}</td>
                            <td className="text-xs">{t.fromEmployee.name}</td>
                            <td className="text-xs">{t.toEmployee.name}</td>
                            <td className="text-xs text-(--muted)">{t.reason}</td>
                            <td>
                              <span className="badge badge-warning">Pending</span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleProcessTransfer(t.id, "approve")}
                                  className="text-xs text-(--success-text) font-bold hover:underline"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleProcessTransfer(t.id, "reject")}
                                  className="text-xs text-(--danger-text) font-bold hover:underline"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Action Form Column */}
        <div className="space-y-6">
          {/* New Handover Card */}
          {canManage && (
            <div className="erp-card space-y-4">
              <h3 className="text-sm font-semibold text-(--fg)">Allocate Asset</h3>
              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Select Asset</label>
                  <CustomSelect
                    value={selectedAssetId}
                    onChange={setSelectedAssetId}
                    options={[
                      { value: "", label: "Choose Asset" },
                      ...assets
                        .filter((a) => a.status === "Available")
                        .map((a) => ({
                          value: String(a.id),
                          label: `${a.name} (${a.tag})`,
                        })),
                    ]}
                  />
                </div>

                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-xs font-medium">
                    <input
                      type="radio"
                      checked={assigneeType === "employee"}
                      onChange={() => setAssigneeType("employee")}
                      className="accent-white"
                    />
                    <span>Employee</span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs font-medium">
                    <input
                      type="radio"
                      checked={assigneeType === "department"}
                      onChange={() => setAssigneeType("department")}
                      className="accent-white"
                    />
                    <span>Department</span>
                  </label>
                </div>

                {assigneeType === "employee" ? (
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-(--muted)">Target Employee</label>
                    <CustomSelect
                      value={targetEmployeeId}
                      onChange={setTargetEmployeeId}
                      options={[
                        { value: "", label: "Select Employee" },
                        ...employees.map((emp) => ({
                          value: String(emp.id),
                          label: emp.name,
                        })),
                      ]}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-semibold text-(--muted)">Target Department</label>
                    <CustomSelect
                      value={targetDepartmentId}
                      onChange={setTargetDepartmentId}
                      options={[
                        { value: "", label: "Select Department" },
                        ...departments.map((dept) => ({
                          value: String(dept.id),
                          label: dept.name,
                        })),
                      ]}
                    />
                  </div>
                )}

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Expected Return Date</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>

                <button type="submit" disabled={loading} className="erp-btn-primary w-full">
                  Create Handover
                </button>
              </form>
            </div>
          )}

          {/* Return check-in modal card */}
          {selectedAllocForReturn && (
            <div className="erp-card border-(--accent) space-y-4">
              <div className="flex justify-between items-center border-b border-(--border) pb-2">
                <h3 className="text-sm font-semibold text-(--fg)">Asset Check-In Return</h3>
                <button
                  type="button"
                  onClick={() => setSelectedAllocForReturn(null)}
                  className="text-xs text-(--muted) hover:text-(--foreground)"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={handleReturnAsset} className="space-y-4">
                <p className="text-xs text-(--muted)">
                  Asset check-in for <span className="font-semibold text-(--foreground)">{selectedAllocForReturn.assetName} ({selectedAllocForReturn.assetTag})</span>.
                </p>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Check-in condition notes</label>
                  <textarea
                    required
                    value={checkInNotes}
                    onChange={(e) => setCheckInNotes(e.target.value)}
                    className="erp-input h-20 resize-none text-xs"
                    placeholder="Describe returned asset condition (e.g. Excellent, screen clean, no issues)..."
                  />
                </div>
                <button type="submit" disabled={loading} className="erp-btn-primary w-full">
                  Submit Return Check-In
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
