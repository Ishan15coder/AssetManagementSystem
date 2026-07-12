"use client";

import { useState, useEffect } from "react";

interface AssetDirectoryProps {
  user: any;
}

export default function AssetDirectory({ user }: AssetDirectoryProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  
  // Registration Form
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [condition, setCondition] = useState<"New" | "Good" | "Fair" | "Poor">("Good");
  const [location, setLocation] = useState("");
  const [isBookable, setIsBookable] = useState(false);
  const [showRegForm, setShowRegForm] = useState(false);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAssets = async () => {
    try {
      const q = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : "";
      const c = filterCategory ? `&categoryId=${filterCategory}` : "";
      const s = filterStatus ? `&status=${filterStatus}` : "";
      
      const res = await fetch(`/api/assets?${q}${c}${s}`);
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error("Failed to load assets", err);
    }
  };

  const loadCategories = async () => {
    try {
      const resDepts = await fetch("/api/departments");
      // Mapped from department data or fallback to defaults
      setCategories([
        { id: 1, name: "Electronics" },
        { id: 2, name: "Furniture" },
        { id: 3, name: "Vehicles" },
        { id: 4, name: "Office Space" },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, [searchQuery, filterCategory, filterStatus]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          serialNumber,
          categoryId: parseInt(categoryId),
          acquisitionDate: new Date().toISOString(),
          acquisitionCost: parseFloat(acquisitionCost) || 0.0,
          condition,
          location,
          isBookable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register asset");

      setSuccess(`Asset registered successfully as Tag: ${data.asset.tag}`);
      setName("");
      setSerialNumber("");
      setCategoryId("");
      setAcquisitionCost("");
      setCondition("Good");
      setLocation("");
      setIsBookable(false);
      setShowRegForm(false);
      loadAssets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const viewHistory = async (asset: any) => {
    setSelectedAsset(asset);
    setAssetHistory([]);
    try {
      const res = await fetch(`/api/assets/${asset.id}/history`);
      const data = await res.json();
      setAssetHistory(data.history || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return <span className="badge badge-success">Available</span>;
      case "Allocated":
        return <span className="badge badge-success" style={{ opacity: 0.8 }}>Allocated</span>;
      case "Reserved":
      case "UnderMaintenance":
        return <span className="badge badge-warning">{status}</span>;
      case "Lost":
      case "Retired":
      case "Disposed":
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const canRegister = user.role === "AssetManager" || user.role === "Admin";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Asset Directory</h1>
          <p className="text-xs text-[var(--muted)]">Register, search, and audit corporate physical inventory and active lifecycles.</p>
        </div>
        {canRegister && !showRegForm && (
          <button onClick={() => setShowRegForm(true)} className="erp-btn-primary text-xs">
            Register Asset
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

      {/* Registration Form Panel */}
      {showRegForm && (
        <div className="erp-card space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Register New Asset</h3>
            <button onClick={() => setShowRegForm(false)} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
              Cancel
            </button>
          </div>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Asset Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="erp-input"
                placeholder="e.g. ThinkPad L14"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Serial Number</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="erp-input"
                placeholder="e.g. SN-88220194"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="erp-input"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Acquisition Cost (USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                className="erp-input"
                placeholder="e.g. 1200.00"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Initial Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="erp-input"
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Primary Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="erp-input"
                placeholder="e.g. IT Storage Locker B"
              />
            </div>

            <div className="md:col-span-3 flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isBookable"
                checked={isBookable}
                onChange={(e) => setIsBookable(e.target.checked)}
                className="accent-white h-4 w-4"
              />
              <label htmlFor="isBookable" className="text-xs font-semibold text-[var(--foreground)]">
                Flag as a shared bookable resource (e.g. rooms, cars, projectors)
              </label>
            </div>

            <div className="md:col-span-3 pt-2">
              <button type="submit" disabled={loading} className="erp-btn-primary">
                Confirm Registration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="erp-card bg-[var(--surface)] p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="erp-input flex-1"
          placeholder="Search by tag, name, or serial number..."
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="erp-input md:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="erp-input md:w-48"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Allocated">Allocated</option>
          <option value="Reserved">Reserved</option>
          <option value="UnderMaintenance">Under Maintenance</option>
          <option value="Lost">Lost</option>
          <option value="Retired">Retired</option>
          <option value="Disposed">Disposed</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-xs text-[var(--muted)]">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="tech-code font-bold text-[var(--accent)]">{asset.tag}</td>
                  <td>
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-[10px] text-[var(--muted)] tech-code">S/N: {asset.serialNumber}</div>
                  </td>
                  <td className="text-xs">{asset.category?.name || "Other"}</td>
                  <td className="text-xs text-[var(--muted)]">{asset.location}</td>
                  <td>
                    <span className="text-xs">{asset.condition}</span>
                  </td>
                  <td>{getStatusBadge(asset.status)}</td>
                  <td>
                    <button
                      onClick={() => viewHistory(asset)}
                      className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold underline"
                    >
                      History Timeline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-out History Timeline Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex justify-end">
          <div className="w-full max-w-lg bg-[var(--surface)] border-l border-[var(--border)] p-6 overflow-y-auto flex flex-col h-full text-[var(--foreground)]">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">Asset Lifecycle Timeline</h3>
                <p className="text-xs text-[var(--muted)]">History logs for {selectedAsset.name} ({selectedAsset.tag})</p>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Close Drawer
              </button>
            </div>

            {/* Timeline List */}
            <div className="relative border-l border-[var(--border)] pl-4 ml-2 space-y-6 flex-1">
              {assetHistory.length === 0 ? (
                <p className="text-xs text-[var(--muted)] py-4">No historical records found for this asset.</p>
              ) : (
                assetHistory.map((item, index) => (
                  <div key={index} className="relative">
                    {/* Circle marker on timeline */}
                    <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 bg-[var(--background)] border border-[var(--border)] rounded-full flex items-center justify-center">
                      <div className="h-1.5 w-1.5 bg-[var(--accent)] rounded-full"></div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--muted)] tech-code">
                        {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                      </div>
                      <div className="text-xs font-semibold mt-1">{item.details}</div>
                      {item.notes && <div className="text-xs text-[var(--muted)] mt-1">{item.notes}</div>}
                      <div className="mt-1">{getStatusBadge(item.status)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
