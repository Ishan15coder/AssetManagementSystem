"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface ResourceBookingProps {
  user: any;
}

export default function ResourceBooking({ user }: ResourceBookingProps) {
  const [bookableAssets, setBookableAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Form Values - Create
  const [startDateStr, setStartDateStr] = useState("");
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  const [endTimeStr, setEndTimeStr] = useState("");

  // Reschedule Dialog state
  const [reschedulingBooking, setReschedulingBooking] = useState<any | null>(null);
  const [rescheduleDateStr, setRescheduleDateStr] = useState("");
  const [rescheduleStartTimeStr, setRescheduleStartTimeStr] = useState("");
  const [rescheduleEndDateStr, setRescheduleEndDateStr] = useState("");
  const [rescheduleEndTimeStr, setRescheduleEndTimeStr] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadResources = async () => {
    try {
      const res = await fetch("/api/assets");
      const data = await res.json();
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
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      setSuccess("Booking cancelled successfully");
      loadBookings();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const startISO = new Date(`${rescheduleDateStr}T${rescheduleStartTimeStr}:00Z`);
    const endISO = new Date(`${rescheduleEndDateStr}T${rescheduleEndTimeStr}:00Z`);

    if (startISO >= endISO) {
      setError("Error: Start time must precede end time.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${reschedulingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startISO.toISOString(),
          endDate: endISO.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reschedule booking");

      setSuccess("Booking rescheduled successfully");
      setReschedulingBooking(null);
      loadBookings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = bookableAssets.find((a) => String(a.id) === selectedAssetId);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--fg) mb-1">Resource Booking Scheduler</h1>
        <p className="text-base text-(--muted)">Reserve shared equipment, vehicles, or meeting conference rooms without schedule collisions.</p>
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

      {/* Select Resource Selector */}
      <div className="erp-card bg-(--surface) p-4 flex flex-col md:flex-row items-center gap-3">
        <span className="text-xs font-semibold text-(--muted)">Active Resource:</span>
        <CustomSelect
          value={selectedAssetId}
          onChange={setSelectedAssetId}
          options={bookableAssets.map((asset) => ({
            value: String(asset.id),
            label: `${asset.name} (${asset.tag})`
          }))}
          className="flex-1 md:max-w-xs"
        />
        {selectedAsset && (
          <span className="text-xs text-(--muted)">
            Location: <span className="text-(--foreground)">{selectedAsset.location}</span> | Condition: <span className="text-(--foreground)">{selectedAsset.condition}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Timeline Column */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-semibold text-(--muted)">Schedule Calendar</h2>
          <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden">
            <table className="erp-table min-w-[650px] w-full">
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
                    <td colSpan={5} className="text-center py-4 text-xs text-(--muted)">
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
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReschedulingBooking(b);
                                  const start = new Date(b.startDate);
                                  const end = new Date(b.endDate);
                                  setRescheduleDateStr(start.toISOString().split("T")[0]);
                                  setRescheduleStartTimeStr(start.toISOString().substring(11, 16));
                                  setRescheduleEndDateStr(end.toISOString().split("T")[0]);
                                  setRescheduleEndTimeStr(end.toISOString().substring(11, 16));
                                }}
                                className="text-xs text-(--accent) font-semibold hover:underline"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="text-xs text-(--danger-text) font-semibold hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
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
            <h3 className="text-sm font-semibold text-(--fg)">Book Time Slot</h3>
            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Start Time</label>
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
                  <label className="text-[10px] font-semibold text-(--muted)">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">End Time</label>
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

      {/* Reschedule Modal popup */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4 bg-(--surface) z-[500]">
            <div className="flex justify-between items-center border-b border-(--border) pb-2">
              <h3 className="text-sm font-semibold text-(--fg)">Reschedule Booking</h3>
              <button onClick={() => setReschedulingBooking(null)} className="text-xs text-(--muted) hover:text-(--foreground)">
                Cancel
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Start Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDateStr}
                    onChange={(e) => setRescheduleDateStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">Start Time</label>
                  <input
                    type="time"
                    required
                    value={rescheduleStartTimeStr}
                    onChange={(e) => setRescheduleStartTimeStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">End Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleEndDateStr}
                    onChange={(e) => setRescheduleEndDateStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-semibold text-(--muted)">End Time</label>
                  <input
                    type="time"
                    required
                    value={rescheduleEndTimeStr}
                    onChange={(e) => setRescheduleEndTimeStr(e.target.value)}
                    className="erp-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="submit" className="erp-btn-primary text-xs" disabled={loading}>
                  Save Changes
                </button>
                <button type="button" onClick={() => setReschedulingBooking(null)} className="erp-btn-secondary text-xs">
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
