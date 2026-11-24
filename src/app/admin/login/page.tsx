"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Invalid credentials"); setLoading(false); return; }
      router.push("/admin");
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-5" style={{ background: "#FAF9F7" }}>
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]" style={{ fontFamily: "'Bricolage Grotesque', sans-serif", color: "#1C1C1E" }}>
            Chop<span style={{ color: "#E84C3D" }}>Drop</span>
          </h1>
          <p className="text-[12px] font-medium mt-1" style={{ color: "#9CA3AF" }}>Admin Console</p>
        </div>

        {/* Form card */}
        <div className="rounded-[16px] p-6" style={{ background: "#FFFFFF", border: "1px solid #E5E7EB" }}>
          <h2 className="text-[18px] font-bold mb-1" style={{ color: "#1C1C1E" }}>Welcome back</h2>
          <p className="text-[12px] mb-5" style={{ color: "#9CA3AF" }}>Sign in to manage ChopDrop</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#6B7280" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@chopdrop.ng"
                className="w-full h-[44px] px-3.5 rounded-[10px] text-[14px] font-medium outline-none"
                style={{ background: "#F8F8F6", color: "#1C1C1E", border: "1px solid #E5E7EB" }}
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#6B7280" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-[44px] px-3.5 rounded-[10px] text-[14px] font-medium outline-none"
                style={{ background: "#F8F8F6", color: "#1C1C1E", border: "1px solid #E5E7EB" }}
                required
              />
            </div>

            {error && (
              <div className="rounded-[10px] px-3.5 py-2.5 text-[12px] font-bold" style={{ background: "rgba(232,76,61,0.08)", color: "#E84C3D" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] rounded-[12px] text-[14px] font-bold text-white disabled:opacity-50"
              style={{ background: "#E84C3D" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] mt-4" style={{ color: "#9CA3AF" }}>ChopDrop Admin v2.0</p>
      </div>
    </main>
  );
}
