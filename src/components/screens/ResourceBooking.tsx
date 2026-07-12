"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

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

  // Calendar Specific States
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentCalDate, setCurrentCalDate] = useState(new Date());

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

  const statusCounts = bookings.reduce((acc: any, cur: any) => {
    acc[cur.status] = (acc[cur.status] || 0) + 1;
    return acc;
  }, {});
  const statusChartData = ["Upcoming", "Ongoing", "Completed", "Cancelled"].map((s) => ({
    name: s,
    value: statusCounts[s] || 0,
  })).filter(x => x.value > 0);

  const dayOfWeekCounts = bookings.reduce((acc: any, cur: any) => {
    const day = new Date(cur.startDate).toLocaleDateString("en-US", { weekday: "short" });
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const daysOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayChartData = daysOrder.map((day) => ({
    name: day,
    count: dayOfWeekCounts[day] || 0,
  }));

  const STATUS_COLORS: Record<string, string> = {
    Upcoming: "var(--accent)",
    Ongoing: "var(--success-text)",
    Completed: "var(--muted)",
    Cancelled: "var(--danger-text)",
  };

  const selectedAsset = bookableAssets.find((a) => String(a.id) === selectedAssetId);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const getBookingsForDay = (dayDate: Date) => {
    return bookings.filter((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      const targetDate = new Date(dayDate);
      targetDate.setHours(0, 0, 0, 0);
      bStart.setHours(0, 0, 0, 0);
      bEnd.setHours(0, 0, 0, 0);
      return targetDate.getTime() >= bStart.getTime() && targetDate.getTime() <= bEnd.getTime();
    });
  };

  const handleDayClick = (dayDate: Date) => {
    const local = new Date(dayDate.getTime() - dayDate.getTimezoneOffset() * 60000);
    const dateStr = local.toISOString().split("T")[0];
    setStartDateStr(dateStr);
    setEndDateStr(dateStr);
    setSuccess(`Selected date: ${dateStr} - proceed to configure the form below.`);
  };

  const nextMonth = () => {
    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1));
  };

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

      {/* Visual Analytics Strip */}
      {selectedAssetId && bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="erp-card flex flex-col justify-between">
            <h3 className="text-xs font-bold text-(--muted) uppercase tracking-wider mb-2">Booking Status Breakdown</h3>
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "var(--muted)"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col space-y-1 ml-4 text-xs font-semibold">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || "var(--muted)" }} />
                    <span style={{ color: "var(--fg)" }}>{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="erp-card flex flex-col justify-between">
            <h3 className="text-xs font-bold text-(--muted) uppercase tracking-wider mb-2">Booking Count by Day of Week</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted)" fontSize={10} />
                  <YAxis stroke="var(--muted)" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px" }}
                    cursor={{ fill: "var(--surface-2)" }}
                  />
                  <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Bookings Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings Timeline Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">Schedule Calendar</h2>
            <div className="flex bg-(--surface-2) p-0.5 rounded-md border border-(--border)">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${viewMode === "list" ? "bg-(--accent) text-white" : "text-(--muted) hover:text-(--fg)"}`}
              >
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${viewMode === "calendar" ? "bg-(--accent) text-white" : "text-(--muted) hover:text-(--fg)"}`}
              >
                Calendar Grid
              </button>
            </div>
          </div>

          {viewMode === "calendar" ? (
            <div className="erp-card space-y-4">
              <div className="flex justify-between items-center border-b border-(--border) pb-2">
                <button type="button" onClick={prevMonth} className="p-1 hover:bg-(--surface-2) rounded-sm text-(--muted) hover:text-(--fg)">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-(--fg) uppercase tracking-wider">
                  {currentCalDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-(--surface-2) rounded-sm text-(--muted) hover:text-(--fg)">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden text-center text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="bg-(--surface-2) py-2 font-bold text-(--muted)">{d}</div>
                ))}
                {(() => {
                  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentCalDate);
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) {
                    cells.push(<div key={`empty-${i}`} className="bg-(--surface) p-3 min-h-[70px] border-b border-r border-(--border)" />);
                  }
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dayDate = new Date(year, month, d);
                    const dayBookings = getBookingsForDay(dayDate);
                    const isToday = new Date().toDateString() === dayDate.toDateString();
                    
                    cells.push(
                      <div
                        key={`day-${d}`}
                        onClick={() => handleDayClick(dayDate)}
                        className={`bg-(--surface) p-2 min-h-[70px] flex flex-col justify-between items-start cursor-pointer hover:bg-(--surface-2) transition-colors border-b border-r border-(--border) relative group ${isToday ? "border-l-2 border-l-(--accent)" : ""}`}
                      >
                        <span className={`text-[10px] font-bold ${isToday ? "text-(--accent)" : "text-(--fg)"}`}>{d}</span>
                        {dayBookings.length > 0 && (
                          <div className="w-full space-y-1 mt-1 text-left">
                            {dayBookings.slice(0, 2).map((b) => (
                              <div
                                key={b.id}
                                className="text-[9px] px-1 py-0.5 rounded-sm bg-blue-950/45 text-blue-300 border border-blue-900 truncate"
                                title={`${b.employee?.name || "Dept Booking"}: ${new Date(b.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              >
                                {b.employee?.name || "Booked"}
                              </div>
                            ))}
                            {dayBookings.length > 2 && (
                              <div className="text-[8px] text-(--muted) font-semibold">+{dayBookings.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-md overflow-hidden">
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
                          <td className="font-semibold">{b.employee?.name || "Shared"}</td>
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
          )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-500 flex items-center justify-center p-4">
          <div className="erp-card w-full max-w-sm space-y-4 bg-(--surface) z-500">
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
