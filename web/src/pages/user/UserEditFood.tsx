import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import FoodMenu from "../admin/events/FoodMenu";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type MenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type RawVendor =
  | { name: string; phone: string; role?: string }
  | { role: string; phone: string; assignedVendor: string };

type EditData = {
  eventId: string;
  version: number;
  savedAt?: string | number;
  isUpdated?: boolean;
  event?: { nameTamil?: string; nameEnglish?: string };
  location?: string;
  session: string;
  time: string;
  foodType: string;
  menu: MenuCategory[];
  vegetables?: { name: string; qty: string; unit: string }[];
  vendors?: RawVendor[];
};

type SaveState = "idle" | "saving" | "saved";

type CountdownTick = {
  isExpired: boolean;
  totalRemainingMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  remainingDays: number;
  progressPct: number;
};

const LS_BOOKING_KEY = "bookFoodData";
const LS_MENU_KEY    = "food-menu";

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const readLiveMenu = (): MenuCategory[] => {
  try {
    const raw = localStorage.getItem(LS_MENU_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const normaliseVendor = (v: RawVendor) => {
  if ("name" in v) return { name: v.name ?? "", phone: v.phone ?? "", role: v.role ?? "" };
  return {
    name: v.assignedVendor?.trim() || v.role?.trim() || "",
    phone: v.phone ?? "",
    role:  v.role  ?? "",
  };
};

const EDIT_WINDOW_DAYS = 10;
const EDIT_WINDOW_MS   = EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const getSavedAtMs = (savedAt?: string | number) => {
  if (typeof savedAt === "number") return savedAt;
  if (typeof savedAt === "string") {
    const p = new Date(savedAt).getTime();
    return Number.isNaN(p) ? 0 : p;
  }
  return 0;
};

const getEditExpiryMeta = (savedAt?: string | number) => {
  const savedAtMs = getSavedAtMs(savedAt);
  if (!savedAtMs) {
    return { isExpired: false, remainingDays: EDIT_WINDOW_DAYS, message: `⏳ ${EDIT_WINDOW_DAYS} days left to edit` };
  }
  const expiresAt   = savedAtMs + EDIT_WINDOW_MS;
  const remainingMs = expiresAt - Date.now();
  const isExpired   = remainingMs <= 0;
  const remainingDays = isExpired ? 0 : Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  return {
    isExpired, remainingDays,
    message: isExpired ? "❌ Edit expired" : `⏳ ${remainingDays} day${remainingDays > 1 ? "s" : ""} left to edit`,
  };
};

const calcCountdown = (savedAt?: string | number): CountdownTick => {
  const savedAtMs   = getSavedAtMs(savedAt);
  const expiresAt   = savedAtMs ? savedAtMs + EDIT_WINDOW_MS : Date.now() + EDIT_WINDOW_MS;
  const remainingMs = Math.max(0, expiresAt - Date.now());
  const isExpired   = remainingMs <= 0;
  const totalSecs   = Math.floor(remainingMs / 1000);
  const days        = Math.floor(totalSecs / 86400);
  const hours       = Math.floor((totalSecs % 86400) / 3600);
  const minutes     = Math.floor((totalSecs % 3600) / 60);
  const seconds     = totalSecs % 60;
  const remainingDays = isExpired ? 0 : Math.max(1, Math.ceil(remainingMs / 86400000));
  const msIntoCurrentDay = (24 * 3600 * 1000) - (remainingMs % (24 * 3600 * 1000));
  const progressPct = isExpired ? 100 : (msIntoCurrentDay / (24 * 3600 * 1000)) * 100;
  return { isExpired, totalRemainingMs: remainingMs, days, hours, minutes, seconds, remainingDays, progressPct };
};

const pad = (n: number) => String(n).padStart(2, "0");

/* ═══════════════════════════════════════════════════════
   FLIP DIGIT
═══════════════════════════════════════════════════════ */
const FlipDigit = ({ value, label, urgent }: { value: string; label: string; urgent: boolean }) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className={[
        "relative rounded-xl flex items-center justify-center",
        "font-black text-2xl tabular-nums select-none overflow-hidden",
        "shadow-[inset_0_2px_4px_rgba(0,0,0,0.15),0_1px_0_rgba(255,255,255,0.1)]",
        urgent
          ? "bg-gradient-to-b from-red-500 to-red-700 text-white"
          : "bg-gradient-to-b from-green-600 to-green-800 text-white",
      ].join(" ")}
      style={{ width: 44, height: 52 }}
    >
      <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10 rounded-t-xl pointer-events-none" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-black/30 pointer-events-none" />
      <span className="relative z-10 leading-none">{value}</span>
    </div>
    <span className={`text-[9px] font-bold uppercase tracking-widest ${urgent ? "text-red-400" : "text-gray-400"}`}>
      {label}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════
   TIMELINE
═══════════════════════════════════════════════════════ */
const TimelineBars = ({
  remainingDays, progressPct, isExpired,
}: { remainingDays: number; progressPct: number; isExpired: boolean }) => {
  const urgent       = remainingDays <= 2 && !isExpired;
  const pastColor    = "bg-gray-200";
  const futureColor  = urgent ? "bg-amber-400" : "bg-green-500";
  const currentColor = urgent ? "bg-orange-500" : "bg-red-500";

  return (
    <div className="mt-4">
      <div className="relative flex items-center h-6">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-100" />
        {!isExpired && (
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-700 ${futureColor}`}
            style={{ width: `${(remainingDays / EDIT_WINDOW_DAYS) * 100}%` }}
          />
        )}
        {Array.from({ length: EDIT_WINDOW_DAYS }).map((_, i) => {
          const dayNumber = EDIT_WINDOW_DAYS - i;
          const isPast    = isExpired || dayNumber > remainingDays;
          const isCurrent = !isExpired && dayNumber === remainingDays;
          const leftPct   = (i / (EDIT_WINDOW_DAYS - 1)) * 100;
          return (
            <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${leftPct}%` }}>
              <div
                className={[
                  "rounded-full transition-all duration-700",
                  isCurrent ? `w-3.5 h-3.5 ${currentColor} ring-2 ring-white shadow-sm` : "w-2 h-2",
                  !isCurrent && (isPast ? pastColor : futureColor),
                ].join(" ")}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2.5">
        {[
          { color: "bg-gray-200", label: "Past" },
          { color: urgent ? "bg-amber-400" : "bg-green-500", label: "Remaining" },
          { color: urgent ? "bg-orange-500" : "bg-red-500", label: "Today" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full inline-block ${color}`} />
            <span className="text-[10px] text-gray-400 font-medium">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   REUSABLE UI PRIMITIVES
═══════════════════════════════════════════════════════ */
const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-green-100 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const SectionHeading = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <span className="inline-block w-1 h-5 rounded-full bg-green-700 flex-shrink-0" />
    <p className="text-xs font-extrabold uppercase tracking-widest text-green-800">{label}</p>
  </div>
);

const FieldDivider = () => <div className="h-px bg-gray-100" />;

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 block">
    {children}
  </span>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const UserEditFood = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { state } = useLocation();
  const editData  = state?.editData as EditData | undefined;

  const [session,   setSession]   = useState("");
  const [hour,      setHour]      = useState("12");
  const [minute,    setMinute]    = useState("00");
  const [ampm,      setAmpm]      = useState("AM");
  const [foodType,  setFoodType]  = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [ready,     setReady]     = useState(false);

  const [editStatus, setEditStatus] = useState(() => getEditExpiryMeta(editData?.savedAt));
  const [tick,       setTick]       = useState<CountdownTick>(() => calcCountdown(editData?.savedAt));

  const displayTime = `${hour}:${minute} ${ampm}`;
  const eventName   = editData?.event?.nameTamil || editData?.event?.nameEnglish || "";
  const location    = editData?.location ?? "";

  useEffect(() => {
    if (!editData) { setReady(true); return; }
    setSession(editData.session   ?? "");
    setFoodType(editData.foodType ?? "");
    const [timePart = "", meridiem = "AM"] = (editData.time ?? "").split(" ");
    const [h = "12", m = "00"] = timePart.split(":");
    setHour(h); setMinute(m); setAmpm(meridiem);
    localStorage.setItem(LS_MENU_KEY, JSON.stringify(editData.menu ?? []));
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [editData]);

  useEffect(() => {
    setEditStatus(getEditExpiryMeta(editData?.savedAt));
    const timer = window.setInterval(() => setEditStatus(getEditExpiryMeta(editData?.savedAt)), 60_000);
    return () => window.clearInterval(timer);
  }, [editData]);

  useEffect(() => {
    setTick(calcCountdown(editData?.savedAt));
    const timer = window.setInterval(() => setTick(calcCountdown(editData?.savedAt)), 1_000);
    return () => window.clearInterval(timer);
  }, [editData]);

  const isUrgent   = !tick.isExpired && tick.days === 0 && tick.hours < 6;
  const isLastSecs = !tick.isExpired && tick.days === 0 && tick.hours === 0 && tick.minutes === 0;

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || (Number(val) >= 1 && Number(val) <= 12)) setHour(val);
  };
  const handleHourBlur   = () => { const n = Number(hour); setHour(!n || n < 1 ? "12" : String(n).padStart(2, "0")); };
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || Number(val) <= 59) setMinute(val);
  };
  const handleMinuteBlur = () => setMinute(String(Number(minute) || 0).padStart(2, "0"));

  const handleSave = () => {
    if (saveState !== "idle" || !editData || editStatus.isExpired) return;
    setSaveState("saving");
    setTimeout(() => {
      const latest = getEditExpiryMeta(editData.savedAt);
      if (latest.isExpired) { setSaveState("idle"); setEditStatus(latest); return; }
      let stored: Record<string, unknown>[] = [];
      try {
        const raw = localStorage.getItem(LS_BOOKING_KEY);
        const parsed = JSON.parse(raw ?? "[]");
        stored = Array.isArray(parsed) ? parsed : [];
      } catch { stored = []; }
      const updatedMenu       = readLiveMenu();
      const normalisedVendors = (editData.vendors ?? []).map(normaliseVendor);
      const updated = stored.map((entry) =>
        entry.eventId === id && entry.version === editData.version
          ? {
              ...entry, session, time: displayTime, foodType,
              menu: updatedMenu,
              vegetables: editData.vegetables ?? entry.vegetables ?? [],
              vendors: normalisedVendors,
              savedAt: new Date().toISOString(),
              isUpdated: true,
            }
          : entry
      );
      localStorage.setItem(LS_BOOKING_KEY, JSON.stringify(updated));
      localStorage.removeItem(LS_MENU_KEY);
      setSaveState("saved");
      setTimeout(() => navigate(`/book-food/${id}/dashboard`), 1200);
    }, 900);
  };

  const startX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (e.changedTouches[0].clientX - startX.current > 100) navigate(-1);
  };

  const sessionPill = (s: string) =>
    `px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer transition-all ${
      session === s
        ? "bg-green-700 text-white border-green-700 shadow-sm"
        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700 hover:bg-green-50"
    }`;

  const foodTypePill = (t: string) => {
    const base = "px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer transition-all ";
    if (foodType !== t) return base + "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700 hover:bg-green-50";
    if (t === "Non Veg") return base + "bg-red-500 text-white border-red-500 shadow-sm";
    if (t === "Veg")     return base + "bg-green-700 text-white border-green-700 shadow-sm";
    return base + "bg-amber-500 text-white border-amber-500 shadow-sm";
  };

  const saveBtnContent = () => {
    if (editStatus.isExpired) return "EXPIRED";
    if (saveState === "saving") return (
      <>
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83 M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Saving…
      </>
    );
    if (saveState === "saved") return (
      <>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Updated
      </>
    );
    return "UPDATE";
  };

  const saveBtnCls = [
    "fixed bottom-0 left-0 right-0 z-50 w-full rounded-none border-0",
    "text-white font-bold text-base tracking-wide py-4 px-6",
    "flex items-center justify-center gap-2 transition-all duration-300",
    "sm:bottom-auto sm:top-5 sm:right-4 sm:left-auto",
    "sm:w-auto sm:rounded-full sm:py-2.5 sm:px-7 sm:text-sm",
    editStatus.isExpired
      ? "bg-gray-400 cursor-not-allowed opacity-95"
      : saveState === "idle"
      ? "bg-green-700 shadow-[0_-4px_20px_rgba(34,137,74,.30)] cursor-pointer active:brightness-90 sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl"
      : saveState === "saving"
      ? "bg-green-600 cursor-not-allowed opacity-90"
      : "bg-green-500 cursor-default",
  ].join(" ");

  /* ── Loading ── */
  if (!ready) return (
    <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-9 h-9 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading editor…</p>
      </div>
    </div>
  );

  /* ── No data ── */
  if (!editData) return (
    <div className="min-h-screen bg-[#f4faf6] flex items-center justify-center px-4">
      <div className="text-center bg-white rounded-2xl p-8 shadow-md max-w-sm w-full border border-green-100">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-2xl mx-auto mb-5">⚠️</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No edit data found</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">Please select a version to edit from the booking dashboard.</p>
        <button onClick={() => navigate(-1)} className="bg-green-700 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-green-800 transition w-full">
          Go Back
        </button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
     COUNTDOWN CARD (sidebar panel)
  ════════════════════════════════════════════════════════ */
  const cardBorder  = tick.isExpired ? "border-red-200 bg-red-50" : isUrgent ? "border-orange-200 bg-orange-50" : "border-amber-200 bg-amber-50";
  const accentText  = tick.isExpired ? "text-red-700"   : isUrgent ? "text-orange-700" : "text-amber-700";
  const subText     = tick.isExpired ? "text-red-400"   : isUrgent ? "text-orange-400" : "text-amber-500";
  const daysLabel   = tick.isExpired ? "text-red-500"   : isUrgent ? "text-orange-600" : "text-green-700";
  const colonColor  = isUrgent ? "text-orange-500" : "text-green-600";
  const badgeCls    = tick.isExpired
    ? "text-red-500 bg-white border-red-200"
    : isUrgent
    ? "text-orange-500 bg-white border-orange-200"
    : "text-amber-600 bg-white border-amber-200";

  const CountdownCard = (
    <div className={`rounded-2xl border overflow-hidden ${cardBorder}`}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-3 border-b border-white/60">
        <span className="text-xl flex-shrink-0 mt-0.5">
          {tick.isExpired ? "🔒" : isUrgent ? "⚡" : "✏️"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={`text-xs font-extrabold tracking-wide ${accentText}`}>
              Editing · List {editData.version}
            </p>
            <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-lg border flex-shrink-0 ${badgeCls}`}>
              {tick.isExpired ? "Expired" : isUrgent ? "Urgent" : "Active"}
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${subText}`}>
            Changes overwrite this version only.
          </p>
        </div>
      </div>

      {/* Flip clock */}
      <div className="px-5 py-5">
        {!tick.isExpired ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-5 border border-white/90 shadow-sm">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-4 text-center">
              Time remaining to edit
            </p>
            <div className="flex items-center justify-center gap-2">
              <FlipDigit value={pad(tick.days)}    label="Days"  urgent={isUrgent} />
              <span className={`text-2xl font-black pb-5 ${colonColor} ${isLastSecs ? "animate-pulse" : ""}`}>:</span>
              <FlipDigit value={pad(tick.hours)}   label="Hours" urgent={isUrgent} />
              <span className={`text-2xl font-black pb-5 ${colonColor} ${isLastSecs ? "animate-pulse" : ""}`}>:</span>
              <FlipDigit value={pad(tick.minutes)} label="Min"   urgent={isUrgent} />
              <span className={`text-2xl font-black pb-5 ${colonColor} ${isLastSecs ? "animate-pulse" : ""}`}>:</span>
              <FlipDigit value={pad(tick.seconds)} label="Sec"   urgent={isUrgent} />
            </div>
            {isLastSecs && (
              <p className="text-center text-[10px] font-bold text-red-500 animate-pulse mt-3">
                ⚠ Save now — expiring in seconds!
              </p>
            )}
            {isUrgent && !isLastSecs && (
              <p className="text-center text-[10px] font-bold text-orange-500 mt-3">
                ⚡ Less than 6 hours remaining
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/70 rounded-2xl px-4 py-6 border border-red-100 text-center">
            <p className="text-3xl mb-2">🔒</p>
            <p className="text-sm font-extrabold text-red-700 mb-1">Edit Window Closed</p>
            <p className="text-[11px] text-red-400 leading-relaxed">This booking can no longer be modified.</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-5 pb-5">
        <div className="bg-white/50 rounded-xl px-4 py-4 border border-white/70">
          <div className="flex items-center justify-between mb-0.5">
            <p className={`text-[11px] font-bold ${daysLabel}`}>
              {tick.isExpired ? "0 of 10 days" : `${tick.remainingDays} of ${EDIT_WINDOW_DAYS} days left`}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">Edit window</p>
          </div>
          <TimelineBars
            remainingDays={tick.remainingDays}
            progressPct={tick.progressPct}
            isExpired={tick.isExpired}
          />
        </div>
      </div>

    </div>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen bg-[#f4faf6] font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── SAVE BUTTON ── */}
      <button
        onClick={handleSave}
        disabled={saveState !== "idle" || editStatus.isExpired}
        className={saveBtnCls}
      >
        {saveBtnContent()}
      </button>

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 text-gray-500 hover:text-green-700 transition-all flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 flex-1 min-w-0">
            <span
              className="hover:text-gray-600 cursor-pointer transition-colors"
              onClick={() => navigate(`/book-food/${id}/dashboard`)}
            >
              Dashboard
            </span>
            <span className="text-gray-200">›</span>
            <span className="text-green-700 font-semibold truncate">Edit Booking</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg flex-shrink-0">
            List{editData.version}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-10">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ──────────────────────────────────
              LEFT — Sticky Countdown Sidebar
          ────────────────────────────────── */}
          <div className="w-full lg:w-[300px] flex-shrink-0 lg:sticky lg:top-[72px] h-fit">
            {CountdownCard}
          </div>

          {/* ──────────────────────────────────
              RIGHT — Main Form Content
          ────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* ╔── EVENT INFO ──╗ */}
            <SectionCard className="p-5 sm:p-6">
              <SectionHeading label="Event Info" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Mahal Name", val: editData.event?.nameTamil || editData.event?.nameEnglish || "—" },
                  { label: "Location",   val: editData.location || "—" },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-green-50 border border-green-100 rounded-xl px-4 py-3.5">
                    <FieldLabel>{label}</FieldLabel>
                    <p className="text-sm font-bold text-green-900 leading-snug mt-1">{val}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
            {/* ╚────────────────╝ */}

            {/* ╔── EVENT DETAILS ──╗ */}
            <SectionCard className="p-5 sm:p-6">
              <SectionHeading label="Event Details" />
              <div className="flex flex-col gap-5">

                {/* Session */}
                <div className="flex flex-col gap-2.5">
                  <FieldLabel>Session</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {["Morning", "Afternoon", "Evening", "Night"].map((s) => (
                      <button key={s} onClick={() => setSession(s)} className={sessionPill(s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <FieldDivider />

                {/* Time */}
                <div className="flex flex-col gap-2.5">
                  <FieldLabel>Time</FieldLabel>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="text" inputMode="numeric" value={hour}
                      onChange={handleHourChange} onBlur={handleHourBlur}
                      maxLength={2} placeholder="12"
                      className="w-14 border border-green-200 bg-gray-50 rounded-xl px-1 py-2.5 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                    />
                    <span className="text-green-600 text-xl font-black">:</span>
                    <input
                      type="text" inputMode="numeric" value={minute}
                      onChange={handleMinuteChange} onBlur={handleMinuteBlur}
                      maxLength={2} placeholder="00"
                      className="w-14 border border-green-200 bg-gray-50 rounded-xl px-1 py-2.5 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                    />
                    <div className="flex border border-green-200 rounded-xl overflow-hidden shadow-sm">
                      {["AM", "PM"].map((a) => (
                        <button key={a} onClick={() => setAmpm(a)}
                          className={`px-3.5 py-2.5 text-xs font-bold transition ${ampm === a ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-green-50"}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                    <span className="bg-green-50 border border-green-200 text-green-800 text-sm font-bold px-3.5 py-2.5 rounded-xl">
                      {displayTime}
                    </span>
                  </div>
                </div>

                <FieldDivider />

                {/* Food Type */}
                <div className="flex flex-col gap-2.5">
                  <FieldLabel>Food Type</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {["Veg", "Non Veg", "Both"].map((t) => (
                      <button key={t} onClick={() => setFoodType(t)} className={foodTypePill(t)}>{t}</button>
                    ))}
                  </div>
                </div>

              </div>
            </SectionCard>
            {/* ╚──────────────────╝ */}

            {/* ╔── FOOD MENU ──╗ */}
            <FoodMenu
              eventName={eventName}
              location={location}
              session={session}
              displayTime={displayTime}
            />
            {/* ╚───────────────╝ */}

            <div className="h-2 sm:h-0" />
          </div>
          {/* END RIGHT */}

        </div>
      </div>
    </div>
  );
};

export default UserEditFood;