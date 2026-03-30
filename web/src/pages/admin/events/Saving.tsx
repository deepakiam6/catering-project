import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";

type Vegetable = { name: string; qty: string; unit: string };
type Vendor    = { name: string; phone: string };

type MenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type SavedData = {
  eventId: string;
  event: any;
  location: string;
  session: string;
  time: string;
  foodType: string;
  menu: MenuCategory[];
  vegetables: Vegetable[];
  vendors: Vendor[];
};

type AssignmentMap = Record<string, number | null>;

interface GhostState {
  vendorName: string;
  x: number;
  y: number;
}

/* ─── Reusable card heading ──────────────────────────── */
const CardHeading = ({
  children,
  extra,
}: {
  children: React.ReactNode;
  extra?: React.ReactNode;
}) => (
  <div className="px-5 py-3 border-b border-green-100 flex items-center gap-2 flex-wrap">
    <span className="w-1 h-4 rounded-full bg-green-700 flex-shrink-0" />
    <h3 className="text-green-800 font-extrabold text-xs uppercase tracking-widest">
      {children}
    </h3>
    {extra}
  </div>
);

/* ─── Draggable Vendor Chip ──────────────────────────── */
const VendorChip = ({
  vendor,
  index,
  onDragStart,
  onTouchDragStart,
}: {
  vendor: Vendor;
  index: number;
  onDragStart: (idx: number) => void;
  onTouchDragStart: (idx: number, vendorName: string, x: number, y: number) => void;
}) => {
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    onTouchDragStart(index, vendor.name, touch.clientX, touch.clientY);
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onTouchStart={handleTouchStart}
      title={`Drag to assign ${vendor.name}`}
      className="flex items-center gap-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl cursor-grab active:cursor-grabbing hover:bg-green-100 hover:shadow-sm transition-all select-none touch-none"
    >
      <span className="w-9 h-9 rounded-full bg-green-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow">
        {vendor.name.charAt(0).toUpperCase()}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-sm font-semibold text-green-900 truncate">{vendor.name}</span>
        <span className="text-xs text-green-500">{vendor.phone || "—"}</span>
      </div>
      <span className="text-green-300 text-lg leading-none tracking-tighter">⠿</span>
    </div>
  );
};

/* ─── Item Drop Zone ─────────────────────────────────── */
const ItemDropZone = ({
  itemKey,
  label,
  assignedVendorIdx,
  vendors,
  onDrop,
  onRemove,
  isTouchOver,
}: {
  itemKey: string;
  label: string;
  assignedVendorIdx: number | null;
  vendors: Vendor[];
  onDrop: () => void;
  onRemove: () => void;
  isTouchOver: boolean;
}) => {
  const [mouseOver, setMouseOver] = useState(false);
  const over = mouseOver || isTouchOver;

  return (
    <div
      data-dropkey={itemKey}
      onDragOver={(e) => { e.preventDefault(); setMouseOver(true); }}
      onDragLeave={() => setMouseOver(false)}
      onDrop={() => { setMouseOver(false); onDrop(); }}
      className={`flex items-center justify-between gap-4 px-4 py-3 border-b border-green-100 last:border-b-0 flex-wrap transition-colors ${
        over ? "bg-green-100" : "bg-white hover:bg-green-50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-green-900 flex-1 min-w-0">
        <span className="text-green-500 text-xs flex-shrink-0">✦</span>
        {label}
      </span>

      <div className="flex-shrink-0 min-w-[160px]">
        {assignedVendorIdx !== null ? (
          <div className="flex items-center gap-2 px-2 py-1 bg-green-100 border border-green-300 rounded-full">
            <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {vendors[assignedVendorIdx].name.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-green-800 whitespace-nowrap">
              {vendors[assignedVendorIdx].name}
            </span>
            <button
              onClick={onRemove}
              className="text-red-400 hover:text-red-600 text-base leading-none px-0.5 opacity-70 hover:opacity-100 transition-all"
              title="Remove"
            >
              ×
            </button>
          </div>
        ) : (
          <div
            className={`flex items-center justify-center px-3 py-1.5 border-2 border-dashed rounded-xl text-xs transition-colors ${
              over
                ? "border-green-600 bg-green-50 text-green-700 font-semibold"
                : "border-green-200 text-green-400"
            }`}
          >
            {over ? "✓ Release to assign" : "⬇ Drop vendor here"}
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
const Saving = () => {
  const { id } = useParams();
  const [data,         setData]        = useState<SavedData | null>(null);
  const [assignments,  setAssignments] = useState<AssignmentMap>({});
  const [ghost,        setGhost]       = useState<GhostState | null>(null);
  const [touchOverKey, setTouchOverKey]= useState<string | null>(null);
  const [showSticky,   setShowSticky]  = useState(false);

  /*
   * Two separate refs:
   * - mobileVendorCardRef  → the in-flow vendor card shown on mobile
   *   This is what the IntersectionObserver watches to show/hide the
   *   sticky bottom bar. It is always rendered (not display:none) so
   *   the observer fires correctly.
   * - desktopVendorPanelRef → the sticky left panel shown on desktop
   *   (visually hidden on mobile via CSS, but still in the DOM)
   */
  const mobileVendorCardRef   = useRef<HTMLDivElement>(null);
  const desktopVendorPanelRef = useRef<HTMLDivElement>(null);

  const draggingVendorIdx = useRef<number | null>(null);
  const touchVendorIdx    = useRef<number | null>(null);
  const touchOverKeyRef   = useRef<string | null>(null);
  const isDragging        = useRef(false);

  /* ── Load data ── */
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookFoodData") || "[]");
    const found  = stored.find((item: SavedData) => item.eventId === id);
    if (found) setData(found);
  }, [id]);

  /* ── Keep touchOverKey ref in sync ── */
  useEffect(() => {
    touchOverKeyRef.current = touchOverKey;
  }, [touchOverKey]);

  /*
   * ── IntersectionObserver ──
   * Watches the MOBILE vendor card (always in DOM, even on desktop).
   * On desktop the card has height:0 / overflow:hidden via CSS so it
   * never intersects the viewport → showSticky would wrongly become
   * true. Guard against that by checking window width.
   */
  useEffect(() => {
    const el = mobileVendorCardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only activate the sticky bar on mobile viewports
        if (window.innerWidth < 640) {
          setShowSticky(!entry.isIntersecting);
        }
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  /* ── On resize to desktop, always hide sticky bar ── */
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) setShowSticky(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Non-passive touchmove ── */
  useEffect(() => {
    const handleMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      setGhost((g) => g ? { ...g, x: touch.clientX, y: touch.clientY } : null);

      const el   = document.elementFromPoint(touch.clientX, touch.clientY);
      const zone = el?.closest("[data-dropkey]") as HTMLElement | null;
      const key  = zone ? (zone.dataset.dropkey ?? null) : null;

      if (key !== touchOverKeyRef.current) {
        touchOverKeyRef.current = key;
        setTouchOverKey(key);
      }
    };

    document.addEventListener("touchmove", handleMove, { passive: false });
    return () => document.removeEventListener("touchmove", handleMove);
  }, []);

  /* ── touchend / touchcancel ── */
  useEffect(() => {
    const handleEnd = () => {
      if (!isDragging.current) return;

      const key = touchOverKeyRef.current;
      if (touchVendorIdx.current !== null && key !== null) {
        const vendorIdx = touchVendorIdx.current;
        setAssignments((prev) => ({ ...prev, [key]: vendorIdx }));
      }

      isDragging.current      = false;
      touchVendorIdx.current  = null;
      touchOverKeyRef.current = null;
      setGhost(null);
      setTouchOverKey(null);
    };

    document.addEventListener("touchend",    handleEnd);
    document.addEventListener("touchcancel", handleEnd);
    return () => {
      document.removeEventListener("touchend",    handleEnd);
      document.removeEventListener("touchcancel", handleEnd);
    };
  }, []);

  /* ── Mouse drag helpers ── */
  const assign = (key: string) => {
    if (draggingVendorIdx.current === null) return;
    setAssignments((prev) => ({ ...prev, [key]: draggingVendorIdx.current }));
    draggingVendorIdx.current = null;
  };

  const remove = (key: string) => {
    setAssignments((prev) => ({ ...prev, [key]: null }));
  };

  /* ── Touch drag start ── */
  const handleTouchDragStart = useCallback(
    (idx: number, vendorName: string, x: number, y: number) => {
      isDragging.current     = true;
      touchVendorIdx.current = idx;
      setGhost({ vendorName, x, y });
    },
    []
  );

  /* ── Empty state ── */
  if (!data) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">No Data Found</h2>
            <p className="text-green-500 text-sm">Please complete the booking first.</p>
          </div>
        </div>
      </>
    );
  }

  const allItems: { catId: string; category: string; itemIdx: number; item: string }[] = [];
  data.menu.forEach((cat) => {
    cat.items.filter((i) => i.trim()).forEach((item, idx) => {
      allItems.push({ catId: cat.id, category: cat.category, itemIdx: idx, item });
    });
  });

  const assignedCount = Object.values(assignments).filter((v) => v !== null).length;
  const vendorCount   = data.vendors.filter((v) => v.name.trim()).length;
  const activeVendors = data.vendors.filter((v) => v.name.trim());
  const progressPct   = allItems.length ? (assignedCount / allItems.length) * 100 : 0;

  /* ── Vendor chips renderer ── */
  const renderVendorChips = () =>
    activeVendors.map((vendor, idx) => (
      <VendorChip
        key={idx}
        vendor={vendor}
        index={idx}
        onDragStart={(i) => (draggingVendorIdx.current = i)}
        onTouchDragStart={handleTouchDragStart}
      />
    ));

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <Navbar />

      {/* ── Floating ghost chip (touch drag visual) ── */}
      {ghost && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: ghost.x - 60, top: ghost.y - 24 }}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded-xl shadow-2xl opacity-90 scale-105">
            <span className="w-7 h-7 rounded-full bg-white text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {ghost.vendorName.charAt(0).toUpperCase()}
            </span>
            <span className="text-sm font-semibold whitespace-nowrap">
              {ghost.vendorName}
            </span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MOBILE STICKY BOTTOM VENDOR BAR
          • Only visible on mobile (sm:hidden)
          • Slides up when mobileVendorCardRef
            scrolls out of the viewport
      ════════════════════════════════════════ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 sm:hidden transition-transform duration-300 ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="bg-white border-t-2 border-green-200 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
          <div className="flex items-center justify-between px-4 py-2 bg-green-700">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3 rounded-full bg-white/60" />
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">
                Vendors — drag onto items
              </span>
            </div>
            <span className="text-green-200 text-[10px]">
              {vendorCount} vendor{vendorCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto px-4 py-3 scrollbar-none">
            {activeVendors.map((vendor, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => (draggingVendorIdx.current = idx)}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleTouchDragStart(idx, vendor.name, touch.clientX, touch.clientY);
                }}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <span className="w-8 h-8 rounded-full bg-green-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow">
                  {vendor.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-green-900 whitespace-nowrap">
                    {vendor.name}
                  </span>
                  <span className="text-[10px] text-green-500">{vendor.phone || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════ */}
      <div className="min-h-screen bg-green-50">
        {/* pb-44 on mobile leaves room above the sticky bottom bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-44 sm:pb-16 flex flex-col gap-5">

          {/* ── PAGE HEADER ── */}
          <header className="relative overflow-hidden rounded-2xl bg-green-700 p-6 sm:p-8 shadow-xl">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white opacity-5 pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white opacity-5 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl drop-shadow">📋</span>
                <div>
                  <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight leading-tight">
                    FULL DETAILS
                  </h1>
                  <p className="text-green-200 text-sm mt-1">
                    {data.event?.nameTamil || data.event?.nameEnglish}
                    <span className="mx-2 opacity-50">·</span>
                    {data.location}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { num: allItems.length, label: "Items" },
                  { num: vendorCount,     label: "Vendors" },
                  { num: assignedCount,   label: "Assigned", accent: true },
                ].map(({ num, label, accent }) => (
                  <div
                    key={label}
                    className={`flex flex-col items-center px-4 py-2 rounded-full border backdrop-blur-sm min-w-[60px] ${
                      accent ? "bg-white/25 border-white/40" : "bg-white/15 border-white/25"
                    }`}
                  >
                    <span className="text-white font-bold text-lg leading-none">{num}</span>
                    <span className="text-green-200 text-[10px] uppercase tracking-wider mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>

          {/* ── EVENT INFO (full-width) ── */}
          <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
            <CardHeading>Event Info</CardHeading>
            <div className="px-5 py-2 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-dashed divide-green-100">
              {[
                { key: "Name",     val: data.event?.nameTamil || data.event?.nameEnglish },
                { key: "Location", val: data.location },
                { key: "Session",  val: data.session },
                { key: "Time",     val: data.time },
              ].map(({ key, val }) => (
                <div key={key} className="flex flex-col gap-0.5 px-4 py-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-green-600">{key}</span>
                  <span className="text-sm text-green-900">{val || "—"}</span>
                </div>
              ))}
              <div className="flex flex-col gap-0.5 px-4 py-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-green-600">Food</span>
                <span className="inline-block w-fit px-3 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold tracking-wide">
                  {data.foodType}
                </span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════
              LAYOUT WRAPPER
              Mobile  → flex-col  (vendor card on top, content below)
              Desktop → flex-row  (sticky vendor panel left, content right)
          ════════════════════════════════════════ */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">

            {/* ──────────────────────────────────────
                MOBILE VENDOR CARD
                Rendered in normal flow on mobile.
                Observed by IntersectionObserver.
                Hidden visually on desktop via
                max-h-0 / overflow-hidden so it
                still occupies the DOM (required for
                the observer) but takes no space.
            ────────────────────────────────────── */}
            <div
              ref={mobileVendorCardRef}
              className="w-full sm:max-h-0 sm:overflow-hidden sm:invisible sm:absolute"
            >
              <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                <CardHeading
                  extra={
                    <span className="text-[10px] italic text-green-400 ml-auto">
                      drag onto items below ↓
                    </span>
                  }
                >
                  Vendors
                </CardHeading>
                <div className="px-4 py-4 flex flex-col gap-2.5">
                  <p className="text-[10px] text-green-500 italic text-center">
                    📱 Press &amp; hold a vendor, then drag it onto an item below.
                    A vendor bar will also pin to the bottom as you scroll.
                  </p>
                  {vendorCount === 0 ? (
                    <p className="text-xs italic text-green-300 text-center py-4">No vendors added yet.</p>
                  ) : (
                    renderVendorChips()
                  )}
                </div>
              </div>
            </div>

            {/* ──────────────────────────────────────
                DESKTOP STICKY VENDOR PANEL
                Hidden on mobile (hidden sm:block).
                sticky top-4 keeps it in view while
                scrolling through the long menu list.
            ────────────────────────────────────── */}
            <div
              ref={desktopVendorPanelRef}
              className="hidden sm:block w-64 flex-shrink-0 sticky top-4 self-start"
            >
              <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                <CardHeading
                  extra={
                    <span className="text-[10px] italic text-green-400 ml-auto">
                      drag onto items →
                    </span>
                  }
                >
                  Vendors
                </CardHeading>
                <div className="px-4 py-4 flex flex-col gap-2.5">
                  {vendorCount === 0 ? (
                    <p className="text-xs italic text-green-300 text-center py-4">No vendors added yet.</p>
                  ) : (
                    renderVendorChips()
                  )}
                </div>

                {/* Assignment progress bar */}
                {vendorCount > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-green-500 uppercase tracking-widest font-bold">
                        Progress
                      </span>
                      <span className="text-[10px] text-green-700 font-semibold">
                        {assignedCount} / {allItems.length}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-green-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ──────────────────────────────────────
                MAIN CONTENT COLUMN
                Full-width on mobile.
                flex-1 on desktop (fills remaining space).
            ────────────────────────────────────── */}
            <div className="w-full sm:flex-1 sm:min-w-0 flex flex-col gap-5">

              {/* ── MENU & VENDOR ASSIGNMENT ── */}
              <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                <CardHeading
                  extra={
                    <span className="text-[10px] italic text-green-400 ml-1">
                      drag a vendor onto each item
                    </span>
                  }
                >
                  Menu &amp; Vendor Assignment
                </CardHeading>

                <div className="p-4 flex flex-col gap-4">
                  {data.menu.map((cat) => {
                    const catItems = cat.items.filter((i) => i.trim());
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat.id} className="border border-green-100 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-700">
                          <span className="text-base">🍽</span>
                          <span className="text-white text-sm font-semibold flex-1">{cat.category}</span>
                          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                            {catItems.length} items
                          </span>
                        </div>
                        <div className="divide-y divide-green-50">
                          {catItems.map((item, idx) => {
                            const key = `${cat.id}::${idx}`;
                            return (
                              <ItemDropZone
                                key={key}
                                itemKey={key}
                                label={item}
                                assignedVendorIdx={
                                  assignments[key] !== undefined ? assignments[key] : null
                                }
                                vendors={data.vendors}
                                onDrop={() => assign(key)}
                                onRemove={() => remove(key)}
                                isTouchOver={touchOverKey === key}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── ASSIGNMENT SUMMARY TABLE ── */}
              {assignedCount > 0 && (
                <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeading>Assignment Summary</CardHeading>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-green-700">
                          {["Category", "Item", "Vendor", "Phone"].map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 text-white text-xs font-bold uppercase tracking-widest whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allItems.map(({ catId, category, itemIdx, item }) => {
                          const key  = `${catId}::${itemIdx}`;
                          const vIdx = assignments[key];
                          if (vIdx == null) return null;
                          const vendor = data.vendors[vIdx];
                          return (
                            <tr
                              key={key}
                              className="border-b border-green-50 even:bg-green-50/40 hover:bg-green-50 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold whitespace-nowrap">
                                  {category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-green-900">{item}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-green-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {vendor.name.charAt(0).toUpperCase()}
                                  </span>
                                  <span className="text-green-900 text-sm whitespace-nowrap">{vendor.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-green-500 text-xs tracking-wide whitespace-nowrap">
                                {vendor.phone || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── VEGETABLE LIST ── */}
              {data.vegetables.filter((v) => v.name.trim()).length > 0 && (
                <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeading>Vegetable List</CardHeading>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {data.vegetables
                      .filter((v) => v.name.trim())
                      .map((veg, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center gap-1.5 p-3 bg-green-50 border border-green-100 rounded-xl text-center hover:bg-green-100 hover:-translate-y-0.5 transition-all"
                        >
                          <span className="text-sm font-semibold text-green-900">{veg.name}</span>
                          <span className="text-xs text-green-500">
                            {veg.qty || "—"}{" "}
                            <em className="not-italic text-green-600 font-medium">{veg.unit}</em>
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            </div>{/* end main content column */}
          </div>{/* end layout wrapper */}

        </div>
      </div>
    </>
  );
};

export default Saving;