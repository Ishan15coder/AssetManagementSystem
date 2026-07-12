"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserCog, UserX, Check, Search, Filter } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface OrgSetupProps {
  user: any;
}

export default function OrgSetup({ user }: OrgSetupProps) {
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");
  
  // Lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Form values - create dept
  const [deptName, setDeptName] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  
  // Form values - create category
  const [catName, setCatName] = useState("");
  const [customFieldTemplate, setCustomFieldTemplate] = useState<{ name: string; type: "text" | "number"; label: string }[]>([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number">("text");

  // Editing Department states
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptHeadId, setEditDeptHeadId] = useState("");
  const [editDeptParentId, setEditDeptParentId] = useState("");
  const [editDeptStatus, setEditDeptStatus] = useState("Active");

  // Editing Employee states
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [editEmpName, setEditEmpName] = useState("");
  const [editEmpEmail, setEditEmpEmail] = useState("");
  const [editEmpRole, setEditEmpRole] = useState("Employee");
  const [editEmpStatus, setEditEmpStatus] = useState("Active");
  const [editEmpDeptId, setEditEmpDeptId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [resDepts, resEmployees, resCats] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees"),
        fetch("/api/categories"),
      ]);
      const dataDepts = await resDepts.json();
      const dataEmployees = await resEmployees.json();
      const dataCats = await resCats.json();
      
      setDepartments(dataDepts.departments || []);
      setEmployees(dataEmployees.employees || []);
      setCategories(dataCats.categories || []);
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

  const handleEditDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/departments/${editingDept.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDeptName,
          headId: editDeptHeadId ? parseInt(editDeptHeadId) : null,
          parentId: editDeptParentId ? parseInt(editDeptParentId) : null,
          status: editDeptStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update department");

      setSuccess(`Department "${editDeptName}" updated successfully`);
      setEditingDept(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          customFields: customFieldTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setSuccess(`Category "${catName}" created successfully`);
      setCatName("");
      setCustomFieldTemplate([]);
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

  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/employees/${editingEmp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editEmpName,
          email: editEmpEmail,
          role: editEmpRole,
          status: editEmpStatus,
          departmentId: editEmpDeptId ? parseInt(editEmpDeptId) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee details");

      setSuccess(`Employee "${editEmpName}" updated successfully`);
      setEditingEmp(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditDept = (dept: any) => {
    setEditingDept(dept);
    setEditDeptName(dept.name);
    setEditDeptHeadId(dept.headId ? String(dept.headId) : "");
    setEditDeptParentId(dept.parentId ? String(dept.parentId) : "");
    setEditDeptStatus(dept.status || "Active");
  };

  const startEditEmp = (emp: any) => {
    setEditingEmp(emp);
    setEditEmpName(emp.name);
    setEditEmpEmail(emp.email);
    setEditEmpRole(emp.role);
    setEditEmpStatus(emp.status || "Active");
    setEditEmpDeptId(emp.departmentId ? String(emp.departmentId) : "");
  };

  const addCustomField = () => {
    if (newFieldName.trim()) {
      setCustomFieldTemplate([
        ...customFieldTemplate,
        { name: newFieldName, type: newFieldType, label: newFieldName },
      ]);
      setNewFieldName("");
    }
  };

  const removeCustomField = (index: number) => {
    setCustomFieldTemplate(customFieldTemplate.filter((_, i) => i !== index));
  };

  if (user.role !== "Admin") {
    return (
      <div className="ui-card text-center p-8" style={{ borderColor: "var(--danger)", background: "var(--danger-bg)" }}>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--danger)" }}>Access restricted</h2>
        <p className="text-sm text-(--muted)">
          Only admins can access and modify organization settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--fg)">Organization Setup</h1>
        <p className="text-base text-(--muted) mt-1">Manage departments, asset categories, and employee directory details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-(--border) gap-1">
        {([
          { id: "departments", label: "Departments" },
          { id: "categories",  label: "Categories"  },
          { id: "employees",   label: "Employees"   },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setError(""); setSuccess(""); }}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors duration-(--duration-fast) ${
              activeTab === tab.id
                ? "border-(--accent) text-(--accent)"
                : "border-transparent text-(--muted) hover:text-(--fg)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-(--radius-sm) text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="px-3.5 py-2.5 rounded-(--radius-sm) text-sm font-semibold" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
          {success}
        </div>
      )}

      {/* Tab A: Departments */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-(--fg)">Registered departments</h2>
            <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
              <table className="erp-table min-w-[650px] w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department Head</th>
                    <th>Parent Scope</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-xs text-(--muted)">
                        No departments registered.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="font-semibold">{dept.name}</td>
                        <td className="text-xs">{dept.head?.name || "Unassigned"}</td>
                        <td className="text-xs text-(--muted)">{dept.parent?.name || "None"}</td>
                        <td>
                          <span className={`badge ${dept.status === "Active" ? "badge-success" : "badge-danger"}`}>
                            {dept.status || "Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => startEditDept(dept)}
                            className="text-xs font-semibold text-(--accent) hover:underline"
                          >
                            Edit
                          </button>
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
              <h3 className="text-sm font-semibold text-(--fg)">Create department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-3.5">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Name</label>
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
                  <label className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Department head</label>
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
                  <label className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Parent department</label>
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
                  Create Department
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
            <h2 className="text-sm font-semibold text-(--fg)">Asset categories</h2>
            <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
              <table className="erp-table min-w-[550px] w-full">
                <thead>
                  <tr>
                    <th>Category ID</th>
                    <th>Name</th>
                    <th>Custom Fields Schema</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    let fieldsList = "None";
                    try {
                      const parsed = JSON.parse(cat.customFields);
                      if (parsed && parsed.length > 0) {
                        fieldsList = parsed.map((f: any) => `${f.name} (${f.type})`).join(", ");
                      }
                    } catch {}
                    
                    return (
                      <tr key={cat.id}>
                        <td className="tech-code text-(--muted)">CAT-{String(cat.id).padStart(2, "0")}</td>
                        <td className="font-semibold">{cat.name}</td>
                        <td className="text-xs text-(--muted)">
                          {fieldsList}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="ui-card space-y-4">
              <h3 className="text-sm font-semibold text-(--fg)">Add category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-xs font-semibold text-(--muted) uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="erp-input"
                    placeholder="e.g. Infrastructure"
                  />
                </div>

                {/* Custom fields designer block */}
                <div className="border border-(--border) p-3 rounded-(--radius-sm) space-y-2 bg-(--background)">
                  <span className="text-[10px] font-bold text-(--muted) uppercase tracking-wider">Custom Fields Designer</span>
                  
                  {customFieldTemplate.length > 0 && (
                    <div className="space-y-1">
                      {customFieldTemplate.map((f, i) => (
                        <div key={i} className="flex justify-between items-center text-xs p-1.5 bg-(--surface) border border-(--border)">
                          <span>{f.name} ({f.type})</span>
                          <button
                            type="button"
                            onClick={() => removeCustomField(i)}
                            className="text-[10px] text-red-400 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5 items-end">
                    <div className="flex-1 flex flex-col space-y-1">
                      <label className="text-[9px] font-semibold text-(--muted)">Field Name</label>
                      <input
                        type="text"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                        className="erp-input text-xs py-1"
                        placeholder="e.g. warrantyMonths"
                      />
                    </div>
                    <div className="w-24 flex flex-col space-y-1">
                      <label className="text-[9px] font-semibold text-(--muted)">Type</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="erp-input text-xs py-1"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="erp-btn-secondary text-xs px-2 py-1.5"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="erp-btn-primary w-full">
                  Create Category
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab C: Employees */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-(--fg)">Employee directory</h2>
          <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
            <table className="erp-table min-w-[750px] w-full">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Current Role</th>
                  <th>Status</th>
                  <th>Action</th>
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
                      <span className={`badge ${emp.status === "Active" ? "badge-success" : "badge-danger"}`}>
                        {emp.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => startEditEmp(emp)}
                        className="text-xs font-semibold text-(--accent) hover:underline"
                      >
                        Edit Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Department Edit Dialog Popup */}
      {editingDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-(--border) pb-2">
              <h3 className="text-sm font-semibold text-(--fg)">Edit Department</h3>
              <button onClick={() => setEditingDept(null)} className="text-xs text-(--muted) hover:text-(--foreground)">
                Cancel
              </button>
            </div>
            <form onSubmit={handleEditDepartmentSubmit} className="space-y-3.5">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Department Name</label>
                <input
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                  className="erp-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Department Head</label>
                <select
                  value={editDeptHeadId}
                  onChange={(e) => setEditDeptHeadId(e.target.value)}
                  className="erp-input text-xs"
                >
                  <option value="">Select Head (Optional)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Parent Department</label>
                <select
                  value={editDeptParentId}
                  onChange={(e) => setEditDeptParentId(e.target.value)}
                  className="erp-input text-xs"
                >
                  <option value="">Select Parent (Optional)</option>
                  {departments
                    .filter((d) => d.id !== editingDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Status</label>
                <select
                  value={editDeptStatus}
                  onChange={(e) => setEditDeptStatus(e.target.value)}
                  className="erp-input text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" disabled={loading} className="erp-btn-primary text-xs">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditingDept(null)} className="erp-btn-secondary text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Edit Dialog Popup */}
      {editingEmp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-(--border) pb-2">
              <h3 className="text-sm font-semibold text-(--fg)">Edit Employee Directory Record</h3>
              <button onClick={() => setEditingEmp(null)} className="text-xs text-(--muted) hover:text-(--foreground)">
                Cancel
              </button>
            </div>
            <form onSubmit={handleEditEmployeeSubmit} className="space-y-3.5">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Full Name</label>
                <input
                  type="text"
                  required
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className="erp-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmpEmail}
                  onChange={(e) => setEditEmpEmail(e.target.value)}
                  className="erp-input text-xs"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Department Assignment</label>
                <CustomSelect
                  value={editEmpDeptId}
                  onChange={setEditEmpDeptId}
                  options={[
                    { value: "", label: "Unassigned" },
                    ...departments.map(d => ({ value: String(d.id), label: d.name }))
                  ]}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">ERP Role Role-Based Workflows</label>
                <CustomSelect
                  value={editEmpRole}
                  onChange={setEditEmpRole}
                  options={[
                    { value: "Employee", label: "Employee" },
                    { value: "DeptHead", label: "Dept Head" },
                    { value: "AssetManager", label: "Asset Manager" },
                    { value: "Admin", label: "Admin" },
                  ]}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs font-semibold text-(--muted)">Directory Status</label>
                <CustomSelect
                  value={editEmpStatus}
                  onChange={setEditEmpStatus}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" disabled={loading} className="erp-btn-primary text-xs">
                  Save Details
                </button>
                <button type="button" onClick={() => setEditingEmp(null)} className="erp-btn-secondary text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
