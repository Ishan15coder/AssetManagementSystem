"use client";

import { useState, useEffect } from "react";

export default function ReportsAnalytics() {
  const [data, setData] = useState<any>({
    statusCounts: [],
    departmentAllocations: [],
    resourceBookings: [],
    maintenanceRequests: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await fetch("/api/reports");
        const resData = await res.json();
        setData(resData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  if (loading) {
    return <div className="text-xs text-[var(--muted)]">Aggregating analytics data...</div>;
  }

  // Helper to find max value for sizing bars
  const getMaxCount = (arr: any[]) => {
    if (!arr || arr.length === 0) return 1;
    return Math.max(...arr.map((item) => item.count));
  };

  const maxDept = getMaxCount(data.departmentAllocations);
  const maxBooking = getMaxCount(data.resourceBookings);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight mb-1">Reports & Analytics</h1>
        <p className="text-xs text-[var(--muted)] font-medium">Core operational insights, utilization trends, and booking heatmap indicators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="erp-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Asset Status Breakdown</h2>
          <div className="space-y-3">
            {data.statusCounts.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No asset records registered.</p>
            ) : (
              data.statusCounts.map((item: any) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.status}</span>
                    <span>{item.count} items</span>
                  </div>
                  {/* CSS Progress Bar */}
                  <div className="w-full h-2 bg-[var(--background)] border border-[var(--border)]">
                    <div
                      className={`h-full ${
                        item.status === "Available"
                          ? "bg-[var(--success-text)]"
                          : item.status === "Allocated"
                          ? "bg-[var(--accent)]"
                          : item.status === "UnderMaintenance"
                          ? "bg-[var(--warning-text)]"
                          : "bg-[var(--danger-text)]"
                      }`}
                      style={{ width: `${Math.min(100, (item.count / 15) * 100)}%` }} // relative to 15 max items
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Allocations */}
        <div className="erp-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Active Department Allocations</h2>
          <div className="space-y-3">
            {data.departmentAllocations.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No active allocations to departments.</p>
            ) : (
              data.departmentAllocations.map((item: any) => {
                const percentage = Math.round((item.count / maxDept) * 100) || 5;
                return (
                  <div key={item.department} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.department}</span>
                      <span>{item.count} active</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--background)] border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Resource Bookings frequency */}
        <div className="erp-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Resource Booking Frequency</h2>
          <div className="space-y-3">
            {data.resourceBookings.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No resources have been booked yet.</p>
            ) : (
              data.resourceBookings.map((item: any) => {
                const percentage = Math.round((item.count / maxBooking) * 100) || 5;
                return (
                  <div key={item.assetName} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.assetName}</span>
                      <span>{item.count} bookings</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--background)] border border-[var(--border)]">
                      <div
                        className="h-full bg-[var(--success-text)]"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Maintenance Priority */}
        <div className="erp-card space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Maintenance Priority Rates</h2>
          <div className="space-y-3">
            {data.maintenanceRequests.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No maintenance tickets resolved or raised.</p>
            ) : (
              data.maintenanceRequests.map((item: any) => (
                <div key={item.priority} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span>{item.priority} Priority</span>
                    <span>{item.count} requests</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--background)] border border-[var(--border)]">
                    <div
                      className={`h-full ${
                        item.priority === "Critical"
                          ? "bg-[var(--danger-text)]"
                          : item.priority === "High"
                          ? "bg-[var(--warning-text)]"
                          : "bg-[var(--accent)]"
                      }`}
                      style={{ width: `${Math.min(100, (item.count / 5) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
