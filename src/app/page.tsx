"use client";

import { useState, useEffect } from "react";
import LoginScreen          from "@/components/screens/LoginScreen";
import MainLayout           from "@/components/screens/MainLayout";
import DashboardOverview    from "@/components/screens/DashboardOverview";
import OrgSetup             from "@/components/screens/OrgSetup";
import AssetDirectory       from "@/components/screens/AssetDirectory";
import AssetAllocation      from "@/components/screens/AssetAllocation";
import ResourceBooking      from "@/components/screens/ResourceBooking";
import MaintenanceManagement from "@/components/screens/MaintenanceManagement";
import AssetAudit           from "@/components/screens/AssetAudit";
import ReportsAnalytics     from "@/components/screens/ReportsAnalytics";
import ActivityLogs         from "@/components/screens/ActivityLogs";

export default function Home() {
  const [user, setUser]               = useState<any | null>(null);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [loading, setLoading]         = useState(true);
  const [progress, setProgress]       = useState(0);
  const [progressComplete, setProgressComplete] = useState(false);

  useEffect(() => {
    // 1. Fetch user session
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Animate loading progress bar
    let start = 0;
    const interval = setInterval(() => {
      start += Math.floor(Math.random() * 12) + 6;
      if (start >= 100) {
        start = 100;
        clearInterval(interval);
        setTimeout(() => setProgressComplete(true), 200);
      }
      setProgress(start);
    }, 45);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (u: any) => { setUser(u); setActiveScreen("dashboard"); };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setActiveScreen("dashboard");
  };

  const showLoader = loading || !progressComplete;

  if (showLoader) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-(--bg) px-6 relative overflow-hidden mesh-bg">
      <div className="w-full max-w-xs space-y-4 text-center z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-(--fg)">AssetFlow</h1>

        <div className="space-y-2">
          {/* Progress bar */}
          <div className="w-full h-1 bg-(--surface-2) border border-(--border-subtle) rounded-full overflow-hidden">
            <div 
              className="h-full bg-(--accent) transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-[10px] text-(--muted) font-semibold tech-code tabular-nums">
            {progress}%
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) return (
    <LoginScreen onLoginSuccess={handleLoginSuccess} />
  );

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":   return <DashboardOverview user={user} setActiveScreen={setActiveScreen} />;
      case "org-setup":   return <OrgSetup user={user} />;
      case "assets":      return <AssetDirectory user={user} />;
      case "allocations": return <AssetAllocation user={user} />;
      case "bookings":    return <ResourceBooking user={user} />;
      case "maintenance": return <MaintenanceManagement user={user} />;
      case "audits":      return <AssetAudit user={user} />;
      case "reports":     return <ReportsAnalytics />;
      case "logs":        return <ActivityLogs />;
      default:            return <DashboardOverview user={user} setActiveScreen={setActiveScreen} />;
    }
  };

  return (
    <MainLayout user={user} onLogout={handleLogout} activeScreen={activeScreen} setActiveScreen={setActiveScreen}>
      {renderScreen()}
    </MainLayout>
  );
}
