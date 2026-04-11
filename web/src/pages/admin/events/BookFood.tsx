import Navbar from "../../../components/Navbar";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FoodMenu from "./FoodMenu";
import VegetableList, { Vegetable } from "./VegetableList";
import VendorList, { Vendor } from "./VendorList";
import { getAuth } from "../../../utils/auth";

/* Types */
type EventType = {
  id: string;
  image?: string;
  nameTamil?: string;
  nameEnglish?: string;
  location?: string;
};

type MenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type SaveState = "idle" | "saving" | "saved";

/* Shared section heading */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-green-800 mb-3 flex items-center gap-2">
    <span className="inline-block w-1 h-4 rounded-full bg-green-700" />
    {children}
  </p>
);



const BookFood = () => {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const locationState = useLocation();

  const auth = getAuth();

const goBack = () => {
  if (auth?.role === "admin") {
    navigate("/admin/dashboard");
  } else {
    navigate("/manager/dashboard");
  }
};
  const editData      = locationState.state?.editData;

  const [event, setEvent]   = useState<EventType | null>(null);
  const [location, setLocation] = useState("");

  const [session, setSession]   = useState("");
  const [hour, setHour]         = useState("12");
  const [minute, setMinute]     = useState("00");
  const [ampm, setAmpm]         = useState("AM");
  const [foodType, setFoodType] = useState("");

  const [vegetables, setVegetables]           = useState<Vegetable[]>([]);
  const [savedVegetables, setSavedVegetables] = useState<Vegetable[] | null>(null);

  const [vendors, setVendors]           = useState<Vendor[]>([]);
  const [savedVendors, setSavedVendors] = useState<Vendor[] | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");

  /* ── LOAD EVENT ── */
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const found = storedEvents.find((e: EventType) => e.id === id);
    setEvent(found || null);
    if (found?.location) setLocation(found.location);
  }, [id]);

  /* ── PREFILL FROM EDIT DATA ── */
  useEffect(() => {
    if (!editData) return;

    setSession(editData.session ?? "");
    setFoodType(editData.foodType ?? "");

    // Split time e.g. "08:30 AM"
    const parts     = (editData.time ?? "").split(" ");
    const timeParts = (parts[0] ?? "").split(":");
    setHour(timeParts[0] ?? "12");
    setMinute(timeParts[1] ?? "00");
    setAmpm(parts[1] ?? "AM");

    setVegetables(editData.vegetables || []);
    setSavedVegetables(editData.vegetables || []);

    setVendors(editData.vendors || []);
    setSavedVendors(editData.vendors || []);

    // Load menu into localStorage so FoodMenu auto-loads
    localStorage.setItem("food-menu", JSON.stringify(editData.menu || []));
  }, [editData]);

  const displayTime = `${hour}:${minute} ${ampm}`;

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || (Number(val) >= 1 && Number(val) <= 12)) setHour(val);
  };

  const handleHourBlur = () => {
    const n = Number(hour);
    setHour(!n || n < 1 ? "12" : String(n).padStart(2, "0"));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (val === "" || Number(val) <= 59) setMinute(val);
  };

  const handleMinuteBlur = () =>
    setMinute(String(Number(minute) || 0).padStart(2, "0"));

  const loadMenuFromStorage = (): MenuCategory[] => {
    try {
      const raw = localStorage.getItem("food-menu");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  /* ── SAVE  ── */

   
  const handleComplete = () => {
  if (saveState !== "idle") return;

  setSaveState("saving");

  setTimeout(() => {
    const LS_KEY = "bookFoodData";

    let existing: any[] = [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = JSON.parse(raw || "[]");
      existing = Array.isArray(parsed) ? parsed : [];
    } catch {
      existing = [];
    }

    const menu = loadMenuFromStorage();

    // 👉 EDIT MODE (UPDATE SAME VERSION)
    if (editData && editData.version) {
      const updated = existing.map((e: any) => {
        if (
          String(e.eventId).trim() === String(id).trim() &&
          Number(e.version) === Number(editData.version)
        ) {
          return {
            ...e,
            event,
            location,
            session,
            time: displayTime,
            foodType,
            menu,
            vegetables,
            vendors,
            savedAt: new Date().toISOString(),
          };
        }
        return e;
      });

      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }

    // 👉 CREATE NEW VERSION
    else {
      const previousSaves = existing.filter(
        (e: any) => e.eventId === id
      );

      const maxVersion = previousSaves.reduce(
        (mx: number, e: any) =>
          Math.max(mx, typeof e.version === "number" ? e.version : 0),
        0
      );

      const newEntry = {
        eventId: id,
        version: maxVersion + 1,
        savedAt: new Date().toISOString(),
        event,
        location,
        session,
        time: displayTime,
        foodType,
        menu,
        vegetables,
        vendors,
      };

      existing.push(newEntry);
      localStorage.setItem(LS_KEY, JSON.stringify(existing));
    }

    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, 600);
};

  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
  const diff = e.changedTouches[0].clientX - startX.current;

  if (diff > 100) {
    goBack(); // ✅ role-based navigation
  }
};

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
  const diff = e.clientX - startX.current;

  if (diff > 100) {
    goBack(); // ✅ role-based navigation
  }
};

  const sessionPillCls = (s: string) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition ${
      session === s
        ? "bg-green-700 text-white border-green-700"
        : "bg-white text-black border-green-200 hover:border-green-600 hover:text-green-700"
    }`;

  const foodTypePillCls = (t: string) => {
    if (foodType !== t) {
      return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-white text-black border-green-200 hover:border-green-600 hover:text-green-700";
    }
    if (t === "Non Veg") {
      return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-red-500 text-white border-red-500";
    }
    if (t === "Veg") {
      return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-green-700 text-white border-green-700";
    }
    return "px-4 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition bg-amber-500 text-white border-amber-500";
  };

  /* ── SAVE BUTTON CONTENT ── */
  const saveButtonContent = () => {
    if (saveState === "saving") {
      return (
        <>
          <svg
            className="animate-spin w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Saving...
        </>
      );
    }
    if (saveState === "saved") {
      return (
        <>
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Saved
        </>
      );
    }
    return "SAVE";
  };

  /* ── SAVE BUTTON CLASS ── */
  const saveButtonCls = [
    "fixed bottom-0 left-0 right-0 z-50",
    "w-full rounded-none border-0",
    "text-white font-bold text-base tracking-wide",
    "py-4 px-6",
    "flex items-center justify-center gap-2",
    "active:brightness-90 transition-all duration-300",
    "sm:bottom-auto sm:top-5 sm:right-2 sm:left-auto",
    "sm:w-auto sm:rounded-full",
    "sm:py-2.5 sm:px-6 sm:text-sm",
    "sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl",
    saveState === "idle"
      ? "bg-green-700 shadow-[0_-4px_20px_rgba(34,137,74,.30)] cursor-pointer"
      : saveState === "saving"
      ? "bg-green-600 shadow-[0_-4px_20px_rgba(34,137,74,.20)] cursor-not-allowed opacity-90"
      : "bg-green-500 shadow-[0_-4px_20px_rgba(34,137,74,.30)] cursor-default",
  ].join(" ");

  const eventName = event?.nameTamil || event?.nameEnglish || "";
  const printCtx  = { eventName, location, session, displayTime };

  if (!event) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-black font-medium">Loading event…</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-green-50 font-sans"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <Navbar />

      {/* ── SAVE BUTTON WITH MICRO-INTERACTION ── */}
      <button
        onClick={handleComplete}
        disabled={saveState !== "idle"}
        className={saveButtonCls}
      >
        {saveButtonContent()}
      </button>

      <button
        onClick={goBack}
        className="sm:hidden fixed top-35 left-2 w-5 h-5 rounded-full bg-green-700 text-white flex items-center justify-center text-xs shadow-md hover:bg-green-800 transition"
      >
        <FaArrowLeft />
      </button>

      <button
        onClick={goBack}
        className="hidden sm:flex fixed top-10 left-6 z-50 w-11 h-11 rounded-full bg-green-700 text-white items-center justify-center text-base shadow-lg hover:bg-green-800 transition"
      >
        <FaArrowLeft />
      </button>

      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-24 sm:pb-8 flex flex-col gap-5">

        {/* ── EDIT MODE BANNER ── */}
        {editData && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
            <span className="text-base">✏️</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-green-700">Editing Existing Booking</p>
              <p className="text-[10px] text-green-500">Changes will be saved as a new version.</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Info</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Mahal Name", val: event.nameTamil || event.nameEnglish },
              { label: "Location",   val: location || "—" },
            ].map(({ label, val }) => (
              <div
                key={label}
                className="bg-green-50 border border-green-100 rounded-xl px-4 py-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">
                  {label}
                </p>
                <p className="text-base font-bold text-green-900 leading-snug">
                  {val}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Details</SectionHeading>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">
                Session
              </span>
              <div className="flex flex-wrap gap-2">
                {["Morning", "Afternoon", "Evening", "Night"].map(s => (
                  <button
                    key={s}
                    onClick={() => setSession(s)}
                    className={sessionPillCls(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">
                Time
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  value={hour}
                  onChange={handleHourChange}
                  onBlur={handleHourBlur}
                  maxLength={2}
                  placeholder="12"
                  className="w-14 border border-green-200 rounded-lg px-1 py-2 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                />
                <span className="text-green-600 text-xl font-black">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={minute}
                  onChange={handleMinuteChange}
                  onBlur={handleMinuteBlur}
                  maxLength={2}
                  placeholder="00"
                  className="w-14 border border-green-200 rounded-lg px-1 py-2 text-center text-base font-bold text-green-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                />
                <div className="flex border border-green-200 rounded-lg overflow-hidden">
                  {["AM", "PM"].map(a => (
                    <button
                      key={a}
                      onClick={() => setAmpm(a)}
                      className={`px-3 py-2 text-xs font-bold transition ${
                        ampm === a
                          ? "bg-green-700 text-white"
                          : "bg-white text-black hover:bg-green-50"
                      }`}
                    >
                      {a}
                    </button>
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-sm font-bold text-black sm:w-28 flex-shrink-0">
                Food Type
              </span>
              <div className="flex flex-wrap gap-2">
                {["Veg", "Non Veg", "Both"].map(t => (
                  <button
                    key={t}
                    onClick={() => setFoodType(t)}
                    className={foodTypePillCls(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <FoodMenu
          eventName={eventName}
          location={location}
          session={session}
          displayTime={displayTime}
        />

        <VegetableList
          vegetables={vegetables}
          setVegetables={setVegetables}
          savedVegetables={savedVegetables}
          setSavedVegetables={setSavedVegetables}
          {...printCtx}
        />

        <VendorList
          vendors={vendors}
          setVendors={setVendors}
          savedVendors={savedVendors}
          setSavedVendors={setSavedVendors}
          {...printCtx}
        />

        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
};

export default BookFood;