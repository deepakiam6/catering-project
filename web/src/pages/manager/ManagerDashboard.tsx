import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../../utils/auth";

/* ── Types ── */
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

/* ── Month Maps ── */
const tamilMonths: Record<string, string> = {
  "01": "தை", "02": "மாசி", "03": "பங்குனி", "04": "சித்திரை", "05": "வைகாசி",
  "06": "ஆனி", "07": "ஆடி", "08": "ஆவணி", "09": "புரட்டாசி", "10": "ஐப்பசி",
  "11": "கார்த்திகை", "12": "மார்கழி",
};

const englishMonths: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May",
  "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct",
  "11": "Nov", "12": "Dec",
};

/* ── Icons ── */
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);


const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ── Password Row ── */
const PasswordRow = ({ password }: { password: string }) => {
  const [show, setShow] = useState(false);

  if (!password) return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-300"><LockIcon /></span>
      <span className="text-xs text-gray-400 italic">No password set</span>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-emerald-400"><LockIcon /></span>
      <span className="text-xs font-mono tracking-widest text-gray-600 flex-1">
        {show ? password : "•".repeat(Math.min(password.length, 10))}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); setShow((p) => !p); }}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-all"
      >
        {show ? <EyeOffIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
};

/* ── Event Card ── */
const EventCard = ({
  event,
  onViewMenu,
  onBook,
}: {
  event: EventType;
  onViewMenu: () => void;
  onBook: () => void;
}) => {
  const fromDay = new Date(event.fromDate).getDate();
  const fromMonth = event.fromDate.split("-")[1];
  const toDay = event.toDate ? new Date(event.toDate).getDate() : null;
  const toMonth = event.toDate ? event.toDate.split("-")[1] : null;
  const year = event.fromDate.split("-")[0];

  const dateLabel = toDay ? `${fromDay} & ${toDay}` : `${fromDay}`;

  const monthLabel =
    toMonth && toMonth !== fromMonth
      ? `${tamilMonths[fromMonth]} / ${englishMonths[fromMonth]} → ${tamilMonths[toMonth]} / ${englishMonths[toMonth]}`
      : `${tamilMonths[fromMonth]} / ${englishMonths[fromMonth]}`;

  return (
    <div
      onClick={onBook}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-emerald-100 hover:-translate-y-1 active:scale-[0.98]"
    >
      {/* ── Image ── */}
      <div className="relative overflow-hidden h-48 sm:h-52">
        <img
          src={event.image || "/images/mahal1.jpg"}
          alt={event.nameEnglish || "Mahal"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Date badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
          <p className="text-emerald-700 font-extrabold text-xl leading-none">{dateLabel}</p>
          <p className="text-gray-500 text-[10px] font-semibold leading-snug mt-0.5">{monthLabel}</p>
          <p className="text-gray-400 text-[9px] font-medium">{year}</p>
        </div>

      </div>

      {/* ── Card Body ── */}
      <div className="p-4">
        {/* Name */}
        <h2 className="text-gray-900 font-extrabold text-sm sm:text-base leading-tight truncate group-hover:text-emerald-700 transition-colors duration-200 mb-1">
          {event.nameEnglish || "Mahal Name"}
        </h2>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-emerald-500 shrink-0"><LocationIcon /></span>
            <span className="text-xs text-gray-400 truncate">{event.location}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-emerald-100 via-gray-100 to-transparent mb-3" />

        {/* Phone */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-emerald-500 shrink-0"><PhoneIcon /></span>
          <span className="text-xs text-gray-600 font-semibold">
            {event.userId || <span className="text-gray-400 font-normal italic">Phone not set</span>}
          </span>
        </div>

        {/* Password */}
        <div onClick={(e) => e.stopPropagation()}>
          <PasswordRow password={event.password || ""} />
        </div>

        {/* CTA */}
        <div className="mt-4 w-full bg-emerald-50 group-hover:bg-emerald-600 border border-emerald-200 group-hover:border-emerald-600 text-emerald-700 group-hover:text-white text-xs font-bold py-2.5 rounded-xl text-center transition-all duration-300 select-none">
          Book Food →
        </div>
      </div>
    </div>
  );
};

/* ── Manager Dashboard ── */
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const [events, setEvents] = useState<EventType[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Good day");

  /* Time-based greeting */
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  /* Load ALL events */
  useEffect(() => {
    const stored = localStorage.getItem("events");
    if (stored) {
      try { setEvents(JSON.parse(stored)); } catch { setEvents([]); }
    }
  }, []);

  /* Build 14-day strip */
  useEffect(() => {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      arr.push(d.toISOString().split("T")[0]);
    }
    setDates(arr);
  }, []);

  const handleLogout = () => { clearAuth(); navigate("/admin/login"); };

  const filteredEvents =
    selectedDate === null
      ? events
      : events.filter((e) => e.fromDate === selectedDate || e.toDate === selectedDate);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-8">

      {/* ────────────────────────────────────────────
          STICKY HEADER
      ──────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-sm font-black shadow-md shadow-emerald-200">
              M
            </div>
            <div className="leading-none">
              <p className="text-xs font-black text-gray-800 tracking-tight">BOOK MAHAL</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Manager Portal</p>
            </div>
          </div>

          {/* Phone badge (desktop) */}
          {auth?.phone && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 ml-auto">
              <span className="text-emerald-500"><PhoneIcon /></span>
              <span className="text-xs font-bold text-emerald-700">{auth.phone}</span>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-2.5 py-1.5 rounded-xl hover:bg-red-50 sm:ml-2"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────
          HERO BANNER
      ──────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <p className="text-emerald-200 text-[11px] font-bold uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-xl sm:text-2xl font-black leading-tight truncate">
            {auth?.phone ? `Manager · ${auth.phone}` : "Manager Dashboard"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-white">
              🏛 {events.length} Event{events.length !== 1 ? "s" : ""} Total
            </span>
            {selectedDate && (
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-white">
                📅 {filteredEvents.length} on selected date
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────
          DATE STRIP
      ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div
            className="flex gap-2 overflow-x-auto py-3"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {/* All */}
            <button
              onClick={() => setSelectedDate(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                selectedDate === null
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
              }`}
            >
              All
            </button>

            {dates.map((date) => {
              const day = new Date(date).getDate();
              const mon = englishMonths[date.split("-")[1]];
              const isToday = date === todayStr;
              const isSelected = selectedDate === date;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[46px] ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                      : isToday
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase leading-none ${isSelected ? "text-emerald-200" : "opacity-60"}`}>
                    {mon}
                  </span>
                  <span className="text-sm font-black leading-tight mt-0.5">{day}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────
          MAIN CONTENT
      ──────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {selectedDate
              ? `${new Date(selectedDate).getDate()} ${englishMonths[selectedDate.split("-")[1]]}`
              : "All Events"}
          </p>
          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full px-2.5 py-0.5">
            {filteredEvents.length}
          </span>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewMenu={() => navigate(`/admin/food-view/${event.id}`)}
                onBook={() => navigate(`/book-food/${event.id}`)}
              />
            ))}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-4 shadow-inner">
              🏛
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">No Events Found</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              {selectedDate
                ? "There are no events scheduled on this date."
                : "No events have been created yet."}
            </p>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
              >
                View all events
              </button>
            )}
          </div>
        )}
      </main>

      {/* ────────────────────────────────────────────
          MOBILE BOTTOM BAR
      ──────────────────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-between z-20 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-emerald-600"><PhoneIcon /></span>
          </div>
          <div className="leading-none">
            <p className="text-[10px] text-gray-400 font-medium">Logged in as</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5">
              {auth?.phone || "Manager"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold px-3.5 py-2 rounded-xl border border-red-100 active:scale-95 transition-all"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ManagerDashboard;