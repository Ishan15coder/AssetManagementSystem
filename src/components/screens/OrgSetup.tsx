"use client";

import { useState, useEffect } from "react";

interface OrgSetupProps {
  user: any;
}

export default function OrgSetup({ user }: OrgSetupProps) {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");
  
  // Lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form values
  const [deptName, setDeptName] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  
  const [catName, setCatName] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [resDepts, resEmployees] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees"),
      ]);
      const dataDepts = await resDepts.json();
      const dataEmployees = await resEmployees.json();
      
      setDepartments(dataDepts.departments || []);
      setEmployees(dataEmployees.employees || []);

      // Simulating loading categories from standard data endpoint (we can also map from /api/assets if categories are returned)
      const resAssets = await fetch("/api/assets");
      const dataAssets = await resAssets.json();
      // Extract unique categories from assets or fall back to defaults
      const uniqueCats = Array.from(
        new Set(
          (dataAssets.assets || []).map((a: any) => JSON.stringify(a.category))
        )
      )
        .map((s: any) => JSON.parse(s))
        .filter(Boolean);
      
      if (uniqueCats.length > 0) {
        setCategories(uniqueCats);
      } else {
        setCategories([
          { id: 1, name: "Electronics" },
          { id: 2, name: "Furniture" },
          { id: 3, name: "Vehicles" },
          { id: 4, name: "Office Space" },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deptName,
          headId: deptHeadId ? parseInt(deptHeadId) : null,
          parentId: deptParentId ? parseInt(deptParentId) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create department");

      setSuccess(`Department "${deptName}" created successfully`);
      setDeptName("");
      setDeptHeadId("");
      setDeptParentId("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteRole = async (employeeId: number, role: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/employees/${employeeId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Promotion failed");

      setSuccess("Employee role updated successfully");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user.role !== "Admin") {
    return (
      <div className="ui-card text-center p-8" style={{ borderColor: "var(--danger)", background: "var(--danger-bg)" }}>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--danger)" }}>Access restricted</h2>
        <p className="text-sm text-[var(--muted)]">
          Only admins can access and modify organization settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header section */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--fg)]">Organization</h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">Manage departments, asset categories, and employee roles.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-1">
        {([
          { id: "departments", label: "Departments" },
          { id: "categories",  label: "Categories"  },
          { id: "employees",   label: "Employees"   },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(""); setSuccess(""); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors duration-[var(--duration-fast)] ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--fg)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-[var(--radius-sm)] text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-3.5 py-2.5 rounded-[var(--radius-sm)] text-sm" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
          {success}
        </div>
      )}

      {/* Tab A: Departments */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--fg)]">Registered departments</h2>
            <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department Head</th>
                    <th>Parent Scope</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-xs text-[var(--muted)]">
                        No departments registered.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="font-semibold">{dept.name}</td>
                        <td className="text-xs">{dept.head?.name || "Unassigned"}</td>
                        <td className="text-xs text-[var(--muted)]">{dept.parent?.name || "None"}</td>
                        <td>
                          <span className="badge badge-success">Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="ui-card space-y-4">
              <h3 className="text-sm font-semibold text-[var(--fg)]">Create department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-3.5">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg)]">Name</label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="erp-input"
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg)]">Department head</label>
                  <select
                    value={deptHeadId}
                    onChange={(e) => setDeptHeadId(e.target.value)}
                    className="erp-input"
                  >
                    <option value="">Select Head (Optional)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-[var(--fg)]">Parent department</label>
                  <select
                    value={deptParentId}
                    onChange={(e) => setDeptParentId(e.target.value)}
                    className="erp-input"
                  >
                    <option value="">Select Parent (Optional)</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" disabled={loading} className="erp-btn-primary w-full">
                  Create
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab B: Categories */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--fg)]">Asset categories</h2>
            <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Category ID</th>
                    <th>Name</th>
                    <th>Template Type</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="tech-code text-[var(--muted)]">CAT-{String(cat.id).padStart(2, "0")}</td>
                      <td className="font-semibold">{cat.name}</td>
                      <td className="text-xs text-[var(--muted)]">
                        {cat.customFields ? "Custom Fields Defined" : "Standard Schema"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="ui-card space-y-4">
              <h3 className="text-sm font-semibold text-[var(--fg)]">Add category</h3>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="erp-input"
                  placeholder="e.g. Infrastructure"
                />
                <button
                  onClick={() => {
                    if (catName.trim()) {
                      setCategories([...categories, { id: categories.length + 1, name: catName }]);
                      setSuccess(`Category "${catName}" added (Visual preview)`);
                      setCatName("");
                    }
                  }}
                  className="erp-btn-primary w-full"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab C: Employees */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--fg)]">Employee directory</h2>
          <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>Modify Role (Admin action)</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-semibold">{emp.name}</td>
                    <td className="tech-code">{emp.email}</td>
                    <td className="text-xs">{emp.department?.name || "Unassigned"}</td>
                    <td>
                      <span className={`badge ${emp.role === "Admin" ? "badge-danger" : emp.role === "AssetManager" ? "badge-warning" : "badge-success"}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td>
                      <select
                        value={emp.role}
                        onChange={(e) => handlePromoteRole(emp.id, e.target.value)}
                        className="erp-input text-xs py-1"
                      >
                        <option value="Employee">Employee</option>
                        <option value="DeptHead">Dept Head</option>
                        <option value="AssetManager">Asset Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
