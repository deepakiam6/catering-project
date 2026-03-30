import Navbar from "../../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";

type EventType = {
  id: string;
  image?: string;
  nameEnglish?: string;
  fromDate: string;
  toDate?: string;
  location?: string;
  userId?: string;
  password?: string;
};

const tamilMonths: Record<string, string> = {
  "01": "தை", "02": "மாசி", "03": "பங்குனி", "04": "சித்திரை", "05": "வைகாசி",
  "06": "ஆனி", "07": "ஆடி", "08": "ஆவணி", "09": "புரட்டாசி", "10": "ஐப்பசி",
  "11": "கார்த்திகை", "12": "மார்கழி"
};

const englishMonths: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April", "05": "May",
  "06": "June", "07": "July", "08": "August", "09": "September", "10": "October",
  "11": "November", "12": "December"
};

// SVG circle progress for hold-to-delete
const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ── Icons ─────────────────────────────────────────────── */

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "#6b7280", flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ color: "#6b7280", flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Hold-to-Delete (mobile) ───────────────────────────── */
const HoldDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const HOLD_DURATION = 5000;

  const startHold = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    setHolding(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current!);
        setHolding(false);
        setProgress(0);
        onDelete();
      }
    }, 50);
  }, [onDelete]);

  const cancelHold = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHolding(false);
    setProgress(0);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  return (
    <button
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      onTouchCancel={cancelHold}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-48 right-2 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 shadow-md active:scale-95 transition-transform select-none"
      title="Hold 5s to delete"
      style={{ WebkitUserSelect: "none", touchAction: "none" }}
    >
      <svg width="40" height="40" className="absolute top-0 left-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        {holding && (
          <circle
            cx="20" cy="20" r={RADIUS}
            fill="none" stroke="white" strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        )}
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
};

/* ── Inline Confirm Delete (desktop) ───────────────────── */
const InlineDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        className="absolute top-2 right-2 flex items-center gap-1 bg-white border border-red-200 rounded-lg px-2 py-1 shadow-lg z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-gray-600 font-medium mr-1 whitespace-nowrap">Delete?</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md font-semibold transition-colors"
        >Yes</button>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md font-semibold transition-colors"
        >No</button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
      className="absolute top-48 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
    >
      Delete
    </button>
  );
};

/* ── Password Row with show/hide ───────────────────────── */
const PasswordRow = ({ password }: { password: string }) => {
  const [show, setShow] = useState(false);

  if (!password) {
    return (
      <div className="flex items-center gap-1.5">
        <LockIcon />
        <span className="text-xs text-gray-400">Password not set</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <LockIcon />
      <span className="text-xs text-gray-600 flex-1 font-mono tracking-wider">
        {show ? password : "•".repeat(password.length)}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(p => !p); }}
        title={show ? "Hide password" : "Show password"}
        className="flex items-center justify-center text-gray-400 hover:text-green-700 transition-colors p-0.5 rounded"
      >
        {show ? <EyeOffIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const openFoodView = (id: string) => navigate(`/admin/food-view/${id}`);

  const [events, setEvents] = useState<EventType[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const today = new Date();
    const arr: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toISOString().split("T")[0]);
    }
    setDates(arr);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("events");
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem("events", JSON.stringify(updated));
  };

  const openCreateEvent = () => navigate("/create-mahal");
  const openEditEvent = (id: string) => navigate(`/create-mahal/${id}`);
  const openFoodBooking = (id: string) => navigate(`/book-food/${id}`);

  const formatDates = (from: string, to?: string) => {
    const f = new Date(from).getDate();
    if (!to) return `${f}`;
    const t = new Date(to).getDate();
    return `${f}, ${t}`;
  };

  const getMonthLabel = (from: string, to?: string) => {
    const fm = from.split("-")[1];
    const fy = from.split("-")[0];
    const tm = to?.split("-")[1];
    const ty = to?.split("-")[0];
    if (!to || fm === tm) return `${tamilMonths[fm]} / ${englishMonths[fm]} - ${fy}`;
    return `${tamilMonths[fm]} → ${tamilMonths[tm!]} / ${englishMonths[fm]} → ${englishMonths[tm!]} - ${ty}`;
  };

  const filteredEvents =
    selectedDate === null
      ? events
      : events.filter(e => e.fromDate === selectedDate || e.toDate === selectedDate);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      {/* DATE SELECTOR */}
      <div className="max-w-6xl mx-auto mt-8 px-4 overflow-x-auto">
        <div className="flex gap-4">
          <div
            onClick={() => setSelectedDate(null)}
            className={`min-w-[60px] text-center cursor-pointer rounded-lg px-3 py-2 font-semibold
            ${selectedDate === null ? "bg-green-700 text-white" : "bg-white shadow"}`}
          >
            All
          </div>
          {dates.map(date => {
            const day = new Date(date).getDate();
            return (
              <div
                key={date}
                onClick={() => setSelectedDate(date)}
                className={`min-w-[60px] text-center cursor-pointer rounded-lg px-3 py-2 font-semibold
                ${selectedDate === date ? "bg-green-700 text-white" : "bg-white shadow"}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* HEADING */}
      <div className="flex justify-center mt-10">
        <h1
          onClick={openCreateEvent}
          className="text-2xl md:text-3xl font-bold text-green-700 cursor-pointer"
        >
          ADD MAHAL
        </h1>
      </div>

      {/* FLOATING + BUTTON */}
      <button
        onClick={openCreateEvent}
        className="fixed bottom-6 right-6 bg-green-700 text-white w-14 h-14 rounded-full text-3xl shadow-lg flex items-center justify-center z-50"
      >
        +
      </button>

      {/* EMPTY STATE */}
      {filteredEvents.length === 0 && (
        <p className="text-center mt-20 text-gray-500 text-lg">
          No Events for this date
        </p>
      )}

      {/* MOBILE HINT */}
      {isMobile && filteredEvents.length > 0 && (
        <p className="text-center text-xs text-gray-400 mt-2 px-4">
          Hold the 🗑 button for 5 seconds to delete an event
        </p>
      )}

      {/* EVENTS GRID */}
      <div className="max-w-6xl mx-auto mt-6 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pb-24">
        {filteredEvents.map(event => (
          <div
            key={event.id}
            onClick={() => openFoodBooking(event.id)}
            className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition relative cursor-pointer"
          >
            {/* Cover Image */}
            <img
              src={event.image || "/images/mahal1.jpg"}
              className="w-full h-48 object-cover"
              alt={event.nameEnglish || "Mahal"}
            />

            {/* Edit button */}
            <button
              onClick={(e) => { e.stopPropagation(); openEditEvent(event.id); }}
              className="absolute top-[193px] left-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
            >
              Edit
            </button>
            {/* View Food button */}
<button
  onClick={(e) => { e.stopPropagation(); openFoodView(event.id); }}
  className="absolute top-[193px] left-14 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
>
  food list
</button>

            {/* Delete: mobile = hold, desktop = inline confirm */}
            {isMobile ? (
              <HoldDeleteButton onDelete={() => deleteEvent(event.id)} />
            ) : (
              <InlineDeleteButton onDelete={() => deleteEvent(event.id)} />
            )}

            {/* Card Body */}
            <div className="p-4">
              {/* Mahal name */}
              <h2 className="text-green-700 font-bold text-lg mb-1 text-center">
                {event.nameEnglish || "Mahal Name"}
              </h2>

              {/* Date & Month */}
              <p className="text-sm font-medium text-center">
                DATE : {formatDates(event.fromDate, event.toDate)}
              </p>
              <p className="text-sm text-center mb-1">
                {getMonthLabel(event.fromDate, event.toDate)}
              </p>

              {/* Location */}
              <p className="text-sm text-center mb-3">
                {event.location || "Location"}
              </p>

              {/* Divider */}
              <div className="border-t border-gray-100 my-2" />

              {/* Phone number */}
              <div className="flex items-center gap-1.5 mt-2">
                <PhoneIcon />
                <span className="text-xs text-gray-600">
                  {event.userId || <span className="text-gray-400">Phone not set</span>}
                </span>
              </div>

              {/* Password with show/hide */}
              <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                <PasswordRow password={event.password || ""} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;