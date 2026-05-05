import Navbar from "../../../components/Navbar";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaArrowLeft, FaPlus, FaTrash, FaPencilAlt, FaCheck, FaTimes } from "react-icons/fa";
import FoodMenu from "./FoodMenu";
import VegetableList, { Vegetable } from "./VegetableList";
import VendorList, { Vendor } from "./VendorList";
import { getDefaultRouteForSession } from "../../../utils/auth";

/* ─── Types ─── */
type EventType = {
  id: string;
  image?: string;
  nameTamil?: string;
  nameEnglish?: string;
  location?: string;
  date?: string;
};

type MenuCategory = { id: string; category: string; items: string[] };
type SaveState = "idle" | "saving" | "saved";
type FoodType = "Veg" | "Non Veg" | "Both" | "";

const ALL_SESSIONS = ["Morning", "Afternoon", "Evening", "Night"] as const;
type SessionName = (typeof ALL_SESSIONS)[number];

/* ─── Preset time slots per session ─── */
const SESSION_TIME_SLOTS: Record<SessionName, string[]> = {
  Morning: [
    "6:00 AM","6:15 AM","6:30 AM","6:45 AM",
    "7:00 AM","7:15 AM","7:30 AM","7:45 AM",
    "8:00 AM","8:15 AM","8:30 AM","8:45 AM",
    "9:00 AM","9:15 AM","9:30 AM","9:45 AM",
    "10:00 AM","10:15 AM","10:30 AM","10:45 AM","11:00 AM",
  ],
  Afternoon: [
    "11:30 AM","11:45 AM",
    "12:00 PM","12:15 PM","12:30 PM","12:45 PM",
    "1:00 PM","1:15 PM","1:30 PM","1:45 PM",
    "2:00 PM","2:15 PM","2:30 PM","2:45 PM",
    "3:00 PM","3:15 PM","3:30 PM",
  ],
  Evening: [
    "3:45 PM","4:00 PM","4:15 PM","4:30 PM","4:45 PM",
    "5:00 PM","5:15 PM","5:30 PM","5:45 PM",
    "6:00 PM","6:15 PM","6:30 PM","6:45 PM","7:00 PM",
  ],
  Night: [
    "7:15 PM","7:30 PM","7:45 PM",
    "8:00 PM","8:15 PM","8:30 PM","8:45 PM",
    "9:00 PM","9:15 PM","9:30 PM","9:45 PM",
    "10:00 PM","10:30 PM","11:00 PM",
  ],
};

const SESSION_DEFAULT_TIME: Record<SessionName, string> = {
  Morning: "10:15 AM",
  Afternoon: "1:30 PM",
  Evening: "5:30 PM",
  Night: "8:00 PM",
};

const SESSION_ICONS: Record<SessionName, string> = {
  Morning: "🌅",
  Afternoon: "☀️",
  Evening: "🌇",
  Night: "🌙",
};

/* ─── Per-session config ─── */
type TimeSlot = { id: string; value: string };

type SessionConfig = {
  timeSlots: TimeSlot[];
  foodType: FoodType;
  members: number;
  menu: MenuCategory[];
};

type SessionsConfig = Record<SessionName, SessionConfig>;

/* ─── Unified localStorage entry per session ─── */
export type SessionStorageEntry = {
  menu: MenuCategory[];
  timeSlots: TimeSlot[];
  foodType: FoodType;
  members: number;
};

/* ─── Per-day booking ─── */
type DayBooking = {
  date: string;
  isoDate: string;
  sessions: SessionName[];
  sessionsConfig: SessionsConfig;
};

type BookFoodStorageEntry = {
  eventId: string | undefined;
  version: number;
  event: EventType | null;
  location: string;
  dayBookings: DayBooking[];
  sessions: SessionName[];
  session: string;
  time: string;
  foodType: FoodType;
  menu: MenuCategory[];
  sessionsMenu: Record<SessionName, MenuCategory[]>;
  vegetables: Vegetable[];
  vendors: Vendor[];
  savedAt: string;
};

/* ─── Helpers ─── */
function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function addDays(isoDate: string, n: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
function fmtDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function resolveStartDate(event: EventType | null): string {
  if (event?.date) {
    const d = new Date(event.date);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

/** Always returns a fully populated SessionsConfig — no undefined values ever */
function makeDefaultConfig(): SessionsConfig {
  const config = {} as SessionsConfig;
  ALL_SESSIONS.forEach((s) => {
    config[s] = {
      timeSlots: [{ id: uid(), value: SESSION_DEFAULT_TIME[s] }],
      foodType: "" as FoodType,
      members: 0,
      menu: [],
    };
  });
  return config;
}

/** Ensure a potentially-partial sessionsConfig has all four session keys */
function ensureFullConfig(partial?: Partial<SessionsConfig>): SessionsConfig {
  const defaults = makeDefaultConfig();
  if (!partial) return defaults;
  ALL_SESSIONS.forEach((s) => {
    if (!partial[s]) {
      partial[s] = defaults[s];
    } else {
      // Guard every sub-field
      const c = partial[s]!;
      if (!Array.isArray(c.timeSlots) || c.timeSlots.length === 0) {
        c.timeSlots = [{ id: uid(), value: SESSION_DEFAULT_TIME[s] }];
      }
      if (c.foodType === undefined) c.foodType = "";
      if (typeof c.members !== "number") c.members = 0;
      if (!Array.isArray(c.menu)) c.menu = [];
    }
  });
  return partial as SessionsConfig;
}

function sessionStorageKey(eventId: string | undefined, session: SessionName): string {
  return eventId ? `food-menu-${eventId}-${session}` : `food-menu-${session}`;
}

function readSessionEntry(key: string): SessionStorageEntry | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Handle legacy format: plain array = old menu-only entry
    if (Array.isArray(parsed)) {
      return { menu: parsed, timeSlots: [], foodType: "", members: 0 };
    }
    if (parsed && typeof parsed === "object" && "menu" in parsed) {
      return parsed as SessionStorageEntry;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSessionEntry(key: string, entry: SessionStorageEntry): void {
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

function readMenuFromEntry(key: string): MenuCategory[] {
  const entry = readSessionEntry(key);
  return entry?.menu ?? [];
}

const MAX_DAYS = 4;

/* ─── Section Heading ─── */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-green-800 mb-3 flex items-center gap-2">
    <span className="inline-block w-1 h-4 rounded-full bg-green-700" />
    {children}
  </p>
);

/* ─── Sync Prompt Modal ─── */
const SyncPrompt = ({
  session,
  field,
  onApplyAll,
  onApplyOne,
}: {
  session: SessionName;
  field: "timeSlots" | "foodType";
  onApplyAll: () => void;
  onApplyOne: () => void;
}) => (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/30 px-3 pb-4 sm:pb-0">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4 border border-green-100">
      <div>
        <p className="text-sm font-extrabold text-green-900">Apply changes to other sessions?</p>
        <p className="mt-1 text-xs leading-relaxed text-green-700">
          Update only this {session.toLowerCase()} session, or sync the{" "}
          {field === "foodType" ? "food type" : "time slots"} across all active sessions for this day.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApplyOne}
          className="flex-1 rounded-2xl border border-green-200 bg-white px-4 py-2.5 text-sm font-bold text-green-800 transition hover:bg-green-50"
        >
          Only this card
        </button>
        <button
          onClick={onApplyAll}
          className="flex-1 rounded-2xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-800"
        >
          Apply all
        </button>
      </div>
    </div>
  </div>
);

/* ─── TimeSlotEditor ─── */
const TimeSlotEditor = ({
  session,
  slots,
  onAdd,
  onEdit,
  onDelete,
  onSelectPreset,
}: {
  session: SessionName;
  slots: TimeSlot[];
  onAdd: () => void;
  onEdit: (id: string, value: string) => void;
  onDelete: (id: string) => void;
  onSelectPreset: (slot: string) => void;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const presets = SESSION_TIME_SLOTS[session];

  const startEdit = (slot: TimeSlot) => {
    setEditingId(slot.id);
    setEditVal(slot.value);
  };

  const commitEdit = () => {
    if (editingId && editVal.trim()) onEdit(editingId, editVal.trim());
    setEditingId(null);
    setEditVal("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditVal("");
  };

  // Guard: slots may be undefined if state is partially initialised
  const safeSlots = Array.isArray(slots) ? slots : [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-700">
          Time Slots
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPresets((p) => !p)}
            className="text-[10px] font-bold text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 hover:bg-green-50 transition"
          >
            {showPresets ? "Hide presets" : "Presets"}
          </button>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 text-[10px] font-bold text-white bg-green-700 rounded-full px-2.5 py-0.5 hover:bg-green-800 transition"
          >
            <FaPlus style={{ fontSize: 8 }} /> Add
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-green-50 border border-green-100 rounded-xl">
          {presets.map((p) => {
            const already = safeSlots.some((s) => s.value === p);
            return (
              <button
                key={p}
                onClick={() => { if (!already) onSelectPreset(p); }}
                disabled={already}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                  already
                    ? "bg-green-700 text-white border-green-700 opacity-70 cursor-default"
                    : "bg-white text-black border-green-200 hover:border-green-500 hover:text-green-700"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {safeSlots.map((slot) =>
          editingId === slot.id ? (
            <div key={slot.id} className="flex items-center gap-2">
              <input
                type="text"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                autoFocus
                className="flex-1 border border-green-400 rounded-lg px-3 py-1.5 text-xs font-semibold text-green-900 outline-none focus:ring-2 focus:ring-green-600/20"
                placeholder="e.g. 9:30 AM"
              />
              <button
                onClick={commitEdit}
                className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 transition flex-shrink-0"
              >
                <FaCheck style={{ fontSize: 10 }} />
              </button>
              <button
                onClick={cancelEdit}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition flex-shrink-0"
              >
                <FaTimes style={{ fontSize: 10 }} />
              </button>
            </div>
          ) : (
            <div
              key={slot.id}
              className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2"
            >
              <span className="flex-1 text-xs font-bold text-green-900">{slot.value}</span>
              <button
                onClick={() => startEdit(slot)}
                className="w-6 h-6 rounded-full bg-white border border-green-200 text-green-600 flex items-center justify-center hover:bg-green-100 transition flex-shrink-0"
              >
                <FaPencilAlt style={{ fontSize: 9 }} />
              </button>
              {safeSlots.length > 1 && (
                <button
                  onClick={() => onDelete(slot.id)}
                  className="w-6 h-6 rounded-full bg-white border border-red-100 text-red-400 flex items-center justify-center hover:bg-red-50 transition flex-shrink-0"
                >
                  <FaTrash style={{ fontSize: 9 }} />
                </button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

/* ─── SessionSelector ─── */
const SessionSelector = ({
  selectedSessions,
  onToggle,
}: {
  selectedSessions: SessionName[];
  onToggle: (s: SessionName) => void;
}) => (
  <div className="flex flex-col gap-3">
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-700">
      Select Sessions
    </p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {ALL_SESSIONS.map((s) => {
        const isActive = selectedSessions.includes(s);
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 py-3 px-2 transition-all duration-150 select-none font-bold text-sm
              ${
                isActive
                  ? "border-green-600 bg-green-700 text-white shadow-md scale-[1.02]"
                  : "border-green-100 bg-white text-black hover:border-green-400 hover:text-green-800 hover:shadow-sm"
              }`}
          >
            <span className="text-xl leading-none">{SESSION_ICONS[s]}</span>
            <span className="text-xs font-extrabold tracking-wide">{s}</span>
            {isActive && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/30 mt-0.5">
                <FaCheck style={{ fontSize: 8, color: "white" }} />
              </span>
            )}
          </button>
        );
      })}
    </div>
    {selectedSessions.length === 0 && (
      <p className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
        ⚠️ Please select at least one session to configure it below.
      </p>
    )}
  </div>
);

/* ─── Session Card ─── */
const SessionCard = ({
  session,
  config,
  isSelected,
  onToggle,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onSelectPreset,
  onFoodTypeChange,
  onMembersChange,
  eventId,
  eventName,
  location,
}: {
  session: SessionName;
  config: SessionConfig;
  isSelected: boolean;
  onToggle: () => void;
  onAddSlot: () => void;
  onEditSlot: (id: string, value: string) => void;
  onDeleteSlot: (id: string) => void;
  onSelectPreset: (slot: string) => void;
  onFoodTypeChange: (ft: FoodType) => void;
  onMembersChange: (n: number) => void;
  applyToAll: boolean;
  eventId: string | undefined;
  eventName: string;
  location: string;
}) => {
  // Defensive: config may arrive undefined during state transitions
  const safeConfig: SessionConfig = config ?? {
    timeSlots: [{ id: uid(), value: SESSION_DEFAULT_TIME[session] }],
    foodType: "",
    members: 0,
    menu: [],
  };

  const foodBtnCls = (t: FoodType) => {
    const base =
      "min-h-10 px-3.5 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer select-none";
    if (safeConfig.foodType !== t)
      return `${base} bg-white text-black border-green-200 hover:border-green-500 hover:text-green-700 hover:shadow-sm`;
    if (t === "Non Veg") return `${base} bg-red-500 text-white border-red-500 shadow-sm`;
    if (t === "Veg") return `${base} bg-green-700 text-white border-green-700 shadow-sm`;
    return `${base} bg-amber-500 text-white border-amber-500 shadow-sm`;
  };

  const lsKey = sessionStorageKey(eventId, session);

  return (
    <div
      className={`overflow-hidden rounded-[26px] border transition-all duration-200 ${
        isSelected
          ? "border-green-200 bg-white shadow-[0_18px_45px_rgba(16,90,44,0.10)]"
          : "border-green-100 bg-white shadow-[0_10px_28px_rgba(16,90,44,0.05)] hover:border-green-200 hover:shadow-[0_14px_34px_rgba(16,90,44,0.08)]"
      }`}
    >
      <button
        onClick={onToggle}
        className={`w-full text-left px-4 py-4 sm:px-5 sm:py-5 transition ${
          isSelected ? "bg-gradient-to-r from-green-50 via-white to-white" : "bg-white"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{SESSION_ICONS[session]}</span>
              <span className="text-base font-extrabold text-black">{session}</span>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-green-700 border border-green-100">
                Session
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Add one or more serving times and choose the food type for this block.
            </p>

            {isSelected && (
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {(safeConfig.timeSlots ?? []).map((ts) => (
                  <span
                    key={ts.id}
                    className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full"
                  >
                    {ts.value}
                  </span>
                ))}
                {safeConfig.foodType && (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      safeConfig.foodType === "Non Veg"
                        ? "bg-red-100 text-red-700"
                        : safeConfig.foodType === "Veg"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {safeConfig.foodType}
                  </span>
                )}
                {safeConfig.members > 0 && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    👥 {safeConfig.members} members
                  </span>
                )}
              </div>
            )}
          </div>

          <div
            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
              isSelected ? "border-green-600 bg-green-600" : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && <FaCheck style={{ fontSize: 8, color: "white" }} />}
          </div>
        </div>
      </button>

      {isSelected && (
        <div className="border-t border-green-100 bg-gradient-to-b from-white to-green-50/50 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
            <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
              <TimeSlotEditor
                session={session}
                slots={safeConfig.timeSlots ?? []}
                onAdd={onAddSlot}
                onEdit={onEditSlot}
                onDelete={onDeleteSlot}
                onSelectPreset={onSelectPreset}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-700 mb-2">
                  Food Type
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(["Veg", "Non Veg", "Both"] as FoodType[]).map((t) => (
                    <button key={t} onClick={() => onFoodTypeChange(t)} className={foodBtnCls(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-green-700 mb-2">
                  Number of Members
                </p>
                <input
                  type="number"
                  min={0}
                  value={safeConfig.members === 0 ? "" : safeConfig.members}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onMembersChange(isNaN(val) || val < 0 ? 0 : val);
                  }}
                  placeholder="e.g. 150"
                  className="w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm font-bold text-green-900 outline-none focus:ring-2 focus:ring-green-600/20 focus:border-green-400 placeholder:text-gray-300 transition"
                />
                <p className="mt-1.5 text-[10px] text-gray-400">
                  Total guests expected for this session.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <FoodMenu
              eventName={eventName}
              location={location}
              session={session}
              displayTime={safeConfig.timeSlots?.[0]?.value ?? ""}
              storageKey={lsKey}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── DayBookingCard ─── */
const DayBookingCard = ({
  dayBooking,
  applyToAll,
  onToggleSession,
  onAddSlot,
  onEditSlot,
  onDeleteSlot,
  onSelectPreset,
  onFoodTypeChange,
  onMembersChange,
  eventId,
  eventName,
  location,
}: {
  dayBooking: DayBooking;
  isFirst: boolean;
  applyToAll: boolean;
  onToggleApplyAll: () => void;
  onToggleSession: (s: SessionName) => void;
  onAddSlot: (s: SessionName) => void;
  onEditSlot: (s: SessionName, id: string, value: string) => void;
  onDeleteSlot: (s: SessionName, id: string) => void;
  onSelectPreset: (s: SessionName, slot: string) => void;
  onFoodTypeChange: (s: SessionName, ft: FoodType) => void;
  onMembersChange: (s: SessionName, n: number) => void;
  eventId: string | undefined;
  eventName: string;
  location: string;
}) => {
  // Guard: sessionsConfig may be partially undefined
  const safeSessions = Array.isArray(dayBooking.sessions) ? dayBooking.sessions : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {ALL_SESSIONS.filter((s) => safeSessions.includes(s)).map((s) => {
          const cfg = dayBooking.sessionsConfig?.[s];
          if (!cfg) return null; // Skip until config is hydrated
          return (
            <SessionCard
              key={s}
              session={s}
              config={cfg}
              isSelected={safeSessions.includes(s)}
              onToggle={() => onToggleSession(s)}
              onAddSlot={() => onAddSlot(s)}
              onEditSlot={(id, val) => onEditSlot(s, id, val)}
              onDeleteSlot={(id) => onDeleteSlot(s, id)}
              onSelectPreset={(slot) => onSelectPreset(s, slot)}
              onFoodTypeChange={(ft) => onFoodTypeChange(s, ft)}
              onMembersChange={(n) => onMembersChange(s, n)}
              applyToAll={applyToAll}
              eventId={eventId}
              eventName={eventName}
              location={location}
            />
          );
        })}

        {safeSessions.length === 0 && (
          <div className="xl:col-span-2 rounded-[26px] border-2 border-dashed border-green-200 bg-green-50/50 flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
            <span className="text-3xl">🗓️</span>
            <p className="text-sm font-bold text-green-700">No sessions selected</p>
            <p className="text-xs text-gray-500">
              Use the session selector above to choose which meal times to configure.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════ */

const BookFood = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation();

  const goBack = () => {
    navigate(getDefaultRouteForSession(), { replace: true });
  };

  const editData = locationState.state?.editData;

  const [event, setEvent] = useState<EventType | null>(null);
  const [location, setLocation] = useState("");

  const [dayBookings, setDayBookings] = useState<DayBooking[]>([]);
  const [activeDays, setActiveDays] = useState(1);
  const [applyToAllFlags, setApplyToAllFlags] = useState<boolean[]>([false, false, false, false]);

  const [syncPrompt, setSyncPrompt] = useState<{
    dayIndex: number;
    session: SessionName;
    field: "timeSlots" | "foodType";
    value: string;
  } | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [savedVegetables, setSavedVegetables] = useState<Vegetable[] | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [savedVendors, setSavedVendors] = useState<Vendor[] | null>(null);

  // Track whether initial hydration is complete (guards the LS-sync effect)
  const [hydrated, setHydrated] = useState(false);

  const buildDaySlots = (startIso: string, prefill?: DayBooking[]): DayBooking[] =>
    Array.from({ length: MAX_DAYS }, (_, i) => {
      const iso = addDays(startIso, i);
      const prefillDay = prefill?.[i];
      return {
        date: fmtDate(iso),
        isoDate: iso,
        sessions: prefillDay?.sessions ?? [],
        // Always ensure a full, valid config — no missing keys ever
        sessionsConfig: ensureFullConfig(
          prefillDay?.sessionsConfig
            ? { ...prefillDay.sessionsConfig }
            : undefined
        ),
      };
    });

  /* ── Load event ── */
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem("events") || "[]");
    const found = storedEvents.find((e: EventType) => e.id === id);
    setEvent(found || null);
    if (found?.location) setLocation(found.location);
  }, [id]);

  /* ── Build day slots once event is loaded ── */
  useEffect(() => {
    if (!event) return;
    const startIso = resolveStartDate(event);
    setHydrated(false); // reset before building

    if (editData?.dayBookings && Array.isArray(editData.dayBookings)) {
      setDayBookings(buildDaySlots(startIso, editData.dayBookings));
      setActiveDays(
        Math.min(
          MAX_DAYS,
          Math.max(1, editData.dayBookings.filter((d: DayBooking) => d.sessions.length > 0).length || 1)
        )
      );
    } else {
      setDayBookings(buildDaySlots(startIso));
      setActiveDays(1);
    }

    // Mark hydrated after this synchronous build
    // Use a microtask so state has settled before effects re-fire
    Promise.resolve().then(() => setHydrated(true));
  }, [event]);

  /* ── Restore edit data into per-session LS keys ── */
  useEffect(() => {
    if (!editData) return;
    setVegetables(editData.vegetables || []);
    setSavedVegetables(editData.vegetables || []);
    setVendors(editData.vendors || []);
    setSavedVendors(editData.vendors || []);

    ALL_SESSIONS.forEach((s) => {
      const key = sessionStorageKey(id, s);

      const sessionMenu: MenuCategory[] =
        editData.sessionsMenu?.[s] ??
        (s === (editData.session?.split(", ")[0] ?? "") ? (editData.menu ?? []) : []);

      const firstDayConfig = editData.dayBookings?.[0]?.sessionsConfig?.[s] as SessionConfig | undefined;

      const entry: SessionStorageEntry = {
        menu: sessionMenu?.length > 0 ? sessionMenu : readMenuFromEntry(key),
        timeSlots: firstDayConfig?.timeSlots ?? [],
        foodType: firstDayConfig?.foodType ?? "",
        members: firstDayConfig?.members ?? 0,
      };

      if (entry.menu.length > 0 || entry.timeSlots.length > 0) {
        writeSessionEntry(key, entry);
      }
    });
  }, [editData]);

  /**
   * Sync sessionsConfig → unified LS keys.
   *
   * CRITICAL: Only run after hydration is complete.
   * The `hydrated` flag prevents this effect from firing with
   * a partially-initialised `dayBookings` array (the root cause of the crash).
   */
  useEffect(() => {
    if (!id || !hydrated || dayBookings.length === 0) return;

    dayBookings.slice(0, activeDays).forEach((db) => {
      if (!db || !Array.isArray(db.sessions)) return;
      db.sessions.forEach((s) => {
        const cfg = db.sessionsConfig?.[s];
        if (!cfg) return; // still not ready — skip safely

        const key = sessionStorageKey(id, s);
        const existing = readSessionEntry(key);

        writeSessionEntry(key, {
          menu: existing?.menu ?? cfg.menu ?? [],
          timeSlots: Array.isArray(cfg.timeSlots) ? cfg.timeSlots : [],
          foodType: cfg.foodType ?? "",
          members: typeof cfg.members === "number" ? cfg.members : 0,
        });
      });
    });
  }, [dayBookings, activeDays, id, hydrated]);

  /* ─── Mutators ─── */
  const updateConfig = (
    dayIndex: number,
    s: SessionName,
    updater: (c: SessionConfig) => SessionConfig
  ) => {
    setDayBookings((prev) =>
      prev.map((db, i) => {
        if (i !== dayIndex) return db;
        const currentCfg = db.sessionsConfig?.[s] ?? {
          timeSlots: [{ id: uid(), value: SESSION_DEFAULT_TIME[s] }],
          foodType: "" as FoodType,
          members: 0,
          menu: [],
        };
        return {
          ...db,
          sessionsConfig: {
            ...db.sessionsConfig,
            [s]: updater(currentCfg),
          },
        };
      })
    );
  };

  const updateConfigAllSessions = (
    dayIndex: number,
    updater: (c: SessionConfig) => SessionConfig
  ) => {
    setDayBookings((prev) =>
      prev.map((db, i) => {
        if (i !== dayIndex) return db;
        const newConfig = { ...(db.sessionsConfig ?? makeDefaultConfig()) };
        (db.sessions ?? []).forEach((s) => {
          const currentCfg = newConfig[s] ?? {
            timeSlots: [{ id: uid(), value: SESSION_DEFAULT_TIME[s] }],
            foodType: "" as FoodType,
            members: 0,
            menu: [],
          };
          newConfig[s] = updater(currentCfg);
        });
        return { ...db, sessionsConfig: newConfig };
      })
    );
  };

  const toggleSession = (dayIndex: number, s: SessionName) => {
    setDayBookings((prev) =>
      prev.map((db, i) => {
        if (i !== dayIndex) return db;
        const has = (db.sessions ?? []).includes(s);
        return {
          ...db,
          sessions: has ? (db.sessions ?? []).filter((x) => x !== s) : [...(db.sessions ?? []), s],
        };
      })
    );
  };

  const handleAddSlot = (dayIndex: number, s: SessionName) => {
    const newSlot: TimeSlot = { id: uid(), value: SESSION_DEFAULT_TIME[s] };
    if (applyToAllFlags[dayIndex]) {
      updateConfigAllSessions(dayIndex, (c) => ({
        ...c,
        timeSlots: [...(c.timeSlots ?? []), { ...newSlot, id: uid() }],
      }));
    } else {
      updateConfig(dayIndex, s, (c) => ({
        ...c,
        timeSlots: [...(c.timeSlots ?? []), newSlot],
      }));
    }
  };

  const handleEditSlot = (dayIndex: number, s: SessionName, slotId: string, value: string) => {
    if (applyToAllFlags[dayIndex]) {
      updateConfigAllSessions(dayIndex, (c) => ({
        ...c,
        timeSlots: (c.timeSlots ?? []).map((ts, idx) =>
          idx === 0 ? { ...ts, value } : ts
        ),
      }));
    } else {
      updateConfig(dayIndex, s, (c) => ({
        ...c,
        timeSlots: (c.timeSlots ?? []).map((ts) =>
          ts.id === slotId ? { ...ts, value } : ts
        ),
      }));
    }
  };

  const handleDeleteSlot = (dayIndex: number, s: SessionName, slotId: string) => {
    updateConfig(dayIndex, s, (c) => ({
      ...c,
      timeSlots: (c.timeSlots ?? []).filter((ts) => ts.id !== slotId),
    }));
  };

  const handleSelectPreset = (dayIndex: number, s: SessionName, slot: string) => {
    const newSlot: TimeSlot = { id: uid(), value: slot };
    if (applyToAllFlags[dayIndex]) {
      updateConfigAllSessions(dayIndex, (c) => {
        if ((c.timeSlots ?? []).some((ts) => ts.value === slot)) return c;
        return { ...c, timeSlots: [...(c.timeSlots ?? []), { ...newSlot, id: uid() }] };
      });
    } else {
      updateConfig(dayIndex, s, (c) => ({
        ...c,
        timeSlots: [...(c.timeSlots ?? []), newSlot],
      }));
    }
  };

  const handleFoodTypeChange = (dayIndex: number, s: SessionName, ft: FoodType) => {
    if (applyToAllFlags[dayIndex]) {
      updateConfigAllSessions(dayIndex, (c) => ({ ...c, foodType: ft }));
    } else {
      updateConfig(dayIndex, s, (c) => ({ ...c, foodType: ft }));
    }
  };

  const handleMembersChange = (dayIndex: number, s: SessionName, n: number) => {
    updateConfig(dayIndex, s, (c) => ({ ...c, members: n }));
  };

  const toggleApplyToAll = (dayIndex: number) => {
    setApplyToAllFlags((prev) => {
      const n = [...prev];
      n[dayIndex] = !n[dayIndex];
      return n;
    });
  };

  const handleAddDay = () => {
    if (activeDays < MAX_DAYS) setActiveDays((p) => p + 1);
  };

  const handleRemoveDay = () => {
    if (activeDays <= 1) return;
    setDayBookings((prev) =>
      prev.map((db, i) =>
        i === activeDays - 1
          ? { ...db, sessions: [], sessionsConfig: makeDefaultConfig() }
          : db
      )
    );
    setActiveDays((p) => p - 1);
  };

  /* ─── Save ─── */
  const handleComplete = () => {
    if (saveState !== "idle") return;
    setSaveState("saving");

    setTimeout(() => {
      const LS_KEY = "bookFoodData";
      let existing: BookFoodStorageEntry[] = [];
      try {
        const raw = localStorage.getItem(LS_KEY);
        const parsed = JSON.parse(raw || "[]");
        existing = Array.isArray(parsed) ? parsed : [];
      } catch {
        existing = [];
      }

      const activeDayBookings = dayBookings.slice(0, activeDays);

      // Final sync: write each active session's full config into unified LS
      activeDayBookings.forEach((db) => {
        if (!db || !Array.isArray(db.sessions)) return;
        db.sessions.forEach((s) => {
          const cfg = db.sessionsConfig?.[s];
          if (!cfg) return;
          const key = sessionStorageKey(id, s);
          const existingEntry = readSessionEntry(key);
          writeSessionEntry(key, {
            menu: existingEntry?.menu ?? cfg.menu ?? [],
            timeSlots: Array.isArray(cfg.timeSlots) ? cfg.timeSlots : [],
            foodType: cfg.foodType ?? "",
            members: typeof cfg.members === "number" ? cfg.members : 0,
          });
        });
      });

      const sessionsMenu: Record<SessionName, MenuCategory[]> = {
        Morning: readMenuFromEntry(sessionStorageKey(id, "Morning")),
        Afternoon: readMenuFromEntry(sessionStorageKey(id, "Afternoon")),
        Evening: readMenuFromEntry(sessionStorageKey(id, "Evening")),
        Night: readMenuFromEntry(sessionStorageKey(id, "Night")),
      };

      const firstSession = activeDayBookings[0]?.sessions?.[0];
      const firstConfig = firstSession
        ? activeDayBookings[0]?.sessionsConfig?.[firstSession]
        : null;
      const menu = firstSession ? sessionsMenu[firstSession] : [];

      const payload = {
        event,
        location,
        dayBookings: activeDayBookings,
        sessions: activeDayBookings.flatMap((d) => d.sessions ?? []),
        session: activeDayBookings.flatMap((d) => d.sessions ?? []).join(", "),
        time: firstConfig?.timeSlots?.[0]?.value ?? "",
        foodType: firstConfig?.foodType ?? ("" as FoodType),
        menu,
        sessionsMenu,
        vegetables,
        vendors,
        savedAt: new Date().toISOString(),
      };

      if (editData?.version) {
        const updated = existing.map((e) =>
          String(e.eventId).trim() === String(id).trim() &&
          Number(e.version) === Number(editData.version)
            ? { ...e, ...payload }
            : e
        );
        localStorage.setItem(LS_KEY, JSON.stringify(updated));
      } else {
        const prev = existing.filter((e) => e.eventId === id);
        const maxVer = prev.reduce((mx, e) => Math.max(mx, e.version ?? 0), 0);
        existing.push({ eventId: id, version: maxVer + 1, ...payload });
        localStorage.setItem(LS_KEY, JSON.stringify(existing));
      }

      setSaveState("saved");
      setTimeout(() => {
        navigate(getDefaultRouteForSession(), { replace: true });
      }, 800);
      setTimeout(() => setSaveState("idle"), 2000);
    }, 600);
  };

  const saveButtonContent = () => {
    if (saveState === "saving")
      return (
        <>
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Saving...
        </>
      );
    if (saveState === "saved")
      return (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Saved
        </>
      );
    return "SAVE";
  };

  const saveButtonCls = [
    "fixed bottom-0 left-0 right-0 z-50 w-full rounded-none border-0",
    "text-white font-bold text-base tracking-wide py-4 px-6",
    "flex items-center justify-center gap-2 active:brightness-90 transition-all duration-300",
    "sm:bottom-auto sm:top-5 sm:right-2 sm:left-auto sm:w-auto sm:rounded-full sm:py-2.5 sm:px-6 sm:text-sm",
    "sm:shadow-lg sm:hover:-translate-y-0.5 sm:hover:shadow-xl",
    saveState === "idle"
      ? "bg-green-700 shadow-[0_-4px_20px_rgba(34,137,74,.30)] cursor-pointer"
      : saveState === "saving"
      ? "bg-green-600 cursor-not-allowed opacity-90"
      : "bg-green-500 cursor-default",
  ].join(" ");

  const eventName = event?.nameTamil || event?.nameEnglish || "";
  const firstSession = dayBookings[0]?.sessions?.[0];
  const printCtx = {
    eventName,
    location,
    session: dayBookings.slice(0, activeDays).flatMap((d) => d.sessions ?? []).join(", "),
    displayTime: firstSession
      ? (dayBookings[0]?.sessionsConfig?.[firstSession]?.timeSlots?.[0]?.value ?? "")
      : "",
  };

  if (!event)
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-black font-medium">Loading event…</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-green-50 font-sans">
      <Navbar />

      {syncPrompt && (
        <SyncPrompt
          session={syncPrompt.session}
          field={syncPrompt.field}
          onApplyAll={() => {
            updateConfigAllSessions(syncPrompt.dayIndex, (c) =>
              syncPrompt.field === "foodType"
                ? { ...c, foodType: syncPrompt.value as FoodType }
                : { ...c, timeSlots: [{ id: uid(), value: syncPrompt.value }] }
            );
            setSyncPrompt(null);
          }}
          onApplyOne={() => {
            updateConfig(syncPrompt.dayIndex, syncPrompt.session, (c) =>
              syncPrompt.field === "foodType"
                ? { ...c, foodType: syncPrompt.value as FoodType }
                : { ...c, timeSlots: [{ id: uid(), value: syncPrompt.value }] }
            );
            setSyncPrompt(null);
          }}
        />
      )}

      <button
        onClick={handleComplete}
        disabled={saveState !== "idle"}
        className={saveButtonCls}
      >
        {saveButtonContent()}
      </button>

      <button
        onClick={goBack}
        className="sm:hidden fixed top-35 left-2 w-5 h-5 rounded-full bg-green-700 text-white flex items-center justify-center text-xs shadow-md hover:bg-green-800 transition z-40"
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

        {editData && (
          <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
            <span className="text-base">✏️</span>
            <div>
              <p className="text-xs font-extrabold text-green-700">Editing Existing Booking</p>
              <p className="text-[10px] text-green-500">Changes will be saved as a new version.</p>
            </div>
          </div>
        )}

        {/* Event Info */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Info</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Mahal Name", val: event.nameTamil || event.nameEnglish },
              { label: "Location", val: location || "—" },
            ].map(({ label, val }) => (
              <div key={label} className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-black mb-1">
                  {label}
                </p>
                <p className="text-base font-bold text-green-900 leading-snug">{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-5">
          <SectionHeading>Event Details</SectionHeading>
          <div className="flex flex-col gap-6">
            {dayBookings.slice(0, activeDays).map((db, dayIndex) => (
              <div key={db.isoDate} className={dayIndex > 0 ? "pt-5 border-t border-green-100" : ""}>

                <div className="mb-4">
                  {activeDays > 1 && (
                    <p className="text-xs font-extrabold text-green-800 mb-3 flex items-center gap-2">
                      <span className="inline-block w-1 h-4 rounded-full bg-green-700" />
                      Day {dayIndex + 1} — {db.date}
                    </p>
                  )}
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                    <SessionSelector
                      selectedSessions={db.sessions ?? []}
                      onToggle={(s) => toggleSession(dayIndex, s)}
                    />
                  </div>
                </div>

                <DayBookingCard
                  dayBooking={db}
                  isFirst={dayIndex === 0}
                  applyToAll={applyToAllFlags[dayIndex]}
                  onToggleApplyAll={() => toggleApplyToAll(dayIndex)}
                  onToggleSession={(s) => toggleSession(dayIndex, s)}
                  onAddSlot={(s) => handleAddSlot(dayIndex, s)}
                  onEditSlot={(s, sid, val) => handleEditSlot(dayIndex, s, sid, val)}
                  onDeleteSlot={(s, sid) => handleDeleteSlot(dayIndex, s, sid)}
                  onSelectPreset={(s, slot) => handleSelectPreset(dayIndex, s, slot)}
                  onFoodTypeChange={(s, ft) => handleFoodTypeChange(dayIndex, s, ft)}
                  onMembersChange={(s, n) => handleMembersChange(dayIndex, s, n)}
                  eventId={id}
                  eventName={eventName}
                  location={location}
                />
              </div>
            ))}

            {dayBookings[0]?.sessions?.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-1">
                {activeDays < MAX_DAYS && (
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={activeDays > 1}
                      onChange={(e) =>
                        e.target.checked ? handleAddDay() : handleRemoveDay()
                      }
                      className="accent-green-700 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-black">
                      Continue to next day
                      {activeDays > 1 && (
                        <span className="ml-1 text-green-700">
                          (up to {dayBookings[activeDays - 1]?.date})
                        </span>
                      )}
                    </span>
                  </label>
                )}
                {activeDays > 1 && activeDays < MAX_DAYS && (
                  <button
                    onClick={handleAddDay}
                    className="text-xs font-semibold text-green-700 border border-green-300 rounded-full px-3 py-1 hover:bg-green-50 transition"
                  >
                    + Add {dayBookings[activeDays]?.date}
                  </button>
                )}
                {activeDays > 1 && (
                  <button
                    onClick={handleRemoveDay}
                    className="text-xs font-semibold text-red-500 border border-red-200 rounded-full px-3 py-1 hover:bg-red-50 transition"
                  >
                    − Remove {dayBookings[activeDays - 1]?.date}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Shared Vegetable + Vendor sections */}
        <VegetableList
          vegetables={vegetables}
          setVegetables={setVegetables}
          savedVegetables={savedVegetables}
          setSavedVegetables={setSavedVegetables}
          eventId={id}
          {...printCtx}
        />
        <VendorList
          vendors={vendors}
          setVendors={setVendors}
          savedVendors={savedVendors}
          setSavedVendors={setSavedVendors}
          eventId={id}
          {...printCtx}
        />

        <div className="h-4 sm:h-0" />
      </div>
    </div>
  );
};

export default BookFood;