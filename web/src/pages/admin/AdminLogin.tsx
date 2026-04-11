import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { setAuth } from "../../utils/auth";


const AdminLogin = () => {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!email || !password) {
    setError("Please fill all fields");
    return;
  }
  // 🔐 ADMIN LOGIN (ADD THIS BACK)
  if (email.trim() === "admin" && password === "admin123") {
    setError("");
    setAuth({ role: "admin" });
    navigate("/admin/dashboard");
    return;
  }

  // 👨‍💼 MANAGER LOGIN
  try {
    const managers = JSON.parse(localStorage.getItem("managers") || "[]");

    const match = managers.find(
      (m: { phone: string; password: string }) =>
        m.phone === email.trim() && m.password === password
    );

    if (match) {
      setError("");
      setAuth({ role: "manager", phone: match.phone });
      navigate("/manager/dashboard");
      return;
    }
  } catch {}

  setError("Invalid credentials");
};

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Georgia', serif" }}
    >
      {/* ══════════ LEFT PANEL — Hero / Brand ══════════ */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden px-14 py-12"
        style={{
          background:
            "linear-gradient(155deg, #022c22 0%, #064e3b 40%, #065f46 70%, #047857 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(202,138,4,0.15) 0%, transparent 65%)",
            filter: "blur(50px)",
          }}
        />
        {/* Grain */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Logo / Brand */}
        <div className="relative flex items-center gap-3">
          <span className="text-3xl">🍃</span>
          <span
            className="text-white/90 text-xl font-black tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Mrs. Caterings
          </span>
        </div>

        {/* Center hero text */}
        <div className="relative flex flex-col gap-6">
          <p
            className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400"
            style={{ fontFamily: "sans-serif" }}
          >
            Admin Portal
          </p>
          <h1
            className="text-5xl xl:text-6xl font-black text-white leading-[1.05]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Manage Every
            <br />
            <span
              className="text-transparent"
              style={{
                WebkitTextStroke: "2px rgba(255,255,255,0.35)",
              }}
            >
              Catering
            </span>
            <br />
            Event.
          </h1>
          <p
            className="text-white/50 text-sm leading-relaxed max-w-xs"
            style={{ fontFamily: "sans-serif" }}
          >
            Full control over menus, vendors, vegetables, and event bookings —
            all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-2">
            {["Menu Planning", "Vendor Management", "Vegetable Lists", "Event Tracking"].map(
              (f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-white/15 text-white/70 bg-white/8"
                  style={{ fontFamily: "sans-serif", background: "rgba(255,255,255,0.07)" }}
                >
                  ✦ {f}
                </span>
              )
            )}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative border-l-2 border-emerald-500/40 pl-4">
          <p className="text-white/40 text-xs italic leading-relaxed" style={{ fontFamily: "sans-serif" }}>
            "Precision in every plate, elegance in every event."
          </p>
        </div>
      </div>

      {/* ══════════ RIGHT PANEL — Login Form ══════════ */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative"
        style={{
          background: "linear-gradient(160deg, #f0fdf4 0%, #dcfce7 60%, #f7fffe 100%)",
        }}
      >
        {/* Soft glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <span className="text-2xl">🍃</span>
          <span
            className="text-green-900 text-lg font-black tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Mrs. Caterings
          </span>
        </div>

        {/* Card */}
        <div className="relative w-full max-w-[400px] bg-white/80 backdrop-blur-xl border border-green-100 rounded-3xl shadow-2xl px-8 py-10">

          {/* Top accent line */}
          <div
            className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #059669, transparent)",
            }}
          />

          {/* Heading */}
          <div className="mb-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 shadow-md"
              style={{
                background: "linear-gradient(135deg, #065f46, #047857)",
                boxShadow: "0 8px 24px rgba(6,95,70,0.30)",
              }}
            >
              🔐
            </div>
            <h2
              className="text-2xl font-black text-green-950"
              style={{ letterSpacing: "-0.03em" }}
            >
              Welcome Back
            </h2>
            <p
              className="text-green-500 text-sm mt-1.5"
              style={{ fontFamily: "sans-serif" }}
            >
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-widest text-green-700"
                style={{ fontFamily: "sans-serif" }}
              >
                Phone / Username
              </label>
              <input
                type="text"
                placeholder="Enter phone or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-green-200 rounded-xl px-4 py-3 text-sm text-green-950 bg-green-50/60 outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                style={{ fontFamily: "sans-serif" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-bold uppercase tracking-widest text-green-700"
                style={{ fontFamily: "sans-serif" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-green-200 rounded-xl px-4 py-3 text-sm text-green-950 bg-green-50/60 outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                style={{ fontFamily: "sans-serif" }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl"
                style={{ fontFamily: "sans-serif" }}
              >
                <span className="text-red-400 text-sm">⚠</span>
                <p className="text-red-500 text-xs font-semibold">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="mt-2 w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all hover:shadow-xl hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
                fontFamily: "sans-serif",
                boxShadow: "0 6px 20px rgba(6,95,70,0.35)",
              }}
            >
              Sign In →
            </button>
          </form>

          {/* Bottom divider hint */}
          <p
            className="text-center text-[11px] text-green-400 mt-6"
            style={{ fontFamily: "sans-serif" }}
          >
            Admin access only · Unauthorized use is prohibited
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;