/**
 * AdminFoodView.tsx
 * Version timeline shown prominently at the TOP of the page (full-width),
 * detail content below. Works on both mobile and desktop.
 *
 * FIX: Vendor data normalised at load-time — both shapes work:
 *   Shape A (VendorList save): { role, phone, assignedVendor }
 *   Shape B (AdminFoodView):   { name, phone }
 *
 * UPDATE: Vendor card now shows Role → Vendor Name → Phone
 * UPDATE: handlePrintAll moved inside FoodDetailBody (has access to v, filledMenu, filledVeg, filledVend)
 */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useBackNavigation } from "../../../hooks/useBackNavigation";
import { getAuth } from "../../../utils/auth";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type MenuCategory = { id: string; category: string; items: string[] };
type Vegetable    = { name: string; qty: string; unit: string };

/** Shape that AdminFoodView renders — now includes optional role */
type Vendor = {
  name : string;
  phone: string;
  role?: string;
};

/**
 * Raw shape that may come from VendorList (before BookFood transforms it).
 * We handle BOTH so old saves and new saves all work correctly.
 */
type RawVendor =
  | { name: string; phone: string; role?: string }           // already transformed
  | { role: string; phone: string; assignedVendor: string }; // raw VendorList shape

export type FoodBookingPayload = {
  eventId   : string;
  event?    : { nameTamil?: string; nameEnglish?: string };
  location? : string;
  session   : string;
  time      : string;
  foodType  : string;
  menu      : MenuCategory[];
  vegetables: Vegetable[];
  vendors   : RawVendor[];
  version?  : number;
  savedAt?  : string | number;
};

type FoodVersion = Omit<FoodBookingPayload, "vendors"> & {
  version: number;
  savedAt: string | number;
  vendors: Vendor[];          // always normalised
};

const LS_KEY = "bookFoodData";

/* ═══════════════════════════════════════════════════════
   VENDOR NORMALISER
   Converts either raw shape → { name, phone, role }
═══════════════════════════════════════════════════════ */
const normaliseVendor = (v: RawVendor): Vendor => {
  if ("name" in v) {
    return {
      name : v.name  ?? "",
      phone: v.phone ?? "",
      role : v.role  ?? "",
    };
  }
  // Raw VendorList shape: prefer assignedVendor for name, keep role separately
  return {
    name : v.assignedVendor?.trim() || v.role?.trim() || "",
    phone: v.phone ?? "",
    role : v.role  ?? "",
  };
};

/* ═══════════════════════════════════════════════════════
   SAVE HELPER
═══════════════════════════════════════════════════════ */
export const saveBookingVersion = (payload: FoodBookingPayload): FoodVersion => {
  let all: FoodBookingPayload[] = [];
  try {
    all = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(all)) all = [];
  } catch { all = []; }

  const existing   = all.filter((d) => d.eventId === payload.eventId);
  const maxVersion = existing.reduce((mx, d) => Math.max(mx, d.version ?? 0), 0);

  const newEntry = {
    ...payload,
    eventId: String(payload.eventId).trim(),
    version: maxVersion + 1,
    savedAt: new Date().toISOString(),
  };

  all.push(newEntry);
  localStorage.setItem(LS_KEY, JSON.stringify(all));

  return {
    ...newEntry,
    vendors: (newEntry.vendors ?? []).map(normaliseVendor),
  } as FoodVersion;
};

/* ═══════════════════════════════════════════════════════
   DELETE HELPERS
═══════════════════════════════════════════════════════ */
export const deleteSingleVersion = (
  eventId    : string,
  version    : number,
  allVersions: FoodVersion[],
  setVersions: React.Dispatch<React.SetStateAction<FoodVersion[]>>,
  activeIndex: number,
  setActive  : React.Dispatch<React.SetStateAction<number>>,
): void => {
  let stored: FoodBookingPayload[] = [];
  try {
    stored = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(stored)) stored = [];
  } catch { stored = []; }

  const updated = stored.filter(
    (d) => !(d.eventId === eventId && (d.version ?? 0) === version)
  );
  localStorage.setItem(LS_KEY, JSON.stringify(updated));

  const newVersions = allVersions.filter((d) => d.version !== version);
  setVersions(newVersions);

  if (newVersions.length === 0) {
    setActive(0);
  } else if (activeIndex >= newVersions.length) {
    setActive(newVersions.length - 1);
  }
};

export const deleteAllVersions = (
  eventId    : string,
  setVersions: React.Dispatch<React.SetStateAction<FoodVersion[]>>,
): void => {
  let stored: FoodBookingPayload[] = [];
  try {
    stored = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(stored)) stored = [];
  } catch { stored = []; }

  const updated = stored.filter((d) => d.eventId !== eventId);
  localStorage.setItem(LS_KEY, JSON.stringify(updated));
  setVersions([]);
};

/* ═══════════════════════════════════════════════════════
   NORMALISE ALL VERSIONS
═══════════════════════════════════════════════════════ */
const normaliseVersions = (raw: FoodBookingPayload[]): FoodVersion[] => {
  const groups: Record<string, FoodBookingPayload[]> = {};
  raw.forEach((d) => {
    if (!groups[d.eventId]) groups[d.eventId] = [];
    groups[d.eventId].push(d);
  });

  const result: FoodVersion[] = [];
  Object.values(groups).forEach((group) => {
    group.sort((a, b) => {
      const ta = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const tb = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return ta - tb;
    });
    group.forEach((entry, i) => {
      result.push({
        ...entry,
        version: entry.version && entry.version > 0 ? entry.version : i + 1,
        savedAt: entry.savedAt ?? new Date().toISOString(),
        vendors: (entry.vendors ?? []).map(normaliseVendor),
      });
    });
  });
  return result;
};

/* ═══════════════════════════════════════════════════════
   ANIMATION VARIANTS
═══════════════════════════════════════════════════════ */
const stagger: Variants = {
  hidden: {},
  show  : { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const slideRow: Variants = {
  hidden: { opacity: 0, x: -14 },
  show  : { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
const scaleCard: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show  : { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" } },
};
const contentSwap: Variants = {
  hidden: { opacity: 0, y: 10 },
  show  : { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit  : { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ═══════════════════════════════════════════════════════
   CONFIGS
═══════════════════════════════════════════════════════ */
const FOOD_TYPE: Record<string, {
  label: string; emoji: string; accent: string;
  bg: string; text: string; border: string; dot: string;
}> = {
  Veg       : { label:"Pure Veg",    emoji:"🌿", accent:"#16a34a", bg:"bg-green-50",  text:"text-green-700",  border:"border-green-200", dot:"#16a34a" },
  "Non Veg" : { label:"Non-Veg",     emoji:"🍗", accent:"#e11d48", bg:"bg-red-50",    text:"text-red-700",    border:"border-red-200",   dot:"#e11d48" },
  Both      : { label:"Veg+Non-Veg", emoji:"🍱", accent:"#d97706", bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200", dot:"#d97706" },
};
const SESSION: Record<string, { icon: string; color: string }> = {
  Morning  : { icon:"🌅", color:"text-orange-600" },
  Afternoon: { icon:"☀️", color:"text-yellow-600" },
  Evening  : { icon:"🌆", color:"text-purple-600" },
  Night    : { icon:"🌙", color:"text-indigo-600" },
};

/* ═══════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════ */
const ordinal = (n: number) => {
  const s = ["th","st","nd","rd"], v = n % 100;
  return `${n}${s[(v-20)%10] ?? s[v] ?? s[0]}`;
};
const fmtDate = (ts: string | number): string => {
  try {
    const d = new Date(typeof ts === "number" ? ts : ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit", hour12:true });
  } catch { return "—"; }
};

/* ═══════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════ */
const VegDot = ({ color }: { color: string }) => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0" style={{ borderColor: color }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
  </span>
);

const SectionHead = ({ icon, title, count }: { icon: string; title: string; count?: number }) => (
  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-base flex-shrink-0">{icon}</div>
    <h3 className="text-sm font-bold text-gray-800 flex-1">{title}</h3>
    {count !== undefined && (
      <span className="text-[11px] font-bold text-red-400 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">{count}</span>
    )}
  </div>
);

const Empty = ({ msg }: { msg: string }) => (
  <div className="flex flex-col items-center gap-2 py-10">
    <span className="text-2xl opacity-20">—</span>
    <p className="text-xs text-gray-400">{msg}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════
   DELETE CONFIRM MODAL
═══════════════════════════════════════════════════════ */
type DeleteModalProps = {
  mode     : "single" | "all";
  version? : number;
  eventId  : string;
  onConfirm: () => void;
  onCancel : () => void;
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show  : { opacity: 1, transition: { duration: 0.22 } },
  exit  : { opacity: 0, transition: { duration: 0.18 } },
};
const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 24 },
  show  : { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 340, damping: 26 } },
  exit  : { opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.18 } },
};

const DeleteConfirmModal = ({ mode, version, eventId, onConfirm, onCancel }: DeleteModalProps) => {
  const isSingle = mode === "single";
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center px-4"
        variants={backdropVariants} initial="hidden" animate="show" exit="exit"
      >
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onCancel} />
        <motion.div
          className="relative z-10 bg-white rounded-3xl shadow-2xl shadow-red-100/60 border border-red-50 w-full max-w-sm overflow-hidden"
          variants={modalVariants}
        >
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-400 to-rose-300" />
          <div className="px-6 py-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 ${isSingle ? "bg-orange-50 border-2 border-orange-100" : "bg-red-50 border-2 border-red-100"}`}>
              {isSingle ? "🗑️" : "⚠️"}
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 text-center leading-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
              {isSingle ? `Delete ${ordinal(version!)} Save?` : "Delete All ?"}
            </h2>
            <p className="text-sm text-gray-500 text-center leading-relaxed mb-1">
              {isSingle
                ? <><span>Permanently delete </span><span className="font-bold text-gray-700">Saving {version}</span><span> of this booking.</span></>
                : <><span>Permanently delete </span><span className="font-bold text-red-600">all saved </span><span> for this event.</span></>
              }
            </p>
            <p className="text-xs text-gray-400 text-center mb-5">This action cannot be undone.</p>
            <div className="flex items-center justify-center mb-5">
              <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">Event: {eventId}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 h-11 rounded-2xl border-2 border-gray-100 bg-gray-50 text-gray-600 text-sm font-bold hover:border-gray-200 hover:bg-gray-100 transition-all duration-200 active:scale-95">
                Cancel
              </button>
              <button onClick={onConfirm}
                className={`flex-1 h-11 rounded-2xl text-white text-sm font-bold transition-all duration-200 active:scale-95 shadow-lg ${
                  isSingle
                    ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-orange-200 hover:shadow-orange-300"
                    : "bg-gradient-to-r from-red-600 to-rose-500 shadow-red-200 hover:shadow-red-300"
                }`}>
                {isSingle ? "Delete List" : "Delete All List"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════
   DELETE + EDIT + PRINT ACTION BUTTONS
═══════════════════════════════════════════════════════ */
const DeleteActions = ({
  onDeleteSingle,
  onDeleteAll,
  onEdit,
  onPrint,
}: {
  onDeleteSingle: () => void;
  onDeleteAll   : () => void;
  onEdit        : () => void;
  onPrint       : () => void;
}) => (
  <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 items-end">

    {/* PRINT — above Edit */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onPrint}
      className="
        w-12 h-12 sm:w-44 sm:h-12
        flex items-center justify-center gap-2
        rounded-full border-2 border-blue-100
        bg-blue-50 text-blue-700
        text-sm font-bold shadow-lg shadow-blue-100
        hover:bg-blue-100 hover:border-blue-200
        transition-all duration-200
      "
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
      <span className="hidden sm:inline">Print </span>
    </motion.button>

    {/* EDIT */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onEdit}
      className="
        w-12 h-12 sm:w-44 sm:h-12
        flex items-center justify-center gap-2
        rounded-full border-2 border-green-100
        bg-green-50 text-green-700
        text-sm font-bold shadow-lg shadow-green-100
        hover:bg-green-100 hover:border-green-200
        transition-all duration-200
      "
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      <span className="hidden sm:inline">Edit</span>
    </motion.button>

    {/* DELETE SINGLE */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onDeleteSingle}
      className="
        w-12 h-12 sm:w-44 sm:h-12
        flex items-center justify-center gap-2
        rounded-full border-2 border-orange-100
        bg-orange-50 text-orange-600
        text-sm font-bold shadow-lg shadow-orange-100
        hover:bg-orange-100 hover:border-orange-200
        transition-all duration-200
      "
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6M14 11v6"/>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
      <span className="hidden sm:inline">Delete</span>
    </motion.button>

    {/* DELETE ALL */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onDeleteAll}
      className="
        w-12 h-12 sm:w-44 sm:h-12
        flex items-center justify-center gap-2
        rounded-full border-2 border-red-100
        bg-red-50 text-red-600
        text-sm font-bold shadow-lg shadow-red-100
        hover:bg-red-100 hover:border-red-200
        transition-all duration-200
      "
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 6h18"/>
        <path d="M8 6V4h8v2"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <line x1="9" y1="10" x2="9" y2="20"/>
        <line x1="12" y1="10" x2="12" y2="20"/>
        <line x1="15" y1="10" x2="15" y2="20"/>
      </svg>
      <span className="hidden sm:inline">Delete All</span>
    </motion.button>

  </div>
);

/* ═══════════════════════════════════════════════════════
   TOP VERSION TIMELINE — FULL WIDTH, ABOVE CONTENT
═══════════════════════════════════════════════════════ */
const TopVersionTimeline = ({
  versions,
  active,
  onSelect,
}: {
  versions: FoodVersion[];
  active  : number;
  onSelect: (idx: number) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.children[active] as HTMLElement | null;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  const latest = versions[0];

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden mb-5">

      <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-sm flex-shrink-0">🕓</div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-400 leading-none mb-0.5">Booking History</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full">
            {versions.length} {versions.length === 1 ? "save" : "saves"}
          </span>
          <span className="text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-2.5 py-1 rounded-full">
            Latest · List{latest.version}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 px-4 py-4 overflow-x-auto"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {versions.map((v, idx) => {
          const isActive = active === idx;
          const isLatest = v.version === latest.version;
          return (
            <motion.button
              key={`${v.eventId}-v${v.version}-${idx}`}
              onClick={() => onSelect(idx)}
              whileTap={{ scale: 0.96 }}
              className={`flex-shrink-0 flex flex-col gap-2 px-4 py-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 w-[148px] relative text-left ${
                isActive
                  ? "border-red-400 bg-red-50 shadow-lg shadow-red-100"
                  : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/40"
              }`}
            >
              {isLatest && (
                <span className="absolute -top-2 -right-1 text-[8px] font-extrabold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                  Latest
                </span>
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm transition-all ${
                isActive ? "bg-red-500 text-white shadow-md shadow-red-200" : "bg-gray-50 text-gray-400 border border-gray-100"
              }`}>
                {v.version}
              </div>
              <div>
                <p className={`text-xs font-extrabold leading-tight ${isActive ? "text-red-700" : "text-gray-700"}`}>
                  {ordinal(v.version)} Save
                  
                </p>
              </div>
              <p className={`text-[9px] font-medium leading-tight ${isActive ? "text-red-400" : "text-gray-300"}`}>
                {fmtDate(v.savedAt)}
              </p>
              <div className="flex flex-wrap gap-1">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${
                  isActive ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}>{v.session}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${
                  isActive ? "bg-red-100 text-red-600" : "bg-gray-50 text-gray-400 border border-gray-100"
                }`}>{v.foodType}</span>
              </div>
              {isActive && (
                <motion.div layoutId="versionActiveDot" className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`bar-${active}`}
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-4 mb-4 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-red-700">
              Viewing: {ordinal(versions[active]?.version)} Save {versions[active]?.version}
            </p>
            <p className="text-[10px] text-red-400 truncate">{fmtDate(versions[active]?.savedAt)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <span className="text-[9px] font-bold text-red-500 bg-white border border-red-100 px-2 py-0.5 rounded-lg">
              {versions[active]?.session}
            </span>
            <span className="text-[9px] font-bold text-red-500 bg-white border border-red-100 px-2 py-0.5 rounded-lg">
              {versions[active]?.foodType}
            </span>
            {versions[active]?.version === versions[0]?.version && (
              <span className="text-[9px] font-extrabold uppercase tracking-wide bg-red-500 text-white px-2 py-0.5 rounded-full">Latest</span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   FOOD DETAIL BODY
═══════════════════════════════════════════════════════ */
type FoodDetailBodyProps = {
  v             : FoodVersion;
  versionKey    : string;
  onDeleteSingle: () => void;
  onDeleteAll   : () => void;
  onEdit        : () => void;
};

const FoodDetailBody = ({ v, versionKey, onDeleteSingle, onDeleteAll, onEdit }: FoodDetailBodyProps) => {
  const ft         = FOOD_TYPE[v.foodType] ?? FOOD_TYPE["Both"];
  const sess       = SESSION[v.session]    ?? { icon: "🗓", color: "text-gray-600" };
  const filledMenu = v.menu?.filter((c) => c.items?.some((i) => i.trim())) ?? [];
  const filledVeg  = v.vegetables?.filter((x) => x.name?.trim()) ?? [];
  const filledVend = v.vendors?.filter((x) => x.name?.trim()) ?? [];

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  /* ─────────────────────────────────────────────────────
     handlePrintAll — defined here so it has access to
     v, filledMenu, filledVeg, filledVend
  ───────────────────────────────────────────────────── */
  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // ── Menu rows ──
    const menuRows = filledMenu
      .map((cat) => {
        const items = cat.items.filter((i) => i.trim());
        if (!items.length) return "";
        return items
          .map(
            (item, idx) => `
            <tr>
              ${idx === 0
                ? `<td rowspan="${items.length}" class="cat">${cat.category}</td>`
                : ""}
              <td>${item}</td>
            </tr>`
          )
          .join("");
      })
      .join("");

    // ── Vegetable rows ──
    const vegRows = filledVeg
      .map(
        (veg, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${veg.name}</td>
          <td>${veg.qty || "—"}</td>
          <td>${veg.unit || "—"}</td>
        </tr>`
      )
      .join("");

    // ── Vendor rows ──
    const vendorRows = filledVend
      .map(
        (ven, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${ven.role || "—"}</td>
          <td>${ven.name}</td>
          <td>${ven.phone}</td>
        </tr>`
      )
      .join("");

    const baseUrl = window.location.origin;

    printWindow.document.write(`
      <html>
      <head>
        <title>Full Booking — ${v.event?.nameEnglish || "Event"}</title>
        <meta charset="UTF-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; color: #111; }

          /* ── Navbar ── */
          .navbar { width: 100%; margin-bottom: 0; }
          .navbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
          .navbar-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
          .navbar-left img { width: 90px; height: auto; object-fit: contain; display: block; }
          .navbar-left p { font-size: 10px; letter-spacing: 0.12em; color: #444; margin-top: 3px; }
          .navbar-center { flex: 1; text-align: center; min-width: 0; }
          .navbar-center h1 { font-size: 26px; font-weight: 800; color: #15803d; line-height: 1.15; }
          .navbar-center h1 sup { font-size: 12px; font-weight: 600; }
          .navbar-center .address { font-size: 12px; color: #444; margin-top: 2px; }
          .navbar-center .phones  { font-size: 13px; font-weight: 700; color: #111; margin-top: 2px; }
          .navbar-center .socials { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 5px; flex-wrap: wrap; }
          .navbar-center .socials a { font-size: 11px; color: #333; text-decoration: none; display: flex; align-items: center; gap: 4px; }
          .social-icon { width: 14px; height: 14px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
          .social-icon.fb { background: #1877f2; }
          .social-icon.ig { background: linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); }
          .social-icon.em { background: #ea4335; }
          .navbar-center .tagline { font-size: 11.5px; font-weight: 700; color: #15803d; margin-top: 5px; }
          .navbar-right { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
          .navbar-right img { width: 70px; height: auto; object-fit: contain; display: block; }
          .navbar-bar { width: 100%; height: 7px; background: #15803d; margin-top: 10px; }

          /* ── Event meta bar ── */
          .meta-bar { width: 100%; background: #f0fdf4; border-top: 1px solid #bbf7d0; border-bottom: 2px solid #15803d; padding: 7px 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .meta-bar-left { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #166534; font-weight: 700; }
          .meta-bar-left .dot { color: #4ade80; }
          .meta-bar-right { font-size: 11px; color: #6b7280; }

          /* ── Section headings ── */
          h2 { display: flex; align-items: center; gap: 8px; margin: 22px 0 8px; font-size: 14px; font-weight: 800; color: #15803d; text-transform: uppercase; letter-spacing: 0.08em; }
          h2::before { content: ''; display: inline-block; width: 4px; height: 16px; background: #15803d; border-radius: 2px; }

          /* ── Tables ── */
          table { width: 100%; border-collapse: collapse; margin-top: 6px; }
          th, td { border: 1px solid #000; padding: 8px 10px; font-size: 13px; text-align: left; }
          th { background: #15803d; color: #fff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .cat { background: #dcfce7; font-weight: 700; color: #14532d; vertical-align: top; }
          tbody tr:nth-child(even) td:not(.cat) { background: #f9fffe; }

          /* ── Footer ── */
          .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
          .footer-brand { font-weight: 700; color: #15803d; }

          @media print {
            body { padding: 0; }
            .navbar, .navbar-bar, .meta-bar, th, .cat { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 0.3in 0.3in; size: A4; }
            h2 { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>

        <!-- Navbar -->
        <div class="navbar">
          <div class="navbar-inner">
            <div class="navbar-left">
              <img src="${baseUrl}/images/owner.png" alt="Owner" />
              <p>EST - 1989</p>
            </div>
            <div class="navbar-center">
              <h1>MRS கேட்டரிங்ஸ் <sup>®</sup></h1>
              <p class="address">கோபி, ஈரோடு - 638456</p>
              <p class="phones">99655 55317 &nbsp;|&nbsp; 98427 55317</p>
              <div class="socials">
                <a href="#"><span class="social-icon fb">f</span>MRS Caterings</a>
                <a href="#"><span class="social-icon ig">i</span>mrs_caterings</a>
                <a href="#"><span class="social-icon em">✉</span>mrscatering1989@gmail.com</a>
              </div>
              <p class="tagline">Premium Wedding · Traditional Events · Outdoor Catering</p>
            </div>
            <div class="navbar-right">
              <img src="${baseUrl}/images/association.png" alt="Association" />
              <img src="${baseUrl}/images/whatsapp.png" alt="WhatsApp" />
            </div>
          </div>
          <div class="navbar-bar"></div>
        </div>

        <!-- Event meta bar -->
        <div class="meta-bar">
          <div class="meta-bar-left">
            <span>🍛</span>
            <span>${v.event?.nameEnglish || v.event?.nameTamil || "Event"}</span>
            ${v.location ? `<span class="dot">•</span><span>${v.location}</span>` : ""}
            ${v.session   ? `<span class="dot">•</span><span>${v.session}</span>` : ""}
            ${v.time      ? `<span class="dot">•</span><span>${v.time}</span>`    : ""}
          </div>
          <div class="meta-bar-right">
            Printed: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        <!-- Menu -->
        <h2>🍛 Menu</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Items</th></tr>
          </thead>
          <tbody>
            ${menuRows || "<tr><td colspan='2' style='text-align:center;color:#6b7280;'>No menu items.</td></tr>"}
          </tbody>
        </table>

        <!-- Vegetables -->
        <h2>🥦 Vegetables</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Name</th><th>Qty</th><th>Unit</th></tr>
          </thead>
          <tbody>
            ${vegRows || "<tr><td colspan='4' style='text-align:center;color:#6b7280;'>No vegetables listed.</td></tr>"}
          </tbody>
        </table>

        <!-- Vendors -->
        <h2>🧑‍🍳 Vendors</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Role</th><th>Name</th><th>Phone</th></tr>
          </thead>
          <tbody>
            ${vendorRows || "<tr><td colspan='4' style='text-align:center;color:#6b7280;'>No vendors listed.</td></tr>"}
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          <span class="footer-brand">MRS Catering</span>
          <span>Catering Management System · Full Booking · Save ${v.version}</span>
          <span>Thank you for choosing us 🙏</span>
        </div>

      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      <motion.div key={versionKey} variants={contentSwap} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-4">

        {/* ── HERO BANNER ── */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-400 to-rose-300" />
          <div className="absolute inset-0 opacity-[0.022] pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px,#e11d48 1px,transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative px-5 py-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <VegDot color={ft.dot} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Food Booking · LIST {v.version}</span>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900 leading-tight" style={{ letterSpacing: "-0.02em" }}>
                  {v.event?.nameEnglish || v.event?.nameTamil || "Unnamed Event"}
                </h2>
                {v.event?.nameTamil && v.event?.nameEnglish && (
                  <p className="text-sm text-gray-400 mt-0.5">{v.event.nameTamil}</p>
                )}
              </div>
              <div className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl border-2 gap-1 ${ft.bg} ${ft.border}`}>
                <span className="text-xl leading-none">{ft.emoji}</span>
                <span className={`text-[8px] font-extrabold uppercase tracking-wide ${ft.text} leading-none`}>
                  {v.foodType === "Both" ? "Mixed" : v.foodType}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {fmtDate(v.savedAt)}
              </span>
              {v.location && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {v.location}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold border ${ft.bg} ${ft.text} ${ft.border}`}>
                {ft.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { icon: sess.icon, label: "Session", val: v.session,                   valClass: sess.color,       mono: false },
                { icon: "⏰",      label: "Time",    val: v.time,                       valClass: "text-red-600",   mono: true  },
                { icon: "🍛",      label: "Menu",    val: `${filledMenu.length} cats`,  valClass: "text-gray-700",  mono: false },
              ].map(({ icon, label, val, valClass, mono }) => (
                <div key={label} className="flex flex-col gap-1 bg-gray-50/80 rounded-2xl px-3 py-2.5 border border-gray-100">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className={`text-xs font-bold ${valClass}`} style={mono ? { fontFamily: "'JetBrains Mono',monospace" } : {}}>
                      {val}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-gray-300 mb-2">Manage This Booking</p>
              {/* DeleteActions rendered as fixed floating buttons — onPrint wired to handlePrintAll */}
              <DeleteActions
                onDeleteSingle={onDeleteSingle}
                onDeleteAll={onDeleteAll}
                onEdit={onEdit}
                onPrint={handlePrintAll}
              />
            </div>
          </div>
        </div>

        {/* ── MENU ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <SectionHead icon="🍛" title="Menu Categories" count={filledMenu.length} />
          {filledMenu.length === 0 ? <Empty msg="No menu items." /> : (
            <motion.div className="px-4 py-3 flex flex-col gap-2" variants={stagger} initial="hidden" animate="show">
              {filledMenu.map((cat, idx) => {
                const isOpen = activeMenu === cat.id;
                const filled = cat.items.filter((i) => i.trim());
                return (
                  <motion.div key={cat.id} variants={scaleCard}
                    className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${isOpen ? "border-red-200 shadow-md shadow-red-50" : "border-gray-100 hover:border-red-100"}`}
                    onClick={() => setActiveMenu(isOpen ? null : cat.id)}
                  >
                    <div className={`flex items-center justify-between px-4 py-3 transition-colors duration-200 ${isOpen ? "bg-red-50" : "bg-gray-50/60 hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all"
                          style={isOpen ? { background: "#e11d48", color: "#fff" } : { background: "#fff", color: "#9ca3af", border: "1px solid #f3f4f6" }}>
                          {idx + 1}
                        </span>
                        <span className={`font-bold text-sm ${isOpen ? "text-red-700" : "text-gray-700"}`}>{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isOpen ? "bg-red-100 text-red-600" : "bg-white text-gray-400 border border-gray-100"}`}>
                          {filled.length}
                        </span>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }} className={isOpen ? "text-red-400" : "text-gray-300"}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </motion.span>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div key="items" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24, ease: "easeInOut" }} className="overflow-hidden">
                          <motion.ul className="px-5 py-3 flex flex-col gap-1.5 bg-white" variants={stagger} initial="hidden" animate="show">
                            {filled.map((itm, i) => (
                              <motion.li key={i} variants={slideRow} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-300 flex-shrink-0" />
                                <span className="text-sm text-gray-700 font-medium flex-1">{itm}</span>
                              </motion.li>
                            ))}
                          </motion.ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── VEGETABLES ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <SectionHead icon="🥦" title="Vegetables / Ingredients" count={filledVeg.length} />
          {filledVeg.length === 0 ? <Empty msg="No vegetables listed." /> : (
            <>
              <div className="grid grid-cols-12 px-5 py-2 bg-red-50/60 border-b border-red-50">
                <span className="col-span-6 text-[9px] font-extrabold uppercase tracking-[0.2em] text-red-300">Ingredient</span>
                <span className="col-span-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-red-300">Qty</span>
                <span className="col-span-3 text-[9px] font-extrabold uppercase tracking-[0.2em] text-red-300">Unit</span>
              </div>
              <motion.div className="divide-y divide-gray-50" variants={stagger} initial="hidden" animate="show">
                {filledVeg.map((veg, i) => (
                  <motion.div key={i} variants={slideRow} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-red-50/30 transition-colors group">
                    <div className="col-span-6 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-red-400 bg-red-50 border border-red-100 flex-shrink-0"
                        style={{ fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</span>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{veg.name}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-bold text-gray-800" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{veg.qty || "—"}</span>
                    </div>
                    <div className="col-span-3">
                      {veg.unit
                        ? <span className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-500 rounded-lg font-semibold">{veg.unit}</span>
                        : <span className="text-gray-300">—</span>}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <div className="px-5 py-2.5 bg-gray-50/80 border-t border-gray-50 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-semibold">{filledVeg.length} total ingredient{filledVeg.length !== 1 ? "s" : ""}</p>
                <div className="h-1 w-12 rounded-full bg-gradient-to-r from-red-200 to-rose-100" />
              </div>
            </>
          )}
        </div>

        {/* ── VENDORS ── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <SectionHead icon="🧑‍🍳" title="Vendors / Contacts" count={filledVend.length} />
          {filledVend.length === 0 ? <Empty msg="No vendors listed." /> : (
            <div className="px-4 py-3 flex flex-col gap-2.5">
              {filledVend.map((vend, i) => (
                <motion.div
                  key={i}
                  variants={scaleCard}
                  whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-red-50/40 hover:border-red-100 transition-all duration-200 group"
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0 shadow-md shadow-red-100"
                    style={{ background: "linear-gradient(135deg,#e11d48,#f43f5e)" }}
                  >
                    {(vend.name || vend.role || "?").charAt(0).toUpperCase()}
                  </div>

                  {/* Text block: Role → Vendor Name → Phone */}
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    {vend.role?.trim() && vend.role.trim() !== vend.name.trim() && (
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-red-400 leading-none truncate">
                        {vend.role}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-800 truncate group-hover:text-red-700 transition-colors leading-snug">
                      {vend.name || <span className="text-gray-300 font-normal italic">No name</span>}
                    </span>
                    {vend.phone?.trim() ? (
                      <a
                        href={`tel:${vend.phone}`}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        style={{ fontFamily: "'JetBrains Mono',monospace" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {vend.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">No phone listed</span>
                    )}
                  </div>

                  {/* Serial number */}
                  <span
                    className="text-[10px] font-extrabold text-gray-300 flex-shrink-0"
                    style={{ fontFamily: "'JetBrains Mono',monospace" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Call button */}
                  {vend.phone?.trim() && (
                    <a
                      href={`tel:${vend.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      title={`Call ${vend.name}`}
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      style={{ background: "linear-gradient(135deg,#e11d48,#f43f5e)" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5 2 2 0 0 1 3.6 2.87h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2 py-6">
          <div className="w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#e11d48"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>
          </div>
          <p className="text-[10px] text-gray-300 tracking-[0.22em] uppercase font-bold">
            Read-only · {ordinal(v.version)} Save · {v.eventId}
          </p>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════ */
type ModalState =
  | { open: false }
  | { open: true; mode: "single"; version: number }
  | { open: true; mode: "all" };

const AdminFoodView = () => {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = getAuth();
  const goBack = useBackNavigation({ role: auth?.role ?? "admin" });
  const [versions, setVersions] = useState<FoodVersion[]>([]);
  const [active,   setActive]   = useState<number>(0);
  const [ready,    setReady]    = useState(false);
  const [modal,    setModal]    = useState<ModalState>({ open: false });

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]") as FoodBookingPayload[];
      if (!Array.isArray(raw)) { setVersions([]); return; }

      const all      = normaliseVersions(raw);
      const filtered = all
        .filter((d) => String(d.eventId).trim() === String(id).trim())
        .sort((a, b) => b.version - a.version);

      setVersions(filtered);
      setActive(0);
    } catch { setVersions([]); }

    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [id]);

  const handleConfirm = () => {
    if (!modal.open || !id) return;
    if (modal.mode === "single") {
      deleteSingleVersion(id, modal.version, versions, setVersions, active, setActive);
    } else {
      deleteAllVersions(id, setVersions);
    }
    setModal({ open: false });
  };

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;

  if (!ready) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{FONTS}</style>
      <div className="flex flex-col items-center gap-3">
        <motion.div className="w-10 h-10 rounded-full border-[3px] border-red-100 border-t-red-500"
          animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} />
        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );

  if (versions.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{FONTS}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center bg-white rounded-3xl px-8 py-12 shadow-xl shadow-red-50 border border-red-50 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl mx-auto mb-5">🍽</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No Bookings Found</h2>
        <p className="text-sm text-gray-500 mb-5">No saved food versions found for this event.</p>
        <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg inline-block">
          ID: {id ?? "unknown"}
        </span>
      </motion.div>
    </div>
  );

  const current = versions[active];

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-thumb{background:#fecaca;border-radius:4px;}`}</style>

      {modal.open && (
        <DeleteConfirmModal
          mode={modal.mode}
          version={modal.mode === "single" ? modal.version : undefined}
          eventId={id ?? ""}
          onConfirm={handleConfirm}
          onCancel={() => setModal({ open: false })}
        />
      )}

      {/* ── TOP NAV ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shadow-red-50/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={goBack}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 text-gray-500 hover:text-red-500 transition-all flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 flex-1 min-w-0">
            <span className="hover:text-gray-600 cursor-pointer transition-colors" onClick={goBack}>Events</span>
            <span className="text-gray-200">›</span>
            <span className="text-red-500 font-semibold truncate">Food History</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg hidden sm:inline">
              #{id}
            </span>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-3xl mx-auto px-4 py-5 pb-24">
        <TopVersionTimeline
          versions={versions}
          active={active}
          onSelect={setActive}
        />
        <FoodDetailBody
          v={current}
          versionKey={`${current.eventId}-v${current.version}-${active}`}
          onDeleteSingle={() => setModal({ open: true, mode: "single", version: current.version })}
          onDeleteAll={() => setModal({ open: true, mode: "all" })}
          onEdit={() =>
            navigate(`/book-food/${current.eventId}`, {
              state: { editData: current },
            })
          }
        />
      </div>
    </div>
  );
};

export default AdminFoodView;
