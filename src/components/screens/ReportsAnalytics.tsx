"use client";

import { useState, useEffect } from "react";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line, ScatterChart, Scatter, ZAxis, Legend } from "recharts";

const COLORS = {
  Available: "var(--success-text)",
  Allocated: "var(--accent)",
  UnderMaintenance: "var(--warning-text)",
  Reserved: "var(--warning-text)",
  Retired: "var(--danger-text)",
  Lost: "var(--danger-text)",
  Disposed: "var(--danger-text)",
};

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
  
  // Interactive Depreciation States
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [salvageRate, setSalvageRate] = useState<number>(10);
  const [usefulLife, setUsefulLife] = useState<number>(5);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const [repRes, astRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/assets?limit=100")
        ]);
        const resData = await repRes.json();
        const astData = await astRes.json();
        setData(resData);
        setAssets(astData.assets || []);
        if (astData.assets && astData.assets.length > 0) {
          setSelectedAssetId(String(astData.assets[0].id));
        }
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

  // Calculate Straight Line Depreciation Schedule for the Selected Asset
  const selectedAsset = assets.find((a) => String(a.id) === selectedAssetId);
  const cost = selectedAsset ? selectedAsset.acquisitionCost : 0;
  const salvageValue = cost * (salvageRate / 100);
  const depreciableAmount = cost - salvageValue;
  const annualDepreciation = usefulLife > 0 ? depreciableAmount / usefulLife : 0;

  const depreciationSchedule: any[] = [];
  let currentBookValue = cost;
  let accumDep = 0;
  
  depreciationSchedule.push({
    year: "Acquired",
    depreciation: 0,
    accumulated: 0,
    bookValue: cost
  });

  for (let year = 1; year <= usefulLife; year++) {
    accumDep += annualDepreciation;
    currentBookValue -= annualDepreciation;
    depreciationSchedule.push({
      year: `Yr ${year}`,
      depreciation: annualDepreciation,
      accumulated: accumDep,
      bookValue: Math.max(currentBookValue, salvageValue)
    });
  }

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
            <div className="h-64 w-full">
              {data.statusCounts.length === 0 ? (
                <p className="text-xs text-(--muted)">No asset records registered.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {data.statusCounts.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.status] || "var(--accent)"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px" }}
                      itemStyle={{ color: "var(--fg)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "var(--muted)" }} />
                  </PieChart>
                </ResponsiveContainer>
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
            <div className="h-64 w-full">
              {data.departmentAllocations.length === 0 ? (
                <p className="text-xs text-(--muted)">No active allocations to departments.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.departmentAllocations} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted)" fontSize={10} />
                    <YAxis dataKey="department" type="category" stroke="var(--muted)" fontSize={10} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px" }}
                      cursor={{ fill: "var(--surface-2)" }}
                    />
                    <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} name="Active Allocations" />
                  </BarChart>
                </ResponsiveContainer>
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
                    <div key={item.assetName} className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-(--fg)">{item.assetName}</span>
                        <span className="font-bold text-(--accent)">{item.count} bookings</span>
                      </div>
                      <div className="w-full h-1.5 bg-(--surface-2) rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ 
                            width: `${percentage}%`,
                            background: "linear-gradient(90deg, var(--accent) 0%, oklch(75% 0.15 260) 100%)",
                            boxShadow: "0 0 8px var(--accent)",
                            transition: "width 1s ease-out"
                          }}
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
                  <div key={item.priority} className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-(--fg)">{item.priority} Priority</span>
                      <span className="font-bold text-(--accent)">{item.count} requests</span>
                    </div>
                    <div className="w-full h-1.5 bg-(--surface-2) rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.count / 5) * 100)}%`,
                          background: item.priority === "Critical" 
                            ? "linear-gradient(90deg, var(--danger) 0%, oklch(75% 0.18 25) 100%)"
                            : item.priority === "High"
                            ? "linear-gradient(90deg, var(--warning) 0%, oklch(80% 0.15 70) 100%)"
                            : "linear-gradient(90deg, var(--accent) 0%, oklch(75% 0.15 260) 100%)",
                          boxShadow: item.priority === "Critical" 
                            ? "0 0 8px var(--danger)" 
                            : item.priority === "High" 
                            ? "0 0 8px var(--warning)" 
                            : "0 0 8px var(--accent)",
                          transition: "width 1s ease-out"
                        }}
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
          <div className="overflow-x-auto border border-(--border) bg-(--surface) rounded-md overflow-hidden mt-2">
            <table className="erp-table min-w-[750px] w-full">
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
          
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.heatmap} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--muted)" fontSize={10} tickMargin={10} />
                <YAxis stroke="var(--muted)" fontSize={10} tickMargin={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}
                  itemStyle={{ color: "var(--accent)", fontWeight: "bold" }}
                  labelStyle={{ color: "var(--muted)", marginBottom: "4px" }}
                />
                <Area type="monotone" dataKey="count" name="Bookings" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Asset Portfolio Book Value */}
        <div className="erp-card space-y-5 md:col-span-2">
          {/* Total Value Banner */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-(--border) pb-4">
            <div>
              <h2 className="text-xs font-semibold text-(--muted)">Asset Portfolio — Total Book Value</h2>
              <p className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: "var(--success)" }}>
                ₹{data.totalPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <div className="overflow-x-auto border border-(--border) rounded-md overflow-hidden">
                <table className="erp-table min-w-[500px] w-full">
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
                            <td>
                              <div className="text-xs tabular-nums font-bold" style={{ color: "var(--success)" }}>
                                ₹{item.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
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
                              <span className="font-semibold tabular-nums" style={{ color: "var(--success)" }}>
                                ₹{item.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

        {/* Interactive Asset Depreciation Calculator */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center border-b border-(--border) pb-2">
            <h2 className="text-sm font-semibold text-(--fg)">Interactive Asset Depreciation Calculator</h2>
            <span className="text-[10px] uppercase font-bold text-(--muted)">Straight-Line Valuation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Select Asset</label>
                <CustomSelect
                  value={selectedAssetId}
                  onChange={setSelectedAssetId}
                  options={assets.map((a) => ({
                    value: String(a.id),
                    label: `${a.name} (${a.tag})`,
                  }))}
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Useful Lifespan (Years): {usefulLife}</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={usefulLife}
                  onChange={(e) => setUsefulLife(parseInt(e.target.value))}
                  className="w-full accent-(--accent)"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-semibold text-(--muted) uppercase tracking-wider">Salvage Value (%): {salvageRate}%</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={salvageRate}
                  onChange={(e) => setSalvageRate(parseInt(e.target.value))}
                  className="w-full accent-(--accent)"
                />
              </div>

              {selectedAsset && (
                <div className="border border-(--border) p-3 bg-(--surface-2) space-y-1 rounded-sm text-xs">
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Acquisition Cost:</span>
                    <span className="font-bold text-(--fg)">₹{cost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Salvage Value:</span>
                    <span className="font-bold text-(--fg)">₹{salvageValue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-(--muted)">Annual Depr:</span>
                    <span className="font-bold text-(--danger-text)">-₹{annualDepreciation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/yr</span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-64 w-full md:col-span-2">
              <span className="text-[10px] font-bold text-(--muted) uppercase tracking-wider mb-2 block">Depreciation Chart Projection</span>
              {selectedAsset ? (
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={depreciationSchedule} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="year" stroke="var(--muted)" fontSize={10} />
                    <YAxis stroke="var(--muted)" fontSize={10} tickFormatter={(val) => `₹${(val).toLocaleString("en-IN")}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px" }}
                      formatter={(val: any) => [`₹${Math.round(val).toLocaleString("en-IN")}`, 'Remaining Book Value']}
                    />
                    <Area type="monotone" dataKey="bookValue" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-(--muted)">No asset selected for simulation.</p>
              )}
            </div>
          </div>
          
          {selectedAsset && (
            <div className="overflow-x-auto border border-(--border) rounded-sm bg-(--background) mt-4">
              <table className="erp-table w-full text-xs">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Annual Depreciation</th>
                    <th>Accumulated Depreciation</th>
                    <th>Ending Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {depreciationSchedule.map((row, i) => (
                    <tr key={i}>
                      <td className="font-semibold">{row.year}</td>
                      <td className="tabular-nums">₹{row.depreciation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td className="tabular-nums">₹{row.accumulated.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                      <td className="tabular-nums font-bold text-(--success-text)">₹{row.bookValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5-Year Depreciation Projection */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">5-Year Portfolio Depreciation Forecast</h2>
            <button
              onClick={() =>
                exportCSV(
                  "depreciation_forecast",
                  ["Year", "Projected Book Value"],
                  data.depreciationCurve.map((x: any) => [x.year, x.value])
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.depreciationCurve} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" stroke="var(--muted)" fontSize={10} tickMargin={10} />
                <YAxis stroke="var(--muted)" fontSize={10} tickMargin={10} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}
                  itemStyle={{ color: "var(--warning)", fontWeight: "bold" }}
                  formatter={(value: unknown) => [`₹${Number(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, 'Projected Value']}
                  labelStyle={{ color: "var(--muted)", marginBottom: "4px" }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--warning)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "var(--surface)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vendor Reliability Index */}
        <div className="erp-card space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold text-(--muted)">Vendor Reliability Index (Simulated)</h2>
            <button
              onClick={() =>
                exportCSV(
                  "vendor_reliability",
                  ["Vendor", "Total Assets", "Failure Rate (%)"],
                  data.vendorReliability.map((x: any) => [x.vendor, x.totalAssets, x.failureRate])
                )
              }
              className="text-[10px] font-bold text-(--accent) hover:underline"
            >
              Export CSV
            </button>
          </div>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.vendorReliability} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="vendor" stroke="var(--muted)" fontSize={10} tickMargin={10} />
                <YAxis stroke="var(--muted)" fontSize={10} tickMargin={10} tickFormatter={(val) => `${val}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: "12px", borderRadius: "8px", boxShadow: "var(--shadow-md)" }}
                  itemStyle={{ color: "var(--danger-text)", fontWeight: "bold" }}
                  formatter={(value: unknown) => [`${Number(value ?? 0)}%`, 'Hardware Failure Rate']}
                  labelStyle={{ color: "var(--muted)", marginBottom: "4px" }}
                  cursor={{ fill: "var(--surface-2)" }}
                />
                <Bar dataKey="failureRate" fill="var(--danger-text)" radius={[4, 4, 0, 0]} name="Failure Rate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
