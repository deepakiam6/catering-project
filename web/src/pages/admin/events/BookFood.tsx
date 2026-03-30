import Navbar from "../../../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  FaArrowLeft, FaPlus, FaTrash, FaEdit,
  FaCheck, FaTimes, FaPrint, FaSave
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";

type Vegetable = { name: string; qty: string; unit: string };
type Vendor    = { name: string; phone: string };

type EventType = {
  id: string;
  image?: string;
  nameTamil?: string;
  nameEnglish?: string;
  location?: string;
};

type MenuCategory = { id: string; category: string; items: string[] };

type EditState = {
  catId: string;
  type: "category" | "item";
  itemIndex?: number;
  value: string;
} | null;

type FocusedItem = { catId: string; itemIndex: number } | null;

/* ── Shared input class strings ─────────────────────────── */
const inputCls =
  "w-full border border-green-200 rounded-lg px-3 py-2 text-sm text-green-900 bg-white outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition";

const inputSmCls =
  "border border-green-200 rounded-lg px-2 py-1.5 text-sm text-green-900 bg-white outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition flex-1";

/* ── Reusable section heading ───────────────────────────── */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-green-800 mb-3 flex items-center gap-2">
    <span className="inline-block w-1 h-4 rounded-full bg-green-700" />
    {children}
  </p>
);

const BookFood = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [event, setEvent]       = useState<EventType | null>(null);
  const [location, setLocation] = useState("");

  const [session,  setSession]  = useState("");
  const [hour,     setHour]     = useState("12");
  const [minute,   setMinute]   = useState("00");
  const [ampm,     setAmpm]     = useState("AM");
  const [foodType, setFoodType] = useState("");

  const [menuCategories,     setMenuCategories]     = useState<MenuCategory[]>([]);
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [newCategoryName,    setNewCategoryName]    = useState("");
  const [editState,          setEditState]          = useState<EditState>(null);
  const [focusedItem,        setFocusedItem]        = useState<FocusedItem>(null);

  const [vegetables, setVegetables] = useState<Vegetable[]>([{ name: "", qty: "", unit: "kg" }]);
  const [vendors,    setVendors]    = useState<Vendor[]>([{ name: "", phone: "" }]);

  const [savedMenu,       setSavedMenu]       = useState<MenuCategory[] | null>(null);
  const [savedVegetables, setSavedVegetables] = useState<Vegetable[]   | null>(null);
  const [savedVendors,    setSavedVendors]    = useState<Vendor[]      | null>(null);

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const menuPrintRef     = useRef<HTMLDivElement>(null);
  const vegPrintRef      = useRef<HTMLDivElement>(null);
  const vendorPrintRef   = useRef<HTMLDivElement>(null);

  /* ════════════════════════════════════════════════════════
     ✅ FIXED: handleComplete — appends a NEW versioned entry
     instead of replacing the existing one.

     OLD (broken):
       const updated = existing.filter(e => e.eventId !== id);
       updated.push(fullData);   ← wipes history, no version

     NEW (correct):
       • Find the highest version already saved for this eventId
       • Assign version = maxVersion + 1
       • PUSH the new entry without removing old ones
       • All previous saves are kept → version history works
  ════════════════════════════════════════════════════════ */
  const handleComplete = () => {
    const LS_KEY = "bookFoodData";

    // 1. Read what's already stored (safe parse)
    let existing: any[] = [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      existing  = Array.isArray(JSON.parse(raw || "[]")) ? JSON.parse(raw || "[]") : [];
    } catch { existing = []; }

    // 2. Find the highest version number already saved for this eventId
    const previousSaves = existing.filter((e: any) => e.eventId === id);
    const maxVersion    = previousSaves.reduce(
      (mx: number, e: any) => Math.max(mx, typeof e.version === "number" ? e.version : 0),
      0
    );

    // 3. Build the new entry with auto-incremented version
    const newEntry = {
      eventId  : id,
      version  : maxVersion + 1,               // ✅ 1, 2, 3, 4 …
      savedAt  : new Date().toISOString(),      // ✅ ISO timestamp for correct sorting
      event,
      location,
      session,
      time     : displayTime,
      foodType,
      menu     : menuCategories,
      vegetables,
      vendors,
    };

    // 4. ✅ APPEND — never filter out / delete previous saves
    existing.push(newEntry);
    localStorage.setItem(LS_KEY, JSON.stringify(existing));

    setSavedMenu(menuCategories);
    setSavedVegetables(vegetables);
    setSavedVendors(vendors);

    navigate(`/book-food/${id}/saving`);
  };

  /* ── Load event ───────────────────────────────────────── */
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const found = storedEvents.find((e: EventType) => e.id === id);
    setEvent(found);
    if (found?.location) setLocation(found.location);
  }, [id]);

  useEffect(() => {
    if (showCategoryPrompt) setTimeout(() => categoryInputRef.current?.focus(), 50);
  }, [showCategoryPrompt]);

  const displayTime = `${hour}:${minute} ${ampm}`;

  /* ── Time helpers ─────────────────────────────────────── */
  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || (Number(val) >= 1 && Number(val) <= 12)) setHour(val);
  };
  const handleHourBlur = () => {
    const n = Number(hour);
    setHour((!n || n < 1) ? "12" : String(n).padStart(2, "0"));
  };
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || Number(val) <= 59) setMinute(val);
  };
  const handleMinuteBlur = () => setMinute(String(Number(minute) || 0).padStart(2, "0"));

  /* ── Menu helpers ─────────────────────────────────────── */
  const openCategoryPrompt  = () => { setNewCategoryName(""); setShowCategoryPrompt(true); };
  const confirmAddCategory  = () => {
    const t = newCategoryName.trim();
    if (!t) return;
    setMenuCategories(p => [...p, { id: Date.now().toString(), category: t, items: [""] }]);
    setShowCategoryPrompt(false);
    setNewCategoryName("");
    setSavedMenu(null);
  };
  const cancelCategoryPrompt = () => { setShowCategoryPrompt(false); setNewCategoryName(""); };

  const updateItem = (catId: string, idx: number, val: string) => {
    setMenuCategories(p => p.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.map((it, i) => i === idx ? val : it) }
    ));
    setSavedMenu(null);
  };

  const addItemToCategory = (catId: string) => {
    const cat = menuCategories.find(c => c.id === catId);
    if (cat) setFocusedItem({ catId, itemIndex: cat.items.length });
    setMenuCategories(p => p.map(c => c.id === catId ? { ...c, items: [...c.items, ""] } : c));
    setSavedMenu(null);
  };

  const removeItem = (catId: string, idx: number) => {
    setMenuCategories(p => p.map(c => {
      if (c.id !== catId) return c;
      const upd = c.items.filter((_, i) => i !== idx);
      return { ...c, items: upd.length ? upd : [""] };
    }));
    setFocusedItem(null);
    setSavedMenu(null);
  };

  const removeCategory = (catId: string) => {
    setMenuCategories(p => p.filter(c => c.id !== catId));
    if (editState?.catId === catId) setEditState(null);
    if (focusedItem?.catId === catId) setFocusedItem(null);
    setSavedMenu(null);
  };

  const startEditCategory = (cat: MenuCategory) =>
    setEditState({ catId: cat.id, type: "category", value: cat.category });
  const startEditItem = (catId: string, idx: number, val: string) =>
    setEditState({ catId, type: "item", itemIndex: idx, value: val });

  const confirmEdit = () => {
    if (!editState) return;
    if (editState.type === "category") {
      const t = editState.value.trim();
      if (!t) return;
      setMenuCategories(p => p.map(c => c.id === editState.catId ? { ...c, category: t } : c));
    } else if (editState.itemIndex !== undefined) {
      updateItem(editState.catId, editState.itemIndex, editState.value);
    }
    setEditState(null);
    setSavedMenu(null);
  };
  const cancelEdit = () => setEditState(null);

  const isEditingCat  = (catId: string) => editState?.catId === catId && editState.type === "category";
  const isEditingItem = (catId: string, idx: number) =>
    editState?.catId === catId && editState.type === "item" && editState.itemIndex === idx;

  /* ── Section save helpers ─────────────────────────────── */
  const saveMenu       = () => setSavedMenu(JSON.parse(JSON.stringify(menuCategories)));
  const saveVegetables = () => setSavedVegetables(JSON.parse(JSON.stringify(vegetables)));
  const saveVendors    = () => setSavedVendors(JSON.parse(JSON.stringify(vendors)));

  /* ── Print ────────────────────────────────────────────── */
  const handlePrint = (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    if (!ref.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const eventName = event?.nameTamil || event?.nameEnglish || "";
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${title}</title><meta charset="UTF-8"/>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',sans-serif;background:#fff;color:#1a3d2b;padding:32px}
        .print-header{margin-bottom:24px;border-bottom:2px solid #22894a;padding-bottom:12px}
        .print-header h1{font-size:22px;font-weight:700;color:#22894a}
        .print-header p{font-size:13px;color:#7aab8e;margin-top:3px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
        .cat-card{border:1.5px solid #c6e9d4;border-radius:12px;overflow:hidden}
        .cat-title{background:#e6f7ed;padding:8px 12px;font-size:15px;font-weight:700;border-bottom:1px solid #c6e9d4}
        .cat-items{padding:10px 12px}
        .cat-items p{font-size:13px;color:#3b5e4a;padding:3px 0;border-bottom:1px dashed #e6f7ed}
        .cat-items p:last-child{border-bottom:none}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th{background:#e6f7ed;color:#22894a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:8px 12px;text-align:left;border-bottom:2px solid #c6e9d4}
        td{padding:8px 12px;font-size:13px;color:#1a3d2b;border-bottom:1px solid #f0faf4}
        tr:nth-child(even) td{background:#f9fffe}
      </style></head><body>
      <div class="print-header"><h1>${title}</h1>
      <p>${eventName}${location ? " · " + location : ""}${session ? " · " + session : ""} ${displayTime}</p></div>
      ${ref.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  };

  /* ── Swipe back ───────────────────────────────────────── */
  const startX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { startX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => { if (e.changedTouches[0].clientX - startX.current > 100) navigate("/admin/dashboard"); };
  const handleMouseDown  = (e: React.MouseEvent) => { startX.current = e.clientX; };
  const handleMouseUp    = (e: React.MouseEvent) => { if (e.clientX - startX.current > 100) navigate("/admin/dashboard"); };

  /* ── Pill helpers ─────────────────────────────────────── */
  const sessionPillCls = (s: string) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${
      session === s
        ? "bg-green-700 text-white border-green-700"
        : "bg-white text-black border-green-200 hover:border-green-600 hover:text-green-700"
    }`;

  const foodTypePillCls = (t: string) => {
    if (foodType !== t) return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-white text-black border-green-200 hover:border-green-600 hover:text-green-700";
    if (t === "Non Veg") return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-red-500 text-white border-red-500";
    if (t === "Veg")     return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-green-700 text-white border-green-700";
    return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-amber-500 text-white border-amber-500";
  };

  /* ── Loading ──────────────────────────────────────────── */
  if (!event) return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-black font-medium">Loading event…</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div
      className="min-h-screen bg-green-50 font-sans"
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}   onMouseUp={handleMouseUp}
    >
      <Navbar />

      {/* ── SAVE BUTTON ── */}
      <button
        onClick={handleComplete}
        className={[
          "fixed bottom-0 left-0 right-0 z-50",
          "w-full rounded-none border-0",
          "bg-green-700",
          "text-white font-bold text-base tracking-wide",
          "py-4 px-6",
          "flex items-center justify-center gap-2",
          "shadow-[0_-4px_20px_rgba(34,137,74,.30)]",
          "active:brightness-90 transition",
          "sm:bottom-auto sm:top-5 sm:right-2 sm:left-auto",
          "sm:w-auto sm:rounded-full",
          "sm:py-2.5 sm:px-6 sm:text-sm",
          "sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl",
        ].join(" ")}
      >
        SAVE
      </button>

      {/* ── BACK — mobile ── */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="sm:hidden fixed top-35 left-2 w-5 h-5 rounded-full bg-green-700 text-white flex items-center justify-center text-xs shadow-md hover:bg-green-800 transition"
      >
        <FaArrowLeft />
      </button>

      {/* ── BACK — desktop ── */}
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="hidden sm:flex fixed top-10 left-6 z-50 w-11 h-11 rounded-full bg-green-700 text-white items-center justify-center text-base shadow-lg hover:bg-green-800 transition"
      >
        <FaArrowLeft />
      </button>

      {/* ── CATEGORY MODAL ── */}
      {showCategoryPrompt && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-green-200 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-1 rounded-full bg-green-700 mb-4" />
            <h3 className="text-base font-bold text-green-900 mb-1">New Menu Category</h3>
            <p className="text-xs text-black mb-4">Give this category a clear name before adding items.</p>
            <input
              ref={categoryInputRef}
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") confirmAddCategory(); if (e.key === "Escape") cancelCategoryPrompt(); }}
              placeholder="e.g. Starters, Main Course, Desserts…"
              className={inputCls + " mb-4"}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:bg-green-100 disabled:text-green-300 disabled:cursor-not-allowed transition"
              >
                Create Category
              </button>
              <button
                onClick={cancelCategoryPrompt}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-24 sm:pb-8 flex flex-col gap-5">

        {/* EVENT INFO */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Info</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Mahal Name", val: event.nameTamil || event.nameEnglish },
              { label: "Location",   val: location || "—" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">{label}</p>
                <p className="text-base font-bold text-green-900 leading-snug">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EVENT DETAILS */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Details</SectionHeading>
          <div className="flex flex-col gap-5">

            {/* Session */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">Session</span>
              <div className="flex flex-wrap gap-2">
                {["Morning", "Afternoon", "Evening", "Night"].map(s => (
                  <button key={s} onClick={() => setSession(s)} className={sessionPillCls(s)}>{s}</button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">Time</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text" inputMode="numeric" value={hour}
                  onChange={handleHourChange} onBlur={handleHourBlur}
                  maxLength={2} placeholder="12"
                  className="w-14 border border-green-200 rounded-lg px-1 py-2 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                />
                <span className="text-green-600 text-xl font-black">:</span>
                <input
                  type="text" inputMode="numeric" value={minute}
                  onChange={handleMinuteChange} onBlur={handleMinuteBlur}
                  maxLength={2} placeholder="00"
                  className="w-14 border border-green-200 rounded-lg px-1 py-2 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                />
                <div className="flex border border-green-200 rounded-lg overflow-hidden">
                  {["AM", "PM"].map(a => (
                    <button
                      key={a} onClick={() => setAmpm(a)}
                      className={`px-3 py-2 text-xs font-bold transition ${
                        ampm === a ? "bg-green-700 text-white" : "bg-white text-black hover:bg-green-50"
                      }`}
                    >{a}</button>
                  ))}
                </div>
                <span className="hidden sm:inline-block bg-green-50 border border-green-200 text-black text-sm font-bold px-3 py-1.5 rounded-lg">
                  {displayTime}
                </span>
              </div>
              <span className="sm:hidden inline-block bg-green-50 border border-green-200 text-black text-xs font-semibold px-3 py-1 rounded-lg w-fit">
                {displayTime}
              </span>
            </div>

            {/* Food Type */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">Food Type</span>
              <div className="flex flex-wrap gap-2">
                {["Veg", "Non Veg", "Both"].map(t => (
                  <button key={t} onClick={() => setFoodType(t)} className={foodTypePillCls(t)}>{t}</button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* MENU SECTION */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-green-700">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-base tracking-wide">Menu List</h2>
              {menuCategories.length > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {menuCategories.length} {menuCategories.length === 1 ? "category" : "categories"}
                </span>
              )}
            </div>
            <button
              onClick={openCategoryPrompt}
              className="flex items-center gap-1 bg-white text-green-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-green-50 transition"
            >
              <FaPlus size={10} /> Add Category
            </button>
          </div>

          {menuCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-3xl mb-3">🍴</div>
              <p className="text-sm font-semibold text-green-700">No menu categories yet</p>
              <p className="text-xs text-black mt-1">Click <strong className="text-green-700">+ Add Category</strong> to start</p>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuCategories.map((cat, catIdx) => (
                <div key={cat.id} className="border border-green-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">

                  {/* category bar */}
                  <div className="bg-green-50 border-b border-green-100 px-3 py-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {catIdx + 1}
                    </span>
                    {isEditingCat(cat.id) ? (
                      <>
                        <input
                          autoFocus type="text"
                          value={editState!.value}
                          onChange={e => setEditState({ ...editState!, value: e.target.value })}
                          onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="flex-1 border border-green-600 rounded-lg px-2 py-1 text-sm font-semibold text-green-900 outline-none focus:ring-2 focus:ring-green-600/15"
                        />
                        <button onMouseDown={e => e.preventDefault()} onClick={confirmEdit} className="text-green-600 hover:text-green-800 flex items-center transition"><FaCheck /></button>
                        <button onMouseDown={e => e.preventDefault()} onClick={cancelEdit}  className="text-black hover:text-green-500 flex items-center transition"><FaTimes /></button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-bold text-green-900 truncate">{cat.category}</span>
                        <button onClick={() => startEditCategory(cat)} className="text-black hover:text-green-800 flex items-center transition"><FaEdit /></button>
                        <button onClick={() => removeCategory(cat.id)} className="text-red-400 hover:text-red-600 flex items-center transition"><MdDelete /></button>
                      </>
                    )}
                  </div>

                  {/* items */}
                  <div className="px-3 pt-3 pb-1 flex flex-col gap-1.5">
                    {cat.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-1.5 group">
                        <span className="text-[10px] text-black w-4 text-right flex-shrink-0 font-bold">{itemIdx + 1}.</span>
                        {isEditingItem(cat.id, itemIdx) ? (
                          <>
                            <input
                              autoFocus type="text"
                              value={editState!.value}
                              onChange={e => setEditState({ ...editState!, value: e.target.value })}
                              onKeyDown={e => { if (e.key === "Enter") confirmEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className={inputSmCls}
                            />
                            <button onMouseDown={e => e.preventDefault()} onClick={confirmEdit} className="text-green-600 hover:text-green-800 flex items-center text-xs transition"><FaCheck /></button>
                            <button onMouseDown={e => e.preventDefault()} onClick={cancelEdit}  className="text-black hover:text-green-500 flex items-center text-xs transition"><FaTimes /></button>
                          </>
                        ) : item === "" || (focusedItem?.catId === cat.id && focusedItem?.itemIndex === itemIdx) ? (
                          <>
                            <input
                              autoFocus={focusedItem?.catId === cat.id && focusedItem?.itemIndex === itemIdx}
                              type="text" value={item}
                              onChange={e => updateItem(cat.id, itemIdx, e.target.value)}
                              onFocus={() => setFocusedItem({ catId: cat.id, itemIndex: itemIdx })}
                              onBlur={() => setFocusedItem(null)}
                              placeholder={`Item ${itemIdx + 1}`}
                              className={inputSmCls}
                            />
                            {cat.items.length > 1 && (
                              <button onMouseDown={e => e.preventDefault()} onClick={() => removeItem(cat.id, itemIdx)} className="text-red-400 hover:text-red-600 flex items-center text-xs transition"><FaTrash /></button>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-green-900 truncate">{item}</span>
                            <button onClick={() => startEditItem(cat.id, itemIdx, item)} className="opacity-0 group-hover:opacity-100 text-black hover:text-green-800 flex items-center text-xs transition"><FaEdit /></button>
                            <button onClick={() => removeItem(cat.id, itemIdx)}          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 flex items-center text-xs transition"><FaTrash /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* add item */}
                  <div className="px-3 py-2">
                    <button
                      onClick={() => addItemToCategory(cat.id)}
                      className="w-full py-1.5 border-2 border-dashed border-green-200 rounded-xl text-black text-xs font-semibold flex items-center justify-center gap-1 hover:border-green-700 hover:text-green-700 transition"
                    >
                      <FaPlus size={9} /> Add Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {menuCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end px-5 py-3 border-t border-green-100">
              {savedMenu && (
                <button onClick={() => handlePrint(menuPrintRef, "Menu List")} className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition">
                  <FaPrint /> Print Menu
                </button>
              )}
              <button onClick={saveMenu} className="flex items-center gap-1.5 bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-800 transition">
                <FaSave /> Save Menu
              </button>
            </div>
          )}
        </div>

        {/* MENU PRINT PREVIEW */}
        {savedMenu && savedMenu.length > 0 && (
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Menu Preview</SectionHeading>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">Saved ✓</span>
            </div>
            <div ref={menuPrintRef}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedMenu.map(cat => (
                  <div key={cat.id} className="border border-green-100 rounded-xl overflow-hidden">
                    <div className="bg-green-50 border-b border-green-100 px-3 py-2 text-sm font-bold text-green-900">{cat.category}</div>
                    <div className="px-3 py-2 flex flex-col gap-1.5">
                      {cat.items.filter(i => i.trim()).map((item, idx) => (
                        <p key={idx} className="text-sm text-green-700 flex items-center gap-1.5">
                          <span className="text-green-600 font-bold">•</span> {item}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VEGETABLE SECTION */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-green-700">
            <h2 className="text-white font-bold text-base tracking-wide">Vegetable List</h2>
          </div>

          <div className="p-5 flex flex-col gap-2">
            <div className="hidden sm:grid grid-cols-3 gap-2 mb-1">
              {["Vegetable Name", "Quantity", "Unit"].map(l => (
                <span key={l} className="text-[10px] font-bold uppercase tracking-widest text-black">{l}</span>
              ))}
            </div>

            {vegetables.map((veg, i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input value={veg.name} onChange={e => { const v=[...vegetables]; v[i].name=e.target.value; setVegetables(v); setSavedVegetables(null); }} placeholder="Vegetable name" className={inputCls} />
                <input value={veg.qty}  onChange={e => { const v=[...vegetables]; v[i].qty=e.target.value;  setVegetables(v); setSavedVegetables(null); }} placeholder="Qty"            className={inputCls} />
                <select value={veg.unit} onChange={e => { const v=[...vegetables]; v[i].unit=e.target.value; setVegetables(v); setSavedVegetables(null); }} className={inputCls}>
                  <option>kg</option><option>gm</option><option>ltrs</option><option>nos</option>
                </select>
              </div>
            ))}

            <button
              onClick={() => { setVegetables([...vegetables, { name:"", qty:"", unit:"kg" }]); setSavedVegetables(null); }}
              className="mt-1 flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-lg hover:border-green-700 hover:text-green-800 transition w-fit"
            >
              <FaPlus size={10} /> Add Vegetable
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-end px-5 py-3 border-t border-green-100">
            {savedVegetables && (
              <button onClick={() => handlePrint(vegPrintRef, "Vegetable List")} className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition">
                <FaPrint /> Print List
              </button>
            )}
            <button onClick={saveVegetables} className="flex items-center gap-1.5 bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-800 transition">
              <FaSave /> Save Vegetables
            </button>
          </div>
        </div>

        {/* VEGETABLE PRINT PREVIEW */}
        {savedVegetables && savedVegetables.filter(v => v.name.trim()).length > 0 && (
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Vegetable Preview</SectionHeading>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">Saved ✓</span>
            </div>
            <div ref={vegPrintRef}>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-green-50">
                  {["#","Vegetable","Quantity","Unit"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-black text-xs font-bold uppercase tracking-wider border-b border-green-100">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {savedVegetables.filter(v => v.name.trim()).map((veg, i) => (
                    <tr key={i} className="border-b border-green-50 even:bg-green-50/40">
                      <td className="px-4 py-2 text-black font-bold w-10">{i+1}</td>
                      <td className="px-4 py-2 text-green-900">{veg.name}</td>
                      <td className="px-4 py-2 text-green-800">{veg.qty || "—"}</td>
                      <td className="px-4 py-2 text-green-800">{veg.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VENDOR SECTION */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-green-700">
            <h2 className="text-white font-bold text-base tracking-wide">Vendor List</h2>
          </div>

          <div className="p-5 flex flex-col gap-2">
            <div className="hidden sm:grid grid-cols-2 gap-2 mb-1">
              {["Vendor Name","Phone Number"].map(l => (
                <span key={l} className="text-[10px] font-bold uppercase tracking-widest text-black">{l}</span>
              ))}
            </div>

            {vendors.map((v, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={v.name}  onChange={e => { const a=[...vendors]; a[i].name=e.target.value;  setVendors(a); setSavedVendors(null); }} placeholder="Vendor name"   className={inputCls} />
                <input value={v.phone} onChange={e => { const a=[...vendors]; a[i].phone=e.target.value; setVendors(a); setSavedVendors(null); }} placeholder="Phone number" className={inputCls} />
              </div>
            ))}

            <button
              onClick={() => { setVendors([...vendors, { name:"", phone:"" }]); setSavedVendors(null); }}
              className="mt-1 flex items-center gap-1.5 bg-white border border-green-200 text-green-700 text-sm font-semibold px-4 py-2 rounded-lg hover:border-green-700 hover:text-green-800 transition w-fit"
            >
              <FaPlus size={10} /> Add Vendor
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-end px-5 py-3 border-t border-green-100">
            {savedVendors && (
              <button onClick={() => handlePrint(vendorPrintRef, "Vendor List")} className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-100 transition">
                <FaPrint /> Print List
              </button>
            )}
            <button onClick={saveVendors} className="flex items-center gap-1.5 bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-800 transition">
              <FaSave /> Save Vendors
            </button>
          </div>
        </div>

        {/* VENDOR PRINT PREVIEW */}
        {savedVendors && savedVendors.filter(v => v.name.trim()).length > 0 && (
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionHeading>Vendor Preview</SectionHeading>
              <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">Saved ✓</span>
            </div>
            <div ref={vendorPrintRef}>
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-green-50">
                  {["#","Vendor Name","Phone"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-black text-xs font-bold uppercase tracking-wider border-b border-green-100">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {savedVendors.filter(v => v.name.trim()).map((v, i) => (
                    <tr key={i} className="border-b border-green-50 even:bg-green-50/40">
                      <td className="px-4 py-2 text-black font-bold w-10">{i+1}</td>
                      <td className="px-4 py-2 text-green-900">{v.name}</td>
                      <td className="px-4 py-2 text-green-800">{v.phone || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
};

export default BookFood;