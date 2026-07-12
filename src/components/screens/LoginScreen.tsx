"use client";

import { useState } from "react";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

const demoUsers = [
  { name: "Amit Admin",      role: "Admin",         email: "admin@assetflow.com"   },
  { name: "Vivaan Patel",    role: "Asset manager", email: "manager@assetflow.com" },
  { name: "Aditya Singh",    role: "IT dept head",  email: "elena.it@assetflow.com"},
  { name: "Aadhya Joshi",    role: "IT employee",   email: "david@assetflow.com"   },
  { name: "Vihaan Gupta",    role: "HR employee",   email: "priya@assetflow.com"   },
];

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError]     = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDevSwitch = async (demoEmail: string) => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoEmail, password: "password123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    if (isForgot) {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reset password");
        setSuccessMsg(`Reset successful. Temporary password is: ${data.tempPassword}`);
        setIsForgot(false);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const url = isSignup ? "/api/auth/signup" : "/api/auth/login";
    const payload = isSignup ? { name, email, password } : { email, password };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      if (isSignup) {
        setIsSignup(false);
        setSuccessMsg("Account created — please sign in.");
      } else {
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex bg-(--bg)"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* Left brand panel — visible md+ */}
      <div className="hidden md:flex flex-col justify-between w-[45%] max-w-lg bg-(--accent) px-12 py-14">
        {/* Logo */}
        <div className="flex items-center">
          <span className="text-white font-bold text-3xl tracking-tight">AssetFlow</span>
        </div>

        {/* Hero text & Mock Ledger */}
        <div className="space-y-8">
          <div>
            <h1
              className="text-4xl font-extrabold text-white leading-tight"
              style={{ textWrap: "balance" }}
            >
              Track, allocate, and audit every corporate asset — in one place.
            </h1>
            <p className="mt-5 text-base text-white/70 leading-relaxed max-w-sm">
              A modern ERP built for IT, operations, and finance teams that need clarity at every step of an asset's lifecycle.
            </p>
          </div>

          {/* Theme element: Mock Asset Ledger Card */}
          <div className="p-5 rounded-md border border-white/10 bg-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active Allocation Ledger</span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Operational
              </span>
            </div>
            <div className="space-y-2">
              {[
                { tag: "AF-1082", name: "Dell UltraSharp 32\"", status: "Allocated", assignee: "David Kim", statusColor: "text-white bg-white/10" },
                { tag: "AF-0943", name: "MacBook Pro M3 Max", status: "In Repair", assignee: "Maintenance Team", statusColor: "text-amber-300 bg-amber-500/10" },
              ].map(item => (
                <div key={item.tag} className="flex items-center justify-between p-2.5 rounded-sm bg-white/5 border border-white/5 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Tag: {item.tag} · {item.assignee}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-3 ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="flex gap-10">
          {[
            { value: "6 modules", label: "Fully integrated" },
            { value: "RBAC",      label: "Role-based access" },
            { value: "SQLite",    label: "Zero config db" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-white font-bold text-base">{s.value}</p>
              <p className="text-white/55 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center mb-8 md:hidden">
            <span className="font-bold text-(--fg) text-2xl tracking-tight">AssetFlow</span>
          </div>

          <h2 className="text-xl font-semibold text-(--fg) mb-1">
            {isForgot ? "Reset password" : isSignup ? "Create an account" : "Sign in"}
          </h2>
          <p className="text-sm text-(--muted) mb-6">
            {isForgot
              ? "Enter your email to receive a temporary sign-in password."
              : isSignup
              ? "You'll start with the Employee role by default."
              : "Enter your credentials to access the dashboard."}
          </p>

          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-sm bg-(--danger-bg) border border-[oklch(from_var(--danger)_l_c_h/0.2)] text-(--danger) text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 px-3.5 py-2.5 rounded-sm bg-(--success-bg) border border-[oklch(from_var(--success)_l_c_h/0.2)] text-(--success) text-sm font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-(--fg) mb-1.5">Full name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="erp-input"
                  placeholder="Jane Smith"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-(--fg) mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="erp-input"
                placeholder="you@company.com"
              />
            </div>

            {!isForgot && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-(--fg)">Password</label>
                  {!isSignup && (
                    <button type="button" onClick={() => { setIsForgot(true); setError(""); setSuccessMsg(""); }} className="text-xs text-(--accent) hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="erp-input"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="erp-btn-primary w-full mt-1.5">
              {loading ? "Processing…" : isForgot ? "Reset password" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-(--muted)">
            {isForgot ? (
              <button
                onClick={() => { setIsForgot(false); setError(""); setSuccessMsg(""); }}
                className="text-(--accent) hover:underline font-medium"
              >
                Back to sign in
              </button>
            ) : isSignup ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setIsSignup(false); setIsForgot(false); setError(""); setSuccessMsg(""); }}
                  className="text-(--accent) hover:underline font-medium"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  onClick={() => { setIsSignup(true); setIsForgot(false); setError(""); setSuccessMsg(""); }}
                  className="text-(--accent) hover:underline font-medium"
                >
                  Create account
                </button>
              </>
            )}
          </p>

          {/* Dev console */}
          <div className="mt-8 pt-6 border-t border-(--border)">
            <p className="text-xs font-medium text-(--muted) mb-3 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-(--warning)"></span>
              Dev console — click to sign in instantly
            </p>
            <div className="space-y-1.5">
              {demoUsers.map(u => (
                <button
                  key={u.email}
                  disabled={loading}
                  onClick={() => handleDevSwitch(u.email)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-sm border border-(--border) bg-(--surface) hover:bg-(--surface-2) hover:border-(--accent) transition-colors duration-(--duration-fast) text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-(--fg)">{u.name}</p>
                    <p className="text-xs text-(--muted)">{u.role}</p>
                  </div>
                  <svg className="text-(--muted)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
