import Navbar from "../../../components/Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAuth, clearAuth } from "../../../utils/auth";

/* ── Types ──────────────────────────────────────────────── */
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

type Manager = {
  id: string;
  label: string;
  phone: string;
  password: string;
};

type MenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type Vegetable = {
  name: string;
  qty: string;
  unit: string;
};

type Vendor = {
  name: string;
  phone: string;
  role?: string;
};

type BookingSnapshot = {
  session?: string;
  time?: string;
  foodType?: string;
  menu?: MenuCategory[];
  vegetables?: Vegetable[];
  vendors?: Vendor[];
};

type BookingVersion = {
  eventId: string;
  version: number;
  savedAt?: string | number;
  isUpdated?: boolean;
  session?: string;
  time?: string;  
  foodType?: string;
  menu?: MenuCategory[];
  vegetables?: Vegetable[];
  vendors?: Vendor[];
  pendingUpdate?: BookingSnapshot;
  approvalOriginal?: BookingSnapshot;
  approvalRequestedAt?: string | number;
};

type CompareRow = {
  key: string;
  label: string;
  changed: boolean;
  before: string[];
  after: string[];
};

type ApprovalSelection = {
  event: EventType;
  booking: BookingVersion;
};

/* ── Constants ──────────────────────────────────────────── */
const LS_BOOKING_KEY = "bookFoodData";

const tamilMonths: Record<string, string> = {
  "01": "தை",
  "02": "மாசி",
  "03": "பங்குனி",
  "04": "சித்திரை",
  "05": "வைகாசி",
  "06": "ஆனி",
  "07": "ஆடி",
  "08": "ஆவணி",
  "09": "புரட்டாசி",
  "10": "ஐப்பசி",
  "11": "கார்த்திகை",
  "12": "மார்கழி",
};

const englishMonths: Record<string, string> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const RADIUS = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ── Helpers ─────────────────────────────────────────────── */
const readBookings = (): BookingVersion[] => {
  try {
    const raw = localStorage.getItem(LS_BOOKING_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeBookings = (bookings: BookingVersion[]) => {
  localStorage.setItem(LS_BOOKING_KEY, JSON.stringify(bookings));
};

const normaliseVendor = (vendor: unknown): Vendor => {
  if (!vendor || typeof vendor !== "object") {
    return { name: "", phone: "", role: "" };
  }

  const source = vendor as Record<string, string>;
  return {
    name: source.name ?? source.assignedVendor ?? source.role ?? "",
    phone: source.phone ?? "",
    role: source.role ?? "",
  };
};

const toMenuLines = (menu?: MenuCategory[]) => {
  const safeMenu = Array.isArray(menu) ? menu : [];
  const lines = safeMenu
    .map((category) => {
      const items = (category.items ?? []).map((item) => item.trim()).filter(Boolean);
      if (!items.length) return "";
      return `${category.category || "Category"}: ${items.join(", ")}`;
    })
    .filter(Boolean);

  return lines.length ? lines : ["No menu selected"];
};

const toVegetableLines = (vegetables?: Vegetable[]) => {
  const safeVegetables = Array.isArray(vegetables) ? vegetables : [];
  const lines = safeVegetables
    .map((veg) => {
      const name = veg.name?.trim() || "Vegetable";
      const qty = veg.qty?.trim() || "-";
      const unit = veg.unit?.trim() || "";
      return `${name}: ${qty}${unit ? ` ${unit}` : ""}`;
    })
    .filter(Boolean);

  return lines.length ? lines : ["No vegetables added"];
};

const toVendorLines = (vendors?: Vendor[]) => {
  const safeVendors = Array.isArray(vendors) ? vendors.map(normaliseVendor) : [];
  const lines = safeVendors
    .map((vendor) => [vendor.role?.trim(), vendor.name?.trim(), vendor.phone?.trim()].filter(Boolean).join(" • "))
    .filter(Boolean);

  return lines.length ? lines : ["No vendors assigned"];
};

const normaliseLines = (lines: string[]) =>
  [...lines].map((line) => line.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b));

const sameLines = (left: string[], right: string[]) =>
  JSON.stringify(normaliseLines(left)) === JSON.stringify(normaliseLines(right));

const getBeforeSnapshot = (booking: BookingVersion): BookingSnapshot => ({
  session: booking.approvalOriginal?.session ?? booking.session ?? "",
  time: booking.approvalOriginal?.time ?? booking.time ?? "",
  foodType: booking.approvalOriginal?.foodType ?? booking.foodType ?? "",
  menu: booking.approvalOriginal?.menu ?? booking.menu ?? [],
  vegetables: booking.approvalOriginal?.vegetables ?? booking.vegetables ?? [],
  vendors: booking.approvalOriginal?.vendors ?? booking.vendors ?? [],
});

const getAfterSnapshot = (booking: BookingVersion): BookingSnapshot => ({
  session: booking.pendingUpdate?.session ?? booking.session ?? "",
  time: booking.pendingUpdate?.time ?? booking.time ?? "",
  foodType: booking.pendingUpdate?.foodType ?? booking.foodType ?? "",
  menu: booking.pendingUpdate?.menu ?? booking.menu ?? [],
  vegetables: booking.pendingUpdate?.vegetables ?? booking.vegetables ?? [],
  vendors: booking.pendingUpdate?.vendors ?? booking.vendors ?? [],
});

const buildCompareRows = (booking: BookingVersion): CompareRow[] => {
  const before = getBeforeSnapshot(booking);
  const after = getAfterSnapshot(booking);

  return [
    {
      key: "menu",
      label: "Menu",
      before: toMenuLines(before.menu),
      after: toMenuLines(after.menu),
      changed: !sameLines(toMenuLines(before.menu), toMenuLines(after.menu)),
    },
    
  ];
};

const getLatestPendingBookingForEvent = (eventId: string) => {
  const pending = readBookings()
    .filter((entry) => String(entry.eventId) === String(eventId) && entry.isUpdated === true)
    .sort((a, b) => {
      const aTime = new Date(a.approvalRequestedAt ?? a.savedAt ?? 0).getTime();
      const bTime = new Date(b.approvalRequestedAt ?? b.savedAt ?? 0).getTime();
      return bTime - aTime || (b.version ?? 0) - (a.version ?? 0);
    });

  return pending[0] ?? null;
};

/* ── Icons ──────────────────────────────────────────────── */
const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6b7280", flexShrink: 0 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#6b7280", flexShrink: 0 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Hold-to-Delete (mobile) ────────────────────────────── */
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

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

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
      className="absolute top-88 right-2 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 shadow-md active:scale-95 transition-transform select-none"
      title="Hold 5s to delete"
      style={{ WebkitUserSelect: "none", touchAction: "none" }}
    >
      <svg width="40" height="40" className="absolute top-0 left-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        {holding && (
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        )}
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
      </svg>
    </button>
  );
};

/* ── Inline Confirm Delete (desktop) ────────────────────── */
const InlineDeleteButton = ({ onDelete }: { onDelete: () => void }) => {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white border border-red-200 rounded-lg px-2 py-1 shadow-lg z-10" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-gray-600 font-medium mr-1 whitespace-nowrap">Delete?</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-md font-semibold transition-colors"
        >
          Yes
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md font-semibold transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setConfirming(true);
      }}
      className="absolute top-90 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
    >
      Delete
    </button>
  );
};

/* ── Password Row ───────────────────────────────────────── */
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
        onClick={(e) => {
          e.stopPropagation();
          setShow((p) => !p);
        }}
        title={show ? "Hide password" : "Show password"}
        className="flex items-center justify-center text-gray-400 hover:text-green-700 transition-colors p-0.5 rounded"
      >
        {show ? <EyeOffIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
};

/* ── Manager Password Row ───────────────────────────────── */
const ManagerPasswordRow = ({ password }: { password: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <LockIcon />
      <span className="text-xs text-gray-600 flex-1 font-mono tracking-wider">
        {show ? password : "•".repeat(Math.min(password.length, 8))}
      </span>
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="flex items-center justify-center text-gray-400 hover:text-green-700 transition-colors p-0.5 rounded"
        title={show ? "Hide" : "Show"}
      >
        {show ? <EyeOffIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
};

/* ── Manager Card ───────────────────────────────────────── */
const ManagerCard = ({
  manager,
  onDelete,
  onUpdate,
}: {
  manager: Manager;
  onDelete: (id: string) => void;
  onUpdate: (id: string, phone: string, password: string) => void;
}) => {

  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(manager.phone);
  const [editPassword, setEditPassword] = useState(manager.password);
  const [showEditPwd, setShowEditPwd] = useState(false);

  const handleSave = () => {
    if (!editPhone.trim() || !editPassword.trim()) return;
    onUpdate(manager.id, editPhone.trim(), editPassword.trim());
    setEditing(false);
    

  };

  const handleCancel = () => {
    setEditPhone(manager.phone);
    setEditPassword(manager.password);
    setEditing(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-white bg-green-600 rounded-full px-2.5 py-0.5 tracking-wide">
          {manager.label}
        </span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setConfirming(false);
              }}
              className="text-blue-400 hover:text-blue-600 transition-colors"
              title="Edit manager"
            >
              <EditIcon />
            </button>
          )}
          {!editing &&
            (confirming ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(manager.id)}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded font-semibold transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-semibold transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Delete manager"
              >
                <TrashIcon />
              </button>
            ))}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2 mt-1">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 focus-within:border-green-400 rounded-lg px-2 py-1.5">
            <PhoneIcon />
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Phone number"
              className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 focus-within:border-green-400 rounded-lg px-2 py-1.5">
            <LockIcon />
            <input
              type={showEditPwd ? "text" : "password"}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Password"
              className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400 font-mono"
            />
            <button type="button" onClick={() => setShowEditPwd((p) => !p)} className="text-gray-400 hover:text-green-600 transition-colors">
              {showEditPwd ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </div>
          <div className="flex gap-1.5">
            <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
              Update
            </button>
            <button onClick={handleCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-1.5">
            <PhoneIcon />
            <span className="text-xs text-gray-700 font-medium">{manager.phone}</span>
          </div>
          <ManagerPasswordRow password={manager.password} />
        </>
      )}
    </div>
  );
};

/* ── Add Manager Form ───────────────────────────────────── */
const AddManagerForm = ({
  onAdd,
  existingPhones,
}: {
  onAdd: (phone: string, password: string) => void;
  existingPhones: string[];
}) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = () => {
    const e: { phone?: string; password?: string } = {};
    if (!phone.trim()) e.phone = "Phone is required";
    else if (existingPhones.includes(phone.trim())) e.phone = "Phone already exists";
    if (!password.trim()) e.password = "Password is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onAdd(phone.trim(), password.trim());
    setPhone("");
    setPassword("");
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-green-500 rounded-full inline-block" />
        Add Manager
      </h3>
      <div>
        <div className={`flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 transition-colors ${errors.phone ? "border-red-400" : "border-gray-200 focus-within:border-green-400"}`}>
          <PhoneIcon />
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((p) => ({ ...p, phone: undefined }));
            }}
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
      </div>
      <div>
        <div className={`flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 transition-colors ${errors.password ? "border-red-400" : "border-gray-200 focus-within:border-green-400"}`}>
          <LockIcon />
          <input
            type={showPwd ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 font-mono"
          />
          <button type="button" onClick={() => setShowPwd((p) => !p)} className="text-gray-400 hover:text-green-600 transition-colors">
            {showPwd ? <EyeOffIcon /> : <EyeOpenIcon />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
      </div>
      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors shadow-sm active:scale-95">
        + Save Manager
      </button>
    </form>
  );
};

/* ── Desktop Manager Sidebar ────────────────────────────── */
const ManagerSidebar = ({
  managers,
  onAdd,
  onDelete,
  onUpdate,
}: {
  managers: Manager[];
  onAdd: (phone: string, password: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, phone: string, password: string) => void;
}) => (
  <aside className="hidden md:flex flex-col w-64 shrink-0">
    <div className="sticky top-4 space-y-4">
      <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
        <AddManagerForm onAdd={onAdd} existingPhones={managers.map((m) => m.phone)} />
      </div>
      <div className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-400 rounded-full inline-block" />
          Managers
          <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold rounded-full px-2 py-0.5">
            {managers.length}
          </span>
        </h3>
        {managers.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No managers added yet</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {managers.map((m) => (
              <ManagerCard key={m.id} manager={m} onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  </aside>
);

/* ── Mobile Manager Accordion ───────────────────────────── */
const ManagerAccordion = ({
  managers,
  onAdd,
  onDelete,
  onUpdate,
}: {
  managers: Manager[];
  onAdd: (phone: string, password: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, phone: string, password: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden mx-4 mb-4 bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      <button onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-700">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-4 bg-green-500 rounded-full inline-block" />
          Managers
          <span className="bg-green-50 text-green-700 text-xs font-bold rounded-full px-2 py-0.5">{managers.length}</span>
        </span>
        <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4">
          <AddManagerForm onAdd={onAdd} existingPhones={managers.map((m) => m.phone)} />
          {managers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Manager List</h4>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                {managers.map((m) => (
                  <div key={m.id} className="min-w-[200px]">
                    <ManagerCard manager={m} onDelete={onDelete} onUpdate={onUpdate} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {managers.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No managers added yet</p>}
        </div>
      )}
    </div>
  );
};

/* ── Approval Modal ─────────────────────────────────────── */
const DiffBlock = ({
  title,
  items,
  changed,
}: {
  title: string;
  items: string[];
  changed: boolean;
}) => (
  <div className={`rounded-2xl border px-4 py-3.5 ${changed ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
    <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-2 ${changed ? "text-amber-700" : "text-gray-500"}`}>
      {title}
    </p>
    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
      {items.map((item, index) => (
        <p key={`${title}-${index}`} className="text-sm leading-relaxed text-gray-800 break-words">
          {item}
        </p>
      ))}
    </div>
  </div>
);

const ApprovalReviewModal = ({
  selection,
  onConfirm,
  onReject,
  onClose,
}: {
  selection: ApprovalSelection;
  onConfirm: () => void;
  onReject: () => void;
  onClose: () => void;
}) => {
  const rows = buildCompareRows(selection.booking);
  const changedCount = rows.filter((row) => row.changed).length;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-red-50 via-white to-green-50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-red-600">Pending Approval</p>
              <h2 className="text-2xl font-black text-slate-900 mt-1">{selection.event.nameEnglish || "Event"}</h2>
              <p className="text-sm text-slate-500 mt-2">
                Review user-submitted changes before applying them to the booking.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-amber-200 px-4 py-3 min-w-[110px] text-center">
              <p className="text-2xl font-black text-amber-600">{changedCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                Changed field{changedCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          <div className="space-y-4">
            {rows.map((row) => (
              <div
                key={row.key}
                className={`rounded-2xl border p-4 ${row.changed ? "border-amber-200 bg-amber-50/40 shadow-sm" : "border-slate-200 bg-white"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-slate-900">{row.label}</p>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        row.changed ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {row.changed ? "Modified" : "Unchanged"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <DiffBlock title="Old Data" items={row.before} changed={row.changed} />
                  <DiffBlock title="Updated Data" items={row.after} changed={row.changed} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 transition"
          >
            Close
          </button>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onReject}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition"
            >
              Cancel Changes
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-green-700 text-white font-bold hover:bg-green-800 transition"
            >
              Confirm Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  const openFoodView = (id: string) => navigate(`/admin/food-view/${id}`);

  const [events, setEvents] = useState<EventType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [pendingApprovalIds, setPendingApprovalIds] = useState<string[]>([]);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalSelection, setApprovalSelection] = useState<ApprovalSelection | null>(null);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md border border-red-100 p-8 max-w-sm text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-1">Access Denied</h2>
          <p className="text-sm text-gray-500 mb-5">Admin access only.</p>
          <a href="/admin/login" className="inline-block bg-green-700 hover:bg-green-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const stored = localStorage.getItem("managers");
    if (stored) {
      try {
        setManagers(JSON.parse(stored));
      } catch {
        setManagers([]);
      }
    }
  }, []);

  const saveManagers = (updated: Manager[]) => {
    setManagers(updated);
    localStorage.setItem("managers", JSON.stringify(updated));
  };

  const addManager = (phone: string, password: string) => {
    const newManager: Manager = {
      id: Date.now().toString(),
      label: `Manager ${managers.length + 1}`,
      phone,
      password,
    };
    saveManagers([...managers, newManager]);
  };

  const deleteManager = (id: string) => {
    saveManagers(managers.filter((m) => m.id !== id));
  };

  const updateManager = (id: string, phone: string, password: string) => {
    saveManagers(managers.map((m) => (m.id === id ? { ...m, phone, password } : m)));
  };

  const refreshPendingApprovals = () => {
    const bookings = readBookings();
    const pendingIds = Array.from(
      new Set(
        bookings
          .filter((entry) => entry?.isUpdated === true && entry?.eventId)
          .map((entry) => String(entry.eventId))
      )
    );
    setPendingApprovalIds(pendingIds);
  };

  useEffect(() => {
    refreshPendingApprovals();
    const handleStorage = () => refreshPendingApprovals();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
    const evts = JSON.parse(localStorage.getItem("events") || "[]");
    const food = JSON.parse(localStorage.getItem("bookFoodData") || "[]");
    const validIds = new Set(evts.map((e: EventType) => String(e.id)));
    const cleaned = food.filter((f: { eventId: string }) => validIds.has(String(f.eventId)));
    localStorage.setItem("bookFoodData", JSON.stringify(cleaned));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("events");
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  const deleteEvent = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    localStorage.setItem("events", JSON.stringify(updated));

    try {
      let foodData = JSON.parse(localStorage.getItem(LS_BOOKING_KEY) || "[]");
      if (!Array.isArray(foodData)) foodData = [];
      const cleaned = foodData.filter((d: { eventId: string }) => String(d.eventId).trim() !== String(id).trim());
      localStorage.setItem(LS_BOOKING_KEY, JSON.stringify(cleaned));
      refreshPendingApprovals();
    } catch {
      localStorage.removeItem(LS_BOOKING_KEY);
      refreshPendingApprovals();
    }
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/admin/login", { replace: true });
  };

  const openCreateEvent = () => navigate("/create-mahal");
  const openEditEvent = (id: string) => navigate(`/create-mahal/${id}`);
  const openFoodBooking = (id: string) => navigate(`/book-food/${id}`);

  const openApprovalForEvent = (event: EventType) => {
    const booking = getLatestPendingBookingForEvent(String(event.id));
    if (!booking) {
      openFoodBooking(event.id);
      return;
    }
    const confirmReview = window.confirm(
    `Review the "${event.nameEnglish || "Mahal"}" to update the food items?`
  );

  if (!confirmReview) return;

  // ✅ If OK → open review modal
  setApprovalSelection({ event, booking });
  };

  const approveSelectedUpdate = () => {
    if (!approvalSelection) return;

    const { booking } = approvalSelection;
    const bookings = readBookings();

    const updated = bookings.map((entry) => {
      if (String(entry.eventId) !== String(booking.eventId) || entry.version !== booking.version) {
        return entry;
      }

      const next = entry.pendingUpdate ?? {};

      return {
        ...entry,
        session: next.session ?? entry.session,
        time: next.time ?? entry.time,
        foodType: next.foodType ?? entry.foodType,
        menu: next.menu ?? entry.menu ?? [],
        vegetables: next.vegetables ?? entry.vegetables ?? [],
        vendors: next.vendors ?? entry.vendors ?? [],
        savedAt: new Date().toISOString(),
        isUpdated: false,
        pendingUpdate: undefined,
        approvalOriginal: undefined,
        approvalRequestedAt: undefined,
      };
    });

    writeBookings(updated);
    setApprovalSelection(null);
    refreshPendingApprovals();
    setApprovalMessage("Changes approved successfully");
    window.setTimeout(() => setApprovalMessage(""), 2200);
  };

  const rejectSelectedUpdate = () => {
    if (!approvalSelection) return;

    const { booking } = approvalSelection;
    const bookings = readBookings();

    const updated = bookings.map((entry) => {
      if (String(entry.eventId) !== String(booking.eventId) || entry.version !== booking.version) {
        return entry;
      }

      return {
        ...entry,
        isUpdated: false,
        pendingUpdate: undefined,
        approvalOriginal: undefined,
        approvalRequestedAt: undefined,
      };
    });

    writeBookings(updated);
    setApprovalSelection(null);
    refreshPendingApprovals();
    setApprovalMessage("Changes rejected and reverted");
    window.setTimeout(() => setApprovalMessage(""), 2200);
  };

  const formatDates = (from: string, to?: string) => {
    const formatSingleDate = (dateStr: string) => {
      const parts = dateStr.split("-");
      const month = parts[1];
      const day = Number(parts[2]);
      const shortMonth = (englishMonths[month] || "").slice(0, 3);
      return `${day} ${shortMonth}`;
    };

    if (!to) return formatSingleDate(from);
    return `${formatSingleDate(from)}, ${formatSingleDate(to)}`;
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
      : events.filter((e) => e.fromDate === selectedDate || e.toDate === selectedDate);

  return (
    <div className="min-h-screen bg-gray-100">
      {approvalSelection && (
        <ApprovalReviewModal
          selection={approvalSelection}
          onConfirm={approveSelectedUpdate}
          onReject={rejectSelectedUpdate}
          onClose={() => setApprovalSelection(null)}
        />
      )}

      <Navbar />

      {approvalMessage && (
        <div className="fixed top-4 right-4 z-[80] bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
          {approvalMessage}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-2 flex justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1">
            Pending Approval: {pendingApprovalIds.length}
          </span>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium py-1">
          <LogoutIcon />
          Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-3 px-2 sm:px-4">
        <div
          className="overflow-x-auto snap-x snap-mandatory scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="flex gap-2 sm:gap-3 w-max min-w-full">
            <div
              onClick={() => setSelectedDate(null)}
              className={`min-w-[64px] sm:min-w-[72px] text-center cursor-pointer rounded-lg px-2 sm:px-3 py-2 font-semibold flex-shrink-0 snap-start transition-all duration-200 ${
                selectedDate === null ? "bg-green-700 text-white shadow" : "bg-white text-gray-700 shadow-sm hover:bg-green-50"
              }`}
            >
              <div className="text-sm sm:text-base">All</div>
            </div>

            {dates.map((date) => {
              const parts = date.split("-");
              const day = Number(parts[2]);
              const month = parts[1];
              const shortMonth = (englishMonths[month] || "").slice(0, 3);
              const isToday = new Date().toISOString().split("T")[0] === date;

              return (
                <div
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`min-w-[64px] sm:min-w-[72px] text-center cursor-pointer rounded-lg px-2 sm:px-3 py-2 font-semibold flex-shrink-0 snap-start transition-all duration-200 ${
                    selectedDate === date ? "bg-green-700 text-white shadow" : "bg-white text-gray-700 shadow-sm hover:bg-green-50"
                  }`}
                >
                  <div className="text-sm sm:text-base leading-none font-bold">{day}</div>
                  <div className="text-[10px] sm:text-xs mt-0.5 opacity-80">{shortMonth}</div>
                  {isToday && <div className="w-1 h-1 bg-red-500 rounded-full mx-auto mt-1" />}
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      <div className="flex justify-center mt-10">
        <h1 onClick={openCreateEvent} className="text-2xl md:text-3xl font-bold text-green-700 cursor-pointer">
          BOOK MAHAL
        </h1>
      </div>

      {isAdmin && (
        <div className="mt-6">
          <ManagerAccordion managers={managers} onAdd={addManager} onDelete={deleteManager} onUpdate={updateManager} />
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-2 px-4 flex gap-6 pb-24 items-start">
        {isAdmin && <ManagerSidebar managers={managers} onAdd={addManager} onDelete={deleteManager} onUpdate={updateManager} />}

        <div className="flex-1 min-w-0">
          {filteredEvents.length === 0 && <p className="text-center mt-20 text-gray-500 text-lg">No Events for this date</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const hasPendingApproval = pendingApprovalIds.includes(String(event.id));

              return (
                <div
                  key={event.id}
                  onClick={() => (hasPendingApproval ? openApprovalForEvent(event) : openFoodBooking(event.id))}
                  className={`bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition relative cursor-pointer ${
                    hasPendingApproval ? "ring-2 ring-red-200" : ""
                  }`}
                >
                  {hasPendingApproval && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="inline-flex items-center rounded-full bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 shadow-md animate-pulse">
                        Pending Approval
                      </span>
                    </div>
                  )}

                  <img src={event.image || "/images/mahal1.jpg"} className="w-full h-60 object-cover" alt={event.nameEnglish || "Mahal"} />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFoodView(event.id);
                    }}
                    className="absolute top-[240px] left-0 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
                  >
                    view menu
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/event-sheets");
                    }}
                    className="absolute top-[240px] right-0 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
                  >
                    assign vendor
                  </button>

                  {hasPendingApproval && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openApprovalForEvent(event);
                      }}
                      className="absolute top-[300px] left-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
                    >
                      Review
                    </button>
                  )}

                  <div className="p-5">
                    <h2 className="text-green-700 font-bold text-lg mb-1 text-center">
                      {event.nameEnglish || "Mahal Name"}
                    </h2>
                    <p className="text-sm font-medium text-center">DATE : {formatDates(event.fromDate, event.toDate)}</p>
                    <p className="text-sm text-center mb-1">{getMonthLabel(event.fromDate, event.toDate)}</p>
                    <p className="text-sm text-center mb-3">{event.location || "Location"}</p>
                    <div className="border-t border-gray-100 my-2" />
                    <div className="flex items-center gap-1.5 mt-2">
                      <PhoneIcon />
                      <span className="text-xs text-gray-600">
                        {event.userId || <span className="text-gray-400">Phone not set</span>}
                      </span>
                    </div>
                    <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
                      <PasswordRow password={event.password || ""} />
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditEvent(event.id);
                      }}
                      className="absolute top-[361px] right-16 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors z-10"
                    >
                      Edit
                    </button>
                  )}

                  {isAdmin &&
                    (isMobile ? (
                      <HoldDeleteButton onDelete={() => deleteEvent(event.id)} />
                    ) : (
                      <InlineDeleteButton onDelete={() => deleteEvent(event.id)} />
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isAdmin && (
        <button onClick={openCreateEvent} className="fixed bottom-6 right-6 bg-green-700 text-white w-14 h-14 rounded-full text-3xl shadow-lg flex items-center justify-center z-50">
          +
        </button>
      )}
    </div>
  );
};

export default Dashboard;
