"use client";

import { useState, useEffect } from "react";
import { Search, Filter, QrCode, FileText, CheckCircle2 } from "lucide-react";
import { exportToCSV } from "@/lib/export";
import { QRCodeModal } from "@/components/ui/QRCodeModal";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface AssetDirectoryProps {
  user: any;
}

export default function AssetDirectory({ user }: AssetDirectoryProps) {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [assetHistory, setAssetHistory] = useState<any[]>([]);
  const [assetToPrint, setAssetToPrint] = useState<{ tag: string; name: string } | null>(null);
  
  // Registration Form
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");
  const [condition, setCondition] = useState<"New" | "Good" | "Fair" | "Poor">("Good");
  const [location, setLocation] = useState("");
  const [isBookable, setIsBookable] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [showRegForm, setShowRegForm] = useState(false);

  // Search/Filters
  const [searchVal, setSearchVal] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchVal]);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Upload/QR Scan Simulation
  const [uploading, setUploading] = useState(false);
  const [showScanSim, setShowScanSim] = useState(false);
  const [scanSimAssetId, setScanSimAssetId] = useState("");

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
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, [searchQuery, filterCategory, filterStatus]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "photo" | "doc") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "File upload failed");

      if (type === "photo") {
        setPhotoUrl(data.fileUrl);
        setSuccess("Asset photo uploaded successfully");
      } else {
        setDocumentUrl(data.fileUrl);
        setSuccess("Asset document uploaded successfully");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

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
          photoUrl: photoUrl || null,
          documentUrl: documentUrl || null,
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
      setPhotoUrl("");
      setDocumentUrl("");
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

  const handleScanSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanSimAssetId) return;
    const targetAsset = assets.find(a => String(a.id) === scanSimAssetId);
    if (targetAsset) {
      setShowScanSim(false);
      viewHistory(targetAsset);
      setScanSimAssetId("");
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

  const handleExportCSV = () => {
    const formatted = assets.map(a => ({
      Tag: a.tag,
      Name: a.name,
      Category: a.category?.name || "N/A",
      Condition: a.condition,
      Location: a.location,
      Status: a.status,
      Acquisition_Date: new Date(a.acquisitionDate).toLocaleDateString(),
      Acquisition_Cost: a.acquisitionCost
    }));
    exportToCSV("assets_directory.csv", formatted);
  };

  const canRegister = user.role === "AssetManager" || user.role === "Admin";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-(--fg) mb-1">Asset Directory</h1>
          <p className="text-base text-(--muted)">Register, search, and audit corporate physical inventory and active lifecycles.</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={handleExportCSV} className="erp-btn-secondary text-xs">
            Export CSV
          </button>
          <button onClick={() => setShowScanSim(true)} className="erp-btn-secondary text-xs">
            Scan QR Simulator
          </button>
          {canRegister && !showRegForm && (
            <button onClick={() => setShowRegForm(true)} className="erp-btn-primary text-xs">
              Register Asset
            </button>
          )}
        </div>
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

      {/* Registration Form Panel */}
      {showRegForm && (
        <div className="erp-card space-y-4">
          <div className="flex justify-between items-center border-b border-(--border) pb-2">
            <h3 className="text-sm font-semibold text-(--fg)">Register New Asset</h3>
            <button onClick={() => setShowRegForm(false)} className="text-xs text-(--muted) hover:text-(--foreground)">
              Cancel
            </button>
          </div>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Asset Name</label>
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
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Serial Number</label>
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
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Category</label>
              <CustomSelect
                value={categoryId}
                onChange={setCategoryId}
                options={[
                  { value: "", label: "Select Category" },
                  ...categories.map((cat) => ({
                    value: String(cat.id),
                    label: cat.name,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Acquisition Cost (USD)</label>
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
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Initial Condition</label>
              <CustomSelect
                value={condition}
                onChange={(val) => setCondition(val as any)}
                options={[
                  { value: "New", label: "New" },
                  { value: "Good", label: "Good" },
                  { value: "Fair", label: "Fair" },
                  { value: "Poor", label: "Poor" },
                ]}
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Primary Location</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="erp-input"
                placeholder="e.g. IT Storage Locker B"
              />
            </div>

            {/* Photo & PDF Upload fields */}
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Asset Photo upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, "photo")}
                className="erp-input text-xs"
              />
              {photoUrl && <span className="text-[10px] text-emerald-400 font-semibold">✓ Photo attached</span>}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Asset Document (PDF/Doc) upload</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(e, "doc")}
                className="erp-input text-xs"
              />
              {documentUrl && <span className="text-[10px] text-emerald-400 font-semibold">✓ Document attached</span>}
            </div>

            <div className="md:col-span-3 flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isBookable"
                checked={isBookable}
                onChange={(e) => setIsBookable(e.target.checked)}
                className="accent-white h-4 w-4"
              />
              <label htmlFor="isBookable" className="text-xs font-semibold text-(--foreground)">
                Flag as a shared bookable resource (e.g. rooms, cars, projectors)
              </label>
            </div>

            <div className="md:col-span-3 pt-2">
              <button type="submit" disabled={loading || uploading} className="erp-btn-primary">
                Confirm Registration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="erp-card bg-(--surface) p-4 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          className="erp-input flex-1"
          placeholder="Search by tag, name, or serial number..."
        />
        <div className="md:w-48">
          <CustomSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((cat) => ({
                value: String(cat.id),
                label: cat.name,
              })),
            ]}
          />
        </div>
        <div className="md:w-48">
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: "", label: "All Statuses" },
              { value: "Available", label: "Available" },
              { value: "Allocated", label: "Allocated" },
              { value: "Reserved", label: "Reserved" },
              { value: "UnderMaintenance", label: "Under Maintenance" },
              { value: "Lost", label: "Lost" },
              { value: "Retired", label: "Retired" },
              { value: "Disposed", label: "Disposed" },
            ]}
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
        <table className="erp-table min-w-[750px] w-full">
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
                <td colSpan={7} className="text-center py-4 text-xs text-(--muted)">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="tech-code font-bold text-(--accent)">{asset.tag}</td>
                  <td>
                    <div className="font-semibold">{asset.name}</div>
                    <div className="text-[10px] text-(--muted) tech-code">S/N: {asset.serialNumber}</div>
                  </td>
                  <td className="text-xs">{asset.category?.name || "Other"}</td>
                  <td className="text-xs text-(--muted)">{asset.location}</td>
                  <td>
                    <span className="text-xs">{asset.condition}</span>
                  </td>
                  <td>{getStatusBadge(asset.status)}</td>
                  <td>
                    <button
                      onClick={() => viewHistory(asset)}
                      className="text-xs text-(--muted) hover:text-(--foreground) font-semibold underline"
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
          <div className="w-full max-w-lg bg-(--surface) border-l border-(--border) p-6 overflow-y-auto flex flex-col h-full text-(--foreground)">
            <div className="flex justify-between items-center border-b border-(--border) pb-4 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-(--fg)">Asset Details & Lifecycle</h3>
                <p className="text-xs text-(--muted)">History logs for {selectedAsset.name} ({selectedAsset.tag})</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setAssetToPrint({ tag: selectedAsset.tag, name: selectedAsset.name })} className="erp-btn-secondary text-[10px] px-2 py-1">
                  <QrCode size={12} className="mr-1" /> Print QR
                </button>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="text-xs text-(--muted) hover:text-(--foreground) font-semibold ml-2"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Display Photos / Documents if attached */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-4 bg-(--background) p-3 border border-(--border) rounded-(--radius-sm)">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${selectedAsset.tag}`}
                  alt="Asset QR Code"
                  className="h-20 w-20 border border-(--border) bg-white p-1 rounded-(--radius-sm) shrink-0"
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-(--muted) tracking-wider">Asset tag QR Code</span>
                  <p className="text-xs font-semibold mt-0.5">{selectedAsset.tag}</p>
                  <p className="text-[10px] text-(--muted)">Scan to search or process audits locally.</p>
                </div>
              </div>

              {/* Financial Depreciation Module */}
              {selectedAsset.acquisitionCost != null && selectedAsset.acquisitionDate && (
                <div className="bg-(--surface) p-3 border border-(--border) rounded-(--radius-sm)">
                  <span className="text-[10px] uppercase font-bold text-(--muted) tracking-wider">Financial Valuation</span>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-(--muted)">Acquisition Cost</p>
                      <p className="text-sm font-bold text-(--foreground)">
                        ₹{parseFloat(selectedAsset.acquisitionCost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-(--muted)">Current Book Value (20% SL)</p>
                      <p className="text-sm font-bold text-(--accent)">
                        ₹{(() => {
                          const cost = parseFloat(selectedAsset.acquisitionCost);
                          const acqDate = new Date(selectedAsset.acquisitionDate);
                          const ageInYears = (new Date().getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
                          const depreciation = cost * 0.2 * ageInYears; // 20% Straight Line
                          const currentVal = Math.max(0, cost - depreciation);
                          return currentVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.photoUrl && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-(--muted) tracking-wider">Asset Photo</span>
                  <img
                    src={selectedAsset.photoUrl}
                    alt={selectedAsset.name}
                    className="h-36 w-full object-cover rounded-(--radius-sm) border border-(--border) mt-1.5"
                  />
                </div>
              )}

              {selectedAsset.documentUrl && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-(--muted) tracking-wider">Documentation</span>
                  <a
                    href={selectedAsset.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-(--accent) hover:underline"
                  >
                    View Registered PDF / Attachment
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-(--border) pt-4">
              <h4 className="text-xs font-semibold text-(--muted) mb-3">Lifecycle Event Timeline</h4>
              <div className="relative border-l border-(--border) pl-4 ml-2 space-y-6">
                {assetHistory.length === 0 ? (
                  <p className="text-xs text-(--muted) py-4">No historical records found for this asset.</p>
                ) : (
                  assetHistory.map((item, index) => (
                    <div key={index} className="relative">
                      {/* Circle marker on timeline */}
                      <div className="absolute left-[-21px] top-1 h-3.5 w-3.5 bg-(--background) border border-(--border) rounded-full flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-(--accent) rounded-full"></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-(--muted) tech-code">
                          {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                        </div>
                        <div className="text-xs font-semibold mt-1">{item.details}</div>
                        {item.notes && <div className="text-xs text-(--muted) mt-1">{item.notes}</div>}
                        <div className="mt-1">{getStatusBadge(item.status)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Scanner Simulation Pop-up Modal */}
      {showScanSim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center border-b border-(--border) pb-2">
              <h3 className="text-sm font-semibold text-(--fg)">QR Code Scanner Simulator</h3>
              <button onClick={() => setShowScanSim(false)} className="text-xs text-(--muted) hover:text-(--foreground)">
                Cancel
              </button>
            </div>
            <form onSubmit={handleScanSimulateSubmit} className="space-y-4">
              <p className="text-xs text-(--muted) leading-relaxed">
                Scan simulation: Choose an asset tag from the dropdown below to simulate scanning the physical asset's QR sticker.
              </p>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Select Scanned Asset Tag</label>
                <CustomSelect
                  value={scanSimAssetId}
                  onChange={setScanSimAssetId}
                  options={[
                    { value: "", label: "Select Asset..." },
                    ...assets.map((asset) => ({
                      value: String(asset.id),
                      label: `${asset.tag} - ${asset.name}`,
                    })),
                  ]}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="erp-btn-primary text-xs" disabled={!scanSimAssetId}>
                  Simulate QR Scan
                </button>
                <button type="button" onClick={() => setShowScanSim(false)} className="erp-btn-secondary text-xs">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Printing Modal */}
      {assetToPrint && (
        <QRCodeModal
          asset={assetToPrint}
          onClose={() => setAssetToPrint(null)}
        />
      )}
    </div>
  );
}
