/**
 * AdminFoodView.tsx
 *
 * ─── ROOT CAUSE FIX ───────────────────────────────────────────────────────────
 * The page was showing "total 1" even when multiple saves existed because:
 *
 *   1. Saves were stored WITHOUT a `version` field  →  every entry had version=undefined
 *   2. Saves REPLACED the existing entry instead of appending a new one
 *   3. The filter `all.filter(d => d.eventId === id)` returned many objects but
 *      `.sort((a,b) => b.version - a.version)` produced NaN comparisons so
 *      deduplication/display collapsed to 1.
 *
 * ─── TWO-PART FIX ─────────────────────────────────────────────────────────────
 *   Part A  →  saveBookingVersion()  (exported helper — use this in your form)
 *              Automatically assigns version numbers and APPENDS without overwriting.
 *
 *   Part B  →  AdminFoodView normalises missing version fields at load time so
 *              even old data saved without versions still shows up correctly.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════ */
type MenuCategory = { id: string; category: string; items: string[] };
type Vegetable    = { name: string; qty: string; unit: string };
type Vendor       = { name: string; phone: string };

export type FoodBookingPayload = {
  eventId   : string;
  event?    : { nameTamil?: string; nameEnglish?: string };
  location? : string;
  session   : string;
  time      : string;
  foodType  : string;
  menu      : MenuCategory[];
  vegetables: Vegetable[];
  vendors   : Vendor[];
  // version + savedAt are assigned automatically by saveBookingVersion()
  version?  : number;
  savedAt?  : string | number;
};

type FoodVersion = FoodBookingPayload & {
  version: number;
  savedAt: string | number;
};

/* ═══════════════════════════════════════════════════════
   ✅  PART A — SAVE HELPER
   Import and call this from your booking / edit form
   instead of writing directly to localStorage.

   Usage in your form:
     import { saveBookingVersion } from "./AdminFoodView";
     ...
     saveBookingVersion(formData);   // that's it!
═══════════════════════════════════════════════════════ */
export const saveBookingVersion = (payload: FoodBookingPayload): FoodVersion => {
  const LS_KEY = "bookFoodData";

  // Read current list (safe parse)
  let all: FoodVersion[] = [];
  try {
    all = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!Array.isArray(all)) all = [];
  } catch { all = []; }

  // Find the highest version already saved for this eventId
  const existing = all.filter((d) => d.eventId === payload.eventId);
  const maxVersion = existing.reduce((mx, d) => Math.max(mx, d.version ?? 0), 0);

  // Build the new versioned entry
  const newEntry: FoodVersion = {
    ...payload,
    version: maxVersion + 1,           // always increments
    savedAt: new Date().toISOString(),  // ISO string — works with fmtDate()
  };

  // Append (never overwrite) and persist
  all.push(newEntry);
  localStorage.setItem(LS_KEY, JSON.stringify(all));

  return newEntry;
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
  show  : { opacity: 1, scale: 1,  transition: { duration: 0.35, ease: "easeOut" } },
};
const contentSwap: Variants = {
  hidden: { opacity: 0, y: 10 },
  show  : { opacity: 1, y: 0,  transition: { duration: 0.3,  ease: "easeOut" } },
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
const fmtShort = (ts: string | number): string => {
  try {
    const d = new Date(typeof ts === "number" ? ts : ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
  } catch { return "—"; }
};

/**
 * ✅  PART B — normalise old data that was saved WITHOUT version/savedAt fields.
 * Groups entries by eventId and assigns ascending version numbers so old saves
 * still show up correctly in the timeline.
 */
const normaliseVersions = (raw: FoodBookingPayload[]): FoodVersion[] => {
  // Group by eventId
  const groups: Record<string, FoodBookingPayload[]> = {};
  raw.forEach((d) => {
    if (!groups[d.eventId]) groups[d.eventId] = [];
    groups[d.eventId].push(d);
  });

  const result: FoodVersion[] = [];
  Object.values(groups).forEach((group) => {
    // Sort within group by savedAt ascending so version numbers make sense
    group.sort((a, b) => {
      const ta = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const tb = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return ta - tb;
    });
    group.forEach((entry, i) => {
      result.push({
        ...entry,
        // If version is missing or 0, assign positional index + 1
        version: entry.version && entry.version > 0 ? entry.version : i + 1,
        savedAt: entry.savedAt ?? new Date().toISOString(),
      });
    });
  });
  return result;
};

/* ═══════════════════════════════════════════════════════
   ATOMS
═══════════════════════════════════════════════════════ */
const VegDot = ({ color }: { color: string }) => (
  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border-2 flex-shrink-0" style={{ borderColor:color }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background:color }} />
  </span>
);

const SectionHead = ({ icon, title, count }: { icon:string; title:string; count?:number }) => (
  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
    <div className="w-8 h-8 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-base flex-shrink-0">{icon}</div>
    <h3 className="text-sm font-bold text-gray-800 flex-1">{title}</h3>
    {count !== undefined && (
      <span className="text-[11px] font-bold text-red-400 bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-full">{count}</span>
    )}
  </div>
);

const Empty = ({ msg }: { msg:string }) => (
  <div className="flex flex-col items-center gap-2 py-10">
    <span className="text-2xl opacity-20">—</span>
    <p className="text-xs text-gray-400">{msg}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════
   VERSION PILL
═══════════════════════════════════════════════════════ */
const VersionPill = ({ v, isActive, isLatest, onClick }:
  { v:FoodVersion; isActive:boolean; isLatest:boolean; onClick:()=>void }) => (
  <motion.button onClick={onClick} whileTap={{ scale:0.95 }}
    className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 cursor-pointer transition-all duration-200 min-w-[88px] relative ${
      isActive ? "border-red-400 bg-red-50 shadow-md shadow-red-100" : "border-gray-100 bg-white hover:border-red-200 hover:bg-red-50/40"
    }`}
  >
    {isLatest && (
      <span className="absolute -top-2 -right-1 text-[8px] font-extrabold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
        Latest
      </span>
    )}
    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive?"text-red-500":"text-gray-400"}`}>v{v.version}</span>
    <span className={`text-xs font-bold leading-tight text-center ${isActive?"text-red-700":"text-gray-600"}`}>{ordinal(v.version)} Save</span>
    <span className={`text-[9px] font-medium leading-none ${isActive?"text-red-400":"text-gray-400"}`}>{fmtShort(v.savedAt)}</span>
    {isActive && <motion.div layoutId="activePillDot" className="w-1.5 h-1.5 rounded-full bg-red-500 mt-0.5" />}
  </motion.button>
);

/* ═══════════════════════════════════════════════════════
   TIMELINE ITEM
═══════════════════════════════════════════════════════ */
const TimelineItem = ({ v, isActive, isLatest, isLast, onClick }:
  { v:FoodVersion; isActive:boolean; isLatest:boolean; isLast:boolean; onClick:()=>void }) => (
  <button onClick={onClick}
    className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
      isActive ? "bg-red-50 border-2 border-red-200 shadow-md shadow-red-50" : "bg-white border-2 border-transparent hover:bg-red-50/50 hover:border-red-100"
    }`}
  >
    {!isLast && <div className="absolute left-[27px] top-full h-1 w-0.5 bg-red-100 z-0" />}
    <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-extrabold text-xs transition-all duration-200 ${
      isActive ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200" : "bg-white border-gray-200 text-gray-400 group-hover:border-red-200"
    }`}>
      {v.version}
    </div>
    <div className="flex-1 min-w-0 pt-0.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm font-bold leading-tight ${isActive?"text-red-700":"text-gray-700"}`}>{ordinal(v.version)} Save</span>
        {isLatest && <span className="text-[9px] font-extrabold uppercase tracking-wide bg-red-500 text-white px-1.5 py-0.5 rounded-full">Latest</span>}
      </div>
      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{fmtDate(v.savedAt)}</p>
      <p className="text-[10px] text-gray-300 mt-0.5">{v.session} · {v.foodType}</p>
    </div>
  </button>
);

/* ═══════════════════════════════════════════════════════
   FOOD DETAIL BODY
═══════════════════════════════════════════════════════ */
const FoodDetailBody = ({ v, versionKey }: { v:FoodVersion; versionKey:string }) => {
  const ft         = FOOD_TYPE[v.foodType] ?? FOOD_TYPE["Both"];
  const sess       = SESSION[v.session]    ?? { icon:"🗓", color:"text-gray-600" };
  const filledMenu = v.menu?.filter((c) => c.items?.some((i) => i.trim())) ?? [];
  const filledVeg  = v.vegetables?.filter((x) => x.name?.trim()) ?? [];
  const filledVend = v.vendors?.filter((x) => x.name?.trim()) ?? [];
  const [activeMenu, setActiveMenu] = useState<string|null>(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div key={versionKey} variants={contentSwap} initial="hidden" animate="show" exit="exit" className="flex flex-col gap-4">

        {/* ── HERO BANNER ── */}
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-400 to-rose-300" />
          <div className="absolute inset-0 opacity-[0.022] pointer-events-none"
            style={{ backgroundImage:"radial-gradient(circle at 1px 1px,#e11d48 1px,transparent 0)", backgroundSize:"24px 24px" }} />
          <div className="relative px-5 py-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <VegDot color={ft.dot} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Food Booking · Version {v.version}</span>
                </div>
                <h2 className="text-lg font-extrabold text-gray-900 leading-tight" style={{ letterSpacing:"-0.02em" }}>
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
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {fmtDate(v.savedAt)}
              </span>
              {v.location && (
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
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
                { icon:sess.icon, label:"Session", val:v.session,              valClass:sess.color,      mono:false },
                { icon:"⏰",      label:"Time",    val:v.time,                 valClass:"text-red-600",  mono:true  },
                { icon:"🍛",      label:"Menu",    val:`${filledMenu.length} cats`, valClass:"text-gray-700", mono:false },
              ].map(({ icon, label, val, valClass, mono }) => (
                <div key={label} className="flex flex-col gap-1 bg-gray-50/80 rounded-2xl px-3 py-2.5 border border-gray-100">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-gray-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className={`text-xs font-bold ${valClass}`} style={mono?{fontFamily:"'JetBrains Mono',monospace"}:{}}>
                      {val}
                    </span>
                  </div>
                </div>
              ))}
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
                    className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 ${isOpen?"border-red-200 shadow-md shadow-red-50":"border-gray-100 hover:border-red-100"}`}
                    onClick={() => setActiveMenu(isOpen ? null : cat.id)}
                  >
                    <div className={`flex items-center justify-between px-4 py-3 transition-colors duration-200 ${isOpen?"bg-red-50":"bg-gray-50/60 hover:bg-gray-50"}`}>
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all"
                          style={isOpen?{background:"#e11d48",color:"#fff"}:{background:"#fff",color:"#9ca3af",border:"1px solid #f3f4f6"}}>
                          {idx + 1}
                        </span>
                        <span className={`font-bold text-sm ${isOpen?"text-red-700":"text-gray-700"}`}>{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${isOpen?"bg-red-100 text-red-600":"bg-white text-gray-400 border border-gray-100"}`}>
                          {filled.length}
                        </span>
                        <motion.span animate={{ rotate:isOpen?180:0 }} transition={{ duration:0.22 }} className={isOpen?"text-red-400":"text-gray-300"}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </motion.span>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div key="items" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                          exit={{height:0,opacity:0}} transition={{duration:0.24,ease:"easeInOut"}} className="overflow-hidden">
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
                        style={{fontFamily:"'JetBrains Mono',monospace"}}>{i+1}</span>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{veg.name}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="text-sm font-bold text-gray-800" style={{fontFamily:"'JetBrains Mono',monospace"}}>{veg.qty||"—"}</span>
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
                <p className="text-[10px] text-gray-400 font-semibold">{filledVeg.length} total ingredient{filledVeg.length!==1?"s":""}</p>
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
                <motion.div key={i} variants={scaleCard} whileHover={{scale:1.01,transition:{duration:0.15}}}
                  className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-red-50/40 hover:border-red-100 transition-all duration-200 group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0 shadow-md shadow-red-100"
                    style={{background:"linear-gradient(135deg,#e11d48,#f43f5e)"}}>
                    {vend.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-800 truncate group-hover:text-red-700 transition-colors">{vend.name}</span>
                    {vend.phone
                      ? <a href={`tel:${vend.phone}`} className="text-xs text-gray-400 hover:text-red-500 transition-colors mt-0.5"
                          style={{fontFamily:"'JetBrains Mono',monospace"}} onClick={(e)=>e.stopPropagation()}>{vend.phone}</a>
                      : <span className="text-xs text-gray-300 mt-0.5">No phone listed</span>}
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-300 flex-shrink-0" style={{fontFamily:"'JetBrains Mono',monospace"}}>
                    {String(i+1).padStart(2,"0")}
                  </span>
                  {vend.phone && (
                    <a href={`tel:${vend.phone}`} onClick={(e)=>e.stopPropagation()} title={`Call ${vend.name}`}
                      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                      style={{background:"linear-gradient(135deg,#e11d48,#f43f5e)"}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6 19.79 19.79 0 0 1 1.61 5 2 2 0 0 1 3.6 2.87h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#e11d48"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
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
const AdminFoodView = () => {
  const { id }    = useParams<{ id:string }>();
  const navigate  = useNavigate();
  const [versions,  setVersions] = useState<FoodVersion[]>([]);
  const [active,    setActive]   = useState<number>(0);
  const [ready,     setReady]    = useState(false);
  const pillsRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("bookFoodData") || "[]") as FoodBookingPayload[];
      if (!Array.isArray(raw)) { setVersions([]); return; }

      // ✅ normalise first so missing version fields are handled
      const all      = normaliseVersions(raw);
      const filtered = all
        .filter((d) => d.eventId === id)
        .sort((a, b) => b.version - a.version); // latest first

      setVersions(filtered);
      setActive(0);
    } catch { setVersions([]); }

    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [id]);

  useEffect(() => {
    if (!pillsRef.current) return;
    const pill = pillsRef.current.children[active] as HTMLElement|null;
    pill?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [active]);

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');`;

  if (!ready) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <div className="flex flex-col items-center gap-3">
        <motion.div className="w-10 h-10 rounded-full border-[3px] border-red-100 border-t-red-500"
          animate={{rotate:360}} transition={{repeat:Infinity,duration:0.75,ease:"linear"}}/>
        <p className="text-xs font-semibold text-gray-400 tracking-widest uppercase">Loading</p>
      </div>
    </div>
  );

  if (versions.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{FONTS}</style>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}
        className="text-center bg-white rounded-3xl px-8 py-12 shadow-xl shadow-red-50 border border-red-50 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-3xl mx-auto mb-5">🍽</div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No Bookings Found</h2>
        <p className="text-sm text-gray-500 mb-5">No saved food versions found for this event.</p>
        <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg inline-block">ID: {id ?? "unknown"}</span>
      </motion.div>
    </div>
  );

  const current = versions[active];
  const latest  = versions[0];

  return (
    <div className="min-h-screen bg-[#fafafa]" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{`${FONTS} *,*::before,*::after{box-sizing:border-box;} ::-webkit-scrollbar{width:4px;height:4px;} ::-webkit-scrollbar-thumb{background:#fecaca;border-radius:4px;}`}</style>

      {/* STICKY NAV */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm shadow-red-50/60">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 text-gray-500 hover:text-red-500 transition-all flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 flex-1 min-w-0">
            <span className="hover:text-gray-600 cursor-pointer transition-colors" onClick={()=>navigate(-1)}>Events</span>
            <span className="text-gray-200">›</span>
            <span className="text-red-500 font-semibold truncate">Food History</span>
          </div>
          {/* ✅ Shows real count now */}
          <span className="flex-shrink-0 text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full">
            {versions.length} {versions.length === 1 ? "version" : "versions"}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5 pb-24">

        {/* MOBILE */}
        <div className="lg:hidden mb-5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-extrabold text-gray-900" style={{letterSpacing:"-0.02em"}}>Version History</h1>
            <span className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg truncate max-w-[120px]">#{id}</span>
          </div>
          <div ref={pillsRef} className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
            {versions.map((v, idx) => (
              <VersionPill key={`${v.eventId}-v${v.version}-${idx}`}
                v={v} isActive={active===idx} isLatest={v.version===latest.version} onClick={()=>setActive(idx)} />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={`meta-${active}`} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.22}}
              className="mt-3 flex items-center gap-3 px-4 py-2.5 bg-red-50 border border-red-100 rounded-2xl">
              <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-700">{ordinal(current.version)} Save — Version {current.version}</p>
                <p className="text-[11px] text-red-400 truncate">{fmtDate(current.savedAt)}</p>
              </div>
              {current.version === latest.version && (
                <span className="flex-shrink-0 text-[9px] font-extrabold uppercase tracking-wide bg-red-500 text-white px-2 py-0.5 rounded-full">Latest</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:flex gap-6 items-start">
          <div className="w-72 flex-shrink-0 sticky top-20 self-start">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-400 mb-1">Event Booking</p>
                <h2 className="text-sm font-extrabold text-gray-900 leading-tight" style={{letterSpacing:"-0.01em"}}>Version History</h2>
                <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">#{id}</p>
              </div>
              <div className="grid grid-cols-2 border-b border-gray-50">
                <div className="px-4 py-3 border-r border-gray-50">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">Total</p>
                  <p className="text-2xl font-extrabold text-red-500 leading-tight">{versions.length}</p>
                  <p className="text-[10px] text-gray-400">saves</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400">Latest</p>
                  <p className="text-2xl font-extrabold text-gray-800 leading-tight">v{latest.version}</p>
                  <p className="text-[10px] text-gray-400">{fmtShort(latest.savedAt)}</p>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-1 max-h-[62vh] overflow-y-auto">
                {versions.map((v, idx) => (
                  <TimelineItem key={`${v.eventId}-v${v.version}-${idx}`}
                    v={v} isActive={active===idx} isLatest={v.version===latest.version}
                    isLast={idx===versions.length-1} onClick={()=>setActive(idx)} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <FoodDetailBody v={current} versionKey={`${current.eventId}-v${current.version}-${active}`} />
          </div>
        </div>

        <div className="lg:hidden">
          <FoodDetailBody v={current} versionKey={`${current.eventId}-v${current.version}-${active}`} />
        </div>

      </div>
    </div>
  );
};

export default AdminFoodView;