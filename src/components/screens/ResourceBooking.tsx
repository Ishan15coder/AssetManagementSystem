"use client";

import { useState, useEffect } from "react";

interface ResourceBookingProps {
  user: any;
}

export default function ResourceBooking({ user }: ResourceBookingProps) {
  const [bookableAssets, setBookableAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Form Values
  const [startDateStr, setStartDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadResources = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
      // Only keep assets flagged as bookable
      const bookable = (data.assets || []).filter((a: any) => a.isBookable);
      setBookableAssets(bookable);
      if (bookable.length > 0 && !selectedAssetId) {
        setSelectedAssetId(String(bookable[0].id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadBookings = async () => {
    if (!selectedAssetId) return;
    try {
      const res = await fetch(`/api/bookings?assetId=${selectedAssetId}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    loadBookings();
    setError("");
    setSuccess("");
  }, [selectedAssetId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const startISO = new Date(`${startDateStr}T${startTimeStr}:00Z`);
    const endISO = new Date(`${endDateStr}T${endTimeStr}:00Z`);

    if (startISO >= endISO) {
      setError("Error: Start time must precede end time.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: parseInt(selectedAssetId),
          startDate: startISO.toISOString(),
          endDate: endISO.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book resource");

      setSuccess("Booking confirmed successfully");
      setStartDateStr("");
      setStartTimeStr("");
      setEndDateStr("");
      setEndTimeStr("");
      loadBookings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setError("");
    setSuccess("");
    try {
      // For visual preview / cancellation trigger (we can delete or update status)
      setBookings(bookings.map((b) => (b.id === bookingId ? { ...b, status: "Cancelled" } : b)));
      setSuccess("Booking cancelled successfully (visual update)");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedAsset = bookableAssets.find((a) => String(a.id) === selectedAssetId);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight mb-1">Resource Booking Scheduler</h1>
        <p className="text-xs text-[var(--muted)]">Reserve shared equipment, vehicles, or meeting conference rooms without schedule collisions.</p>
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

      {/* Select Resource Selector */}
      <div className="erp-card bg-[var(--surface)] p-4 flex flex-col md:flex-row items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Active Resource:</span>
        <select
          value={selectedAssetId}
          onChange={(e) => setSelectedAssetId(e.target.value)}
          className="erp-input flex-1 md:max-w-xs"
        >
          {bookableAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name} ({asset.tag})
            </option>
          ))}
        </select>
        {selectedAsset && (
          <span className="text-xs text-[var(--muted)]">
            Location: <span className="text-[var(--foreground)]">{selectedAsset.location}</span> | Condition: <span className="text-[var(--foreground)]">{selectedAsset.condition}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Timeline Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Schedule Calendar</h2>
          <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Reservee</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.filter((b) => b.status !== "Cancelled").length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-xs text-[var(--muted)]">
                      No active bookings scheduled for this resource.
                    </td>
                  </tr>
                ) : (
                  bookings
                    .filter((b) => b.status !== "Cancelled")
                    .map((b) => (
                      <tr key={b.id}>
                        <td className="font-semibold">{b.employee.name}</td>
                        <td className="tech-code text-xs">
                          {new Date(b.startDate).toLocaleDateString()} {new Date(b.startDate).toISOString().substring(11, 16)}
                        </td>
                        <td className="tech-code text-xs">
                          {new Date(b.endDate).toLocaleDateString()} {new Date(b.endDate).toISOString().substring(11, 16)}
                        </td>
                        <td>
                          <span className={`badge ${b.status === "Ongoing" ? "badge-warning" : "badge-success"}`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          {(user.id === b.employeeId || user.role === "Admin" || user.role === "AssetManager") && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-xs text-[var(--danger-text)] font-semibold hover:underline"
                            >
                              Cancel
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

        {/* Schedule Form Column */}
        <div>
          <div className="erp-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider">Book Time Slot</h3>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
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
                  <label className="text-[10px] uppercase font-bold text-[var(--muted)]">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                  <label className="text-[10px] uppercase font-bold text-[var(--muted)]">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !selectedAssetId} className="erp-btn-primary w-full">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
