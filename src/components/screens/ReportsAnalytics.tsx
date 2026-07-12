"use client";

import { useState, useEffect } from "react";

export default function ReportsAnalytics() {
  const [data, setData] = useState<any>({
    statusCounts: [],
    departmentAllocations: [],
    resourceBookings: [],
    maintenanceRequests: [],
    mostUsed: [],
    idle: [],
    nearingRetirement: [],
    heatmap: [],
    portfolioByCategory: [],
    portfolioByStatus: [],
    totalPortfolioValue: 0,
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
    return <div className="text-xs text-(--muted)">Aggregating analytics data...</div>;
  }

  // Client-side CSV Exporter
  const exportCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxDept = data.departmentAllocations.length > 0 ? Math.max(...data.departmentAllocations.map((item: any) => item.count)) : 1;
  const maxBooking = data.resourceBookings.length > 0 ? Math.max(...data.resourceBookings.map((item: any) => item.count)) : 1;
  const maxUsedCount = data.mostUsed.length > 0 ? Math.max(...data.mostUsed.map((item: any) => item.count)) : 1;
  const maxHeatmapCount = data.heatmap.length > 0 ? Math.max(...data.heatmap.map((item: any) => item.count)) : 1;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--fg) mb-1">Reports & Analytics</h1>
        <p className="text-base text-(--muted) font-medium">Core operational insights, utilization trends, and booking heatmap indicators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="erp-card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-(--muted)">Asset Status Breakdown</h2>
              <button
                onClick={() =>
                  exportCSV(
                    "asset_status_breakdown",
                    ["Status", "Item Count"],
                    data.statusCounts.map((s: any) => [s.status, s.count])
                  )
                }
                className="text-[10px] font-bold text-(--accent) hover:underline"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {data.statusCounts.length === 0 ? (
                <p className="text-xs text-(--muted)">No asset records registered.</p>
              ) : (
                data.statusCounts.map((item: any) => (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.status}</span>
                      <span>{item.count} items</span>
                    </div>
                    <div className="w-full h-2 bg-(--background) border border-(--border) rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.status === "Available"
                            ? "bg-(--success-text)"
                            : item.status === "Allocated"
                            ? "bg-(--accent)"
                            : item.status === "UnderMaintenance"
                            ? "bg-(--warning-text)"
                            : "bg-(--danger-text)"
                        }`}
                        style={{ width: `${Math.min(100, (item.count / 15) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Department Allocations */}
        <div className="erp-card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-(--muted)">Active Department Allocations</h2>
              <button
                onClick={() =>
                  exportCSV(
                    "department_allocations",
                    ["Department", "Active Allocations"],
                    data.departmentAllocations.map((d: any) => [d.department, d.count])
                  )
                }
                className="text-[10px] font-bold text-(--accent) hover:underline"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {data.departmentAllocations.length === 0 ? (
                <p className="text-xs text-(--muted)">No active allocations to departments.</p>
              ) : (
                data.departmentAllocations.map((item: any) => {
                  const percentage = Math.round((item.count / maxDept) * 100) || 5;
                  return (
                    <div key={item.department} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.department}</span>
                        <span>{item.count} active</span>
                      </div>
                      <div className="w-full h-2 bg-(--background) border border-(--border) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--accent)"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Resource Bookings frequency */}
        <div className="erp-card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-(--muted)">Resource Booking Frequency</h2>
              <button
                onClick={() =>
                  exportCSV(
                    "resource_booking_frequency",
                    ["Resource Name", "Bookings Count"],
                    data.resourceBookings.map((b: any) => [b.assetName, b.count])
                  )
                }
                className="text-[10px] font-bold text-(--accent) hover:underline"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {data.resourceBookings.length === 0 ? (
                <p className="text-xs text-(--muted)">No resources have been booked yet.</p>
              ) : (
                data.resourceBookings.map((item: any) => {
                  const percentage = Math.round((item.count / maxBooking) * 100) || 5;
                  return (
                    <div key={item.assetName} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.assetName}</span>
                        <span>{item.count} bookings</span>
                      </div>
                      <div className="w-full h-2 bg-(--background) border border-(--border) rounded-full overflow-hidden">
                        <div
                          className="h-full bg-(--success-text)"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Priority */}
        <div className="erp-card space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-semibold text-(--muted)">Maintenance Priority Rates</h2>
              <button
                onClick={() =>
                  exportCSV(
                    "maintenance_priority_rates",
                    ["Priority", "Requests Count"],
                    data.maintenanceRequests.map((m: any) => [m.priority, m.count])
                  )
                }
                className="text-[10px] font-bold text-(--accent) hover:underline"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {data.maintenanceRequests.length === 0 ? (
                <p className="text-xs text-(--muted)">No maintenance tickets resolved or raised.</p>
              ) : (
                data.maintenanceRequests.map((item: any) => (
                  <div key={item.priority} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{item.priority} Priority</span>
                      <span>{item.count} requests</span>
                    </div>
                    <div className="w-full h-2 bg-(--background) border border-(--border) rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.priority === "Critical"
                            ? "bg-(--danger-text)"
                            : item.priority === "High"
                            ? "bg-(--warning-text)"
                            : "bg-(--accent)"
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

        {/* Utilization Trends: Most Used vs Idle */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">Asset Utilization Trends (Most Active vs. Idle)</h2>
            <button
              onClick={() =>
                exportCSV(
                  "asset_utilization_trends",
                  ["Tag", "Name", "Total Handovers/Bookings"],
                  [
                    ...data.mostUsed.map((x: any) => [x.tag, x.name, `${x.count} (Most Active)`]),
                    ...data.idle.map((x: any) => [x.tag, x.name, `${x.count} (Idle)`]),
                  ]
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-(--success-text)">Top 5 Most Active Assets</span>
              {data.mostUsed.length === 0 ? (
                <p className="text-xs text-(--muted)">No asset usage tracked.</p>
              ) : (
                data.mostUsed.map((item: any) => {
                  const pct = Math.round((item.count / maxUsedCount) * 100) || 5;
                  return (
                    <div key={item.tag} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{item.name} ({item.tag})</span>
                        <span className="text-(--muted)">{item.count} checkouts</span>
                      </div>
                      <div className="w-full h-1.5 bg-(--background) rounded-full overflow-hidden">
                        <div className="h-full bg-(--success-text)" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-(--danger-text)">Idle / Cold Assets (Least Checked Out)</span>
              {data.idle.length === 0 ? (
                <p className="text-xs text-(--muted)">No idle assets tracked.</p>
              ) : (
                data.idle.map((item: any) => (
                  <div key={item.tag} className="flex justify-between items-center text-xs py-1 border-b border-(--border)">
                    <span>{item.name} ({item.tag})</span>
                    <span className="tech-code font-bold text-(--muted)">{item.count} usages</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Nearing Retirement Table */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">Asset Lifespan Forecast (Nearing Retirement)</h2>
            <button
              onClick={() =>
                exportCSV(
                  "asset_lifespan_retirement",
                  ["Tag", "Name", "Estimated Retirement Date", "Months Remaining"],
                  data.nearingRetirement.map((x: any) => [x.tag, x.name, x.retirementDate, x.monthsRemaining])
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-(--radius-md) overflow-hidden mt-2">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Name</th>
                  <th>Estimated Retirement</th>
                  <th>Months Remaining</th>
                  <th>Lifecycle Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {data.nearingRetirement.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-xs text-(--muted)">
                      No physical assets nearing retirement thresholds.
                    </td>
                  </tr>
                ) : (
                  data.nearingRetirement.map((asset: any) => (
                    <tr key={asset.tag}>
                      <td className="tech-code font-bold text-(--accent)">{asset.tag}</td>
                      <td className="font-semibold">{asset.name}</td>
                      <td className="tech-code text-xs">{asset.retirementDate}</td>
                      <td>
                        <span className={`badge ${asset.monthsRemaining < 3 ? "badge-danger" : asset.monthsRemaining < 12 ? "badge-warning" : "badge-success"}`}>
                          {asset.monthsRemaining} months
                        </span>
                      </td>
                      <td className="text-xs">
                        {asset.monthsRemaining < 0 ? (
                          <span className="text-(--danger-text) font-bold">Needs Immediate Replacement / Disposal</span>
                        ) : asset.monthsRemaining < 6 ? (
                          <span className="text-(--warning-text) font-semibold">Prepare procurement cycle requests</span>
                        ) : (
                          <span className="text-(--success-text)">Operational</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource Booking Heatmap */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">Resource Booking Heatmap (Peak Hour Usage - UTC)</h2>
            <button
              onClick={() =>
                exportCSV(
                  "resource_booking_heatmap",
                  ["Hour", "Bookings Count"],
                  data.heatmap.map((x: any) => [x.hour, x.count])
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline"
            >
              Export CSV
            </button>
          </div>
          
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 pt-2">
            {data.heatmap.map((h: any) => {
              // Calculate cell color intensity based on usage
              const ratio = maxHeatmapCount > 0 ? h.count / maxHeatmapCount : 0;
              const intensity = Math.min(1, ratio);
              return (
                <div
                  key={h.hour}
                  className="p-2 border border-(--border) rounded-(--radius-sm) flex flex-col items-center justify-center text-center transition-all duration-200"
                  style={{
                    background: intensity > 0 ? `rgba(255, 255, 255, ${0.05 + intensity * 0.15})` : "var(--background)",
                    borderColor: intensity > 0.5 ? "var(--accent)" : "var(--border)",
                  }}
                  title={`${h.count} bookings at ${h.hour}`}
                >
                  <span className="text-[9px] text-(--muted) font-semibold">{h.hour}</span>
                  <span className={`text-xs font-bold mt-1 ${intensity > 0.5 ? "text-(--accent)" : "text-(--fg)"}`}>{h.count}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-(--muted) flex items-center gap-2 pt-2 justify-end">
            <span>Low Usage</span>
            <div className="h-2 w-8 bg-white/5 border border-(--border)"></div>
            <div className="h-2 w-8 bg-white/20 border border-(--accent)"></div>
            <span>Peak Usage</span>
          </div>
        </div>
        {/* Asset Portfolio Book Value */}
        <div className="erp-card space-y-5 md:col-span-2">
          {/* Total Value Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-(--border) pb-4">
            <div>
              <h2 className="text-xs font-semibold text-(--muted)">Asset Portfolio — Total Book Value</h2>
              <p className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: "var(--success)" }}>
                ${data.totalPortfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-(--muted) mt-0.5">Cumulative acquisition cost of all registered assets</p>
            </div>
            <button
              onClick={() =>
                exportCSV(
                  "portfolio_book_value",
                  ["Category", "Asset Count", "Total Book Value (USD)"],
                  data.portfolioByCategory.map((c: any) => [
                    c.category,
                    c.assetCount,
                    c.totalValue.toFixed(2),
                  ])
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline self-start md:self-center"
            >
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown Table */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-(--muted)">Value by Category</span>
              <div className="overflow-x-auto border border-(--border) rounded-(--radius-md) overflow-hidden">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Assets</th>
                      <th>Book Value (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.portfolioByCategory.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-xs text-(--muted)">
                          No asset cost data available.
                        </td>
                      </tr>
                    ) : (
                      [...data.portfolioByCategory]
                        .sort((a: any, b: any) => b.totalValue - a.totalValue)
                        .map((item: any) => (
                          <tr key={item.category}>
                            <td className="font-semibold">{item.category}</td>
                            <td className="tabular-nums text-xs">{item.assetCount}</td>
                            <td className="tabular-nums font-bold text-xs" style={{ color: "var(--success)" }}>
                              ${item.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Book Value by Status Bar Chart */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-(--muted)">Book Value by Asset Status</span>
              {data.portfolioByStatus.length === 0 ? (
                <p className="text-xs text-(--muted)">No data available.</p>
              ) : (() => {
                const maxVal = Math.max(...data.portfolioByStatus.map((s: any) => s.totalValue), 1);
                return (
                  <div className="space-y-3">
                    {[...data.portfolioByStatus]
                      .sort((a: any, b: any) => b.totalValue - a.totalValue)
                      .map((item: any) => {
                        const pct = Math.round((item.totalValue / maxVal) * 100) || 2;
                        const color =
                          item.status === "Available"
                            ? "var(--success-text)"
                            : item.status === "Allocated"
                            ? "var(--accent)"
                            : item.status === "UnderMaintenance"
                            ? "var(--warning-text)"
                            : "var(--danger-text)";
                        return (
                          <div key={item.status} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{item.status}</span>
                              <span className="tabular-nums" style={{ color }}>
                                ${item.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-(--background) border border-(--border) rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
