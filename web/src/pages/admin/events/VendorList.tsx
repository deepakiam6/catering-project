import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { FaDownload, FaPlus, FaTrash } from "react-icons/fa";

/* ─────────────────────────── Types ─────────────────────────── */

export type PaidStatus = "Paid" | "Unpaid" | "Nill";

export type Vendor = {
  role: string;
  phone: string;
  assignedVendor: string;
  payment: string;
  advance: string;
  balance: string;
  paidStatus: PaidStatus;
  paidBy: string;
  paidDate: string;
};

interface VendorListProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  savedVendors: Vendor[] | null;
  setSavedVendors: React.Dispatch<React.SetStateAction<Vendor[] | null>>;
  eventName?: string;
  location?: string;
  session?: string;
  displayTime?: string;
}

type VendorField = keyof Vendor;

/* ─────────────────────────── Constants ─────────────────────────── */

const STORAGE_KEY = "vendors_v2";
const PAID_BY_OPTIONS = ["Murugan", "Selvam", "Rajan", "Priya", "Karthik"];
const PAID_STATUS_OPTIONS: PaidStatus[] = ["Nill", "Unpaid", "Paid"];

const DEFAULT_ROLES = [
  "Sweet",
  "Water (20L)",
  "இலை (Banana Leaf)",
  "பால், தயிர் (Milk, Curd)",
  "மார்க்கெட் (Market/Vegetables)",
  "மளிகை (Groceries)",
  "300 ml (Water Bottles/Drinks)",
  "பாத்திரம் (சுத்தம்)",
  "Idly / Puttu / Idiyappam",
  "Sevai",
  "PSR",
  "Kavin",
  "Ice Cream / Beeda",
  "Kerala Kuluki",
  "Pizza",
  "Meal Master",
  "Tea Master",
  "Pulka Master",
  "Tikka Master",
  "Catering Boys",
  "Catering Girls",
  "Hospitality",
  "Catering Boy",
  "Supplier",
  "Cleaning",
  "Happy Tea Stall",
  "Auto / Transport",
];

/* ─────────────────────────── Helpers ─────────────────────────── */

const calcBalance = (payment: string, advance: string): string => {
  const p = parseFloat(payment) || 0;
  const a = parseFloat(advance) || 0;
  if (p === 0 && a === 0) return "";
  return String(p - a);
};

const createVendor = (role = ""): Vendor => ({
  role,
  phone: "",
  assignedVendor: "",
  payment: "",
  advance: "",
  balance: "",
  paidStatus: "Nill",
  paidBy: "",
  paidDate: "",
});

const fmtINR = (val: string | number) =>
  `₹${Number(val).toLocaleString("en-IN")}`;

/* ─────────────────────────── Shared styles ─────────────────────────── */

const inputCls =
  "w-full border-0 bg-transparent px-3 py-2.5 text-sm text-green-950 outline-none placeholder:text-green-300 focus:bg-green-50";

const viewCls =
  "flex min-h-[44px] items-center px-3 py-2 text-sm text-green-950";

const thCls =
  "border-b border-r border-green-200 px-3 py-3 text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 whitespace-nowrap last:border-r-0";

const tdCls = "border-b border-r border-green-100 align-middle last:border-r-0";

/* ─────────────────────────── Column config ─────────────────────────── */
// 11 columns total — widths must sum >= minWidth on table
const COLS = [
  { width: 52  }, // 0  S.No
  { width: 215 }, // 1  Role
  { width: 145 }, // 2  Phone
  { width: 158 }, // 3  Assigned Vendor
  { width: 128 }, // 4  Payment
  { width: 128 }, // 5  Advance
  { width: 128 }, // 6  Balance  ← read-only
  { width: 116 }, // 7  Paid Status
  { width: 128 }, // 8  Paid By
  { width: 136 }, // 9  Paid Date
  { width: 58  }, // 10 Del
];
const TABLE_MIN_WIDTH = COLS.reduce((s, c) => s + c.width, 0); // 1392

/* ═══════════════════════════════════════════════════════════════
   Inline Dropdown
═══════════════════════════════════════════════════════════════ */

interface InlineDropdownProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void;
}

const InlineDropdown = ({
  value,
  options,
  placeholder = "Select…",
  onChange,
  onKeyDown,
}: InlineDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-1 px-3 py-2.5 text-sm outline-none bg-transparent focus:bg-green-50"
      >
        <span className={value ? "text-green-950 truncate" : "text-green-300 text-sm"}>
          {value || placeholder}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-green-500 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 left-0 top-full mt-0.5 w-max min-w-full rounded-lg border border-green-200 bg-white shadow-xl overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-sm transition hover:bg-green-50 ${
                value === opt ? "bg-green-100 font-semibold text-green-800" : "text-green-950"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Status Badge
═══════════════════════════════════════════════════════════════ */

const statusStyle: Record<PaidStatus, string> = {
  Paid:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Unpaid: "bg-red-100 text-red-600 border border-red-200",
  Nill:   "bg-gray-100 text-gray-500 border border-gray-200",
};

const StatusBadge = ({ status }: { status: PaidStatus }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[status]}`}>
    {status}
  </span>
);

/* ═══════════════════════════════════════════════════════════════
   Main VendorList Component
═══════════════════════════════════════════════════════════════ */

const VendorList = ({
  vendors,
  setVendors,
  savedVendors,
  setSavedVendors,
  eventName = "",
  location = "",
  session = "",
  displayTime = "",
}: VendorListProps) => {
  const didInitRef = useRef(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [editingRow, setEditingRow]     = useState<number | null>(null);
  const [editingField, setEditingField] = useState<VendorField>("role");
  const [rowSnapshot, setRowSnapshot]   = useState<Vendor | null>(null);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  // Tab-order for keyboard nav (balance is read-only, excluded)
  const fields: VendorField[] = [
    "role", "phone", "assignedVendor",
    "payment", "advance",
    "paidStatus", "paidBy", "paidDate",
  ];

  /* ── Init from localStorage ── */
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Vendor[];
        if (Array.isArray(parsed)) {
          const migrated = parsed.map(v => ({
            ...createVendor(), ...v,
            balance: calcBalance(v.payment ?? "", v.advance ?? ""),
          }));
          setVendors(migrated);
          setSavedVendors(migrated);
          return;
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }
    const init = DEFAULT_ROLES.map(r => createVendor(r));
    setVendors(init);
    setSavedVendors(init);
  }, [setSavedVendors, setVendors]);

  /* ── Persist on every change ── */
  useEffect(() => {
    if (!didInitRef.current) return;
    const safe = vendors.map(v => ({ ...v }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    setSavedVendors(safe);
  }, [vendors, setSavedVendors]);

  useEffect(() => {
    if (highlightedRow === null) return;
    const t = window.setTimeout(() => setHighlightedRow(null), 1800);
    return () => window.clearTimeout(t);
  }, [highlightedRow]);

  /* ── Auto-focus active cell ── */
  useEffect(() => {
    if (editingRow === null) return;
    const node = inputRefs.current[`${editingRow}-${editingField}`];
    if (node) requestAnimationFrame(() => { node.focus(); node.select(); });
  }, [editingField, editingRow]);

  const printableVendors = useMemo(
    () => (savedVendors ?? vendors).filter(v =>
      v.role?.trim() || v.phone?.trim() || v.assignedVendor?.trim() ||
      v.payment?.trim() || v.advance?.trim()
    ),
    [savedVendors, vendors]
  );

  /* ── Edit helpers ── */
  const setInputRef = (ri: number, field: VendorField, node: HTMLInputElement | null) => {
    inputRefs.current[`${ri}-${field}`] = node;
  };

  const beginEdit = (ri: number, field: VendorField = "role") => {
    setEditingRow(ri);
    setEditingField(field);
    setRowSnapshot({ ...vendors[ri] });
  };

  const cancelEdit = () => {
    if (editingRow !== null && rowSnapshot) {
      const up = [...vendors];
      up[editingRow] = rowSnapshot;
      setVendors(up);
    }
    setEditingRow(null);
    setEditingField("role");
    setRowSnapshot(null);
  };

  const finishEdit = () => {
    setEditingRow(null);
    setEditingField("role");
    setRowSnapshot(null);
  };

  const updateVendor = <K extends VendorField>(ri: number, field: K, value: Vendor[K]) => {
    const up = [...vendors];
    const next = { ...up[ri], [field]: value };
    if (field === "payment" || field === "advance") {
      next.balance = calcBalance(
        field === "payment" ? (value as string) : next.payment,
        field === "advance" ? (value as string) : next.advance,
      );
    }
    up[ri] = next;
    setVendors(up);
  };

  const addVendor = () => {
    const ni = vendors.length;
    setVendors(p => [...p, createVendor()]);
    setHighlightedRow(ni);
    requestAnimationFrame(() => beginEdit(ni, "role"));
  };

  const deleteVendor = (i: number) => {
    setVendors(p => p.filter((_, idx) => idx !== i));
    if (editingRow === i) {
      setEditingRow(null); setEditingField("role"); setRowSnapshot(null);
    } else if (editingRow !== null && i < editingRow) {
      setEditingRow(editingRow - 1);
    }
  };

  /* ── Keyboard navigation ── */
  const handleEnter = (ri: number, field: VendorField) => {
    const ci = fields.indexOf(field);
    if (ci < fields.length - 1) { setEditingField(fields[ci + 1]); return; }
    if (ri === vendors.length - 1) {
      const ni = vendors.length;
      setVendors(p => [...p, createVendor()]);
      setHighlightedRow(ni);
      setEditingRow(ni);
      setEditingField("role");
      setRowSnapshot(createVendor());
      return;
    }
    finishEdit();
  };

  const handleCellKeyDown = (e: KeyboardEvent<HTMLInputElement>, ri: number, field: VendorField) => {
    if (e.key === "Enter")  { e.preventDefault(); handleEnter(ri, field); }
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
  };

  const handleDropdownKeyDown = (e: KeyboardEvent<HTMLButtonElement>, ri: number, field: VendorField) => {
    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    if (e.key === "Enter")  { e.preventDefault(); handleEnter(ri, field); }
  };

  /* ── Live totals ── */
  const totals = useMemo(() => {
    const payment = vendors.reduce((s, v) => s + (parseFloat(v.payment) || 0), 0);
    const advance = vendors.reduce((s, v) => s + (parseFloat(v.advance) || 0), 0);
    return { payment, advance, balance: payment - advance };
  }, [vendors]);

  /* ── Print / PDF ── */
  const openPrintWindow = (autoPrint = false) => {
    const totalPayment = printableVendors.reduce((s, v) => s + (parseFloat(v.payment) || 0), 0);
    const totalAdvance = printableVendors.reduce((s, v) => s + (parseFloat(v.advance) || 0), 0);
    const totalBalance = totalPayment - totalAdvance;

    const printRows = printableVendors.map((v, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td>${v.role || "—"}</td>
        <td>${v.phone || "—"}</td>
        <td>${v.assignedVendor || "—"}</td>
        <td style="text-align:right">${v.payment ? fmtINR(v.payment) : "—"}</td>
        <td style="text-align:right">${v.advance ? fmtINR(v.advance) : "—"}</td>
        <td style="text-align:right;font-weight:600;color:${parseFloat(v.balance) < 0 ? "#dc2626" : "#166534"}">
          ${v.balance !== "" ? fmtINR(v.balance) : "—"}
        </td>
        <td style="text-align:center">
          <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;
            background:${v.paidStatus === "Paid" ? "#d1fae5" : v.paidStatus === "Unpaid" ? "#fee2e2" : "#f3f4f6"};
            color:${v.paidStatus === "Paid" ? "#065f46" : v.paidStatus === "Unpaid" ? "#991b1b" : "#6b7280"}">
            ${v.paidStatus}
          </span>
        </td>
        <td>${v.paidBy || "—"}</td>
        <td>${v.paidDate
          ? new Date(v.paidDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "—"}</td>
      </tr>`).join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`<!DOCTYPE html><html><head>
      <title>Vendor List</title>
      <meta charset="UTF-8"/>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        @page{size:A4 landscape;margin:10mm}
        body{font-family:"Segoe UI",sans-serif;background:#fff;color:#1a3d2b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .page{width:100%;max-width:1200px;margin:0 auto}
        .navbar-inner{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:10px}
        .navbar-left{width:110px;text-align:center;flex-shrink:0}
        .navbar-left img{width:68px;height:68px;object-fit:contain;display:block;margin:0 auto 6px}
        .navbar-left p{font-size:11px;color:#6b8f79;letter-spacing:.08em}
        .navbar-center{flex:1;text-align:center}
        .navbar-center h1{font-size:20px;font-weight:800;color:#198754;margin-bottom:2px}
        .address{font-size:12px;color:#4b6355;margin-bottom:2px}
        .phones{font-size:13px;font-weight:700;color:#1a3d2b;margin-bottom:4px}
        .socials{display:flex;justify-content:center;gap:10px;font-size:11px;margin-bottom:3px}
        .socials a{color:#355b46;text-decoration:none}
        .si{display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:2px;margin-right:3px;font-size:9px;font-weight:700;color:#fff;vertical-align:middle}
        .si.fb{background:#1877f2}.si.ig{background:#e1306c}.si.em{background:#6c757d}
        .tagline{font-size:11px;color:#6b8f79;font-weight:600}
        .navbar-right{width:120px;display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0}
        .navbar-right img:first-child{width:48px;height:48px;object-fit:contain}
        .navbar-right img:last-child{width:72px;height:72px;object-fit:contain}
        .navbar-bar{height:5px;background:#198754;border-radius:2px;margin-bottom:10px}
        .meta-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
        .meta-card{border:1px solid #d7eadf;background:#f6fcf8;border-radius:7px;padding:7px 10px}
        .meta-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6b8f79;margin-bottom:2px}
        .meta-value{font-size:12px;font-weight:600;color:#1a3d2b}
        table{width:100%;border-collapse:collapse;font-size:11.5px}
        th,td{border:1px solid #cfe5d7;padding:6px 9px;text-align:left}
        th{background:#e6f7ed;color:#166534;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
        tbody tr:nth-child(even){background:#fbfffc}
        tfoot td{background:#e6f7ed;font-weight:700;color:#166534;border-top:2px solid #198754}
        .footer{margin-top:16px;padding-top:8px;border-top:1px solid #d7eadf;font-size:11px;color:#6b8f79;text-align:center}
        @media print{body{background:#fff}.page{max-width:100%}}
      </style>
    </head><body><div class="page">
      <div class="navbar-inner">
        <div class="navbar-left"><img src="/images/owner.png" alt="Owner"/><p>EST - 1989</p></div>
        <div class="navbar-center">
          <h1>MRS கேட்டரிங்ஸ் <sup style="font-size:10px">®</sup></h1>
          <p class="address">கோபி, ஈரோடு - 638456</p>
          <p class="phones">99655 55317 &nbsp;|&nbsp; 98427 55317</p>
          <div class="socials">
            <a href="#"><span class="si fb">f</span>MRS Caterings</a>
            <a href="#"><span class="si ig">i</span>mrs_caterings</a>
            <a href="#"><span class="si em">✉</span>mrscatering1989@gmail.com</a>
          </div>
          <p class="tagline">Premium Wedding · Traditional Events · Outdoor Catering</p>
        </div>
        <div class="navbar-right">
          <img src="/images/association.png" alt="Association"/>
          <img src="/images/whatsapp.png" alt="WhatsApp"/>
        </div>
      </div>
      <div class="navbar-bar"></div>
      <div class="meta-bar">
        <div class="meta-card"><div class="meta-label">Event</div><div class="meta-value">${eventName || "—"}</div></div>
        <div class="meta-card"><div class="meta-label">Location</div><div class="meta-value">${location || "—"}</div></div>
        <div class="meta-card"><div class="meta-label">Session</div><div class="meta-value">${session || "—"}</div></div>
        <div class="meta-card"><div class="meta-label">Time</div><div class="meta-value">${displayTime || "—"}</div></div>
      </div>
      <table>
        <thead><tr>
          <th style="text-align:center;width:36px">SI</th>
          <th>Role</th>
          <th>Phone</th>
          <th>Assigned Vendor</th>
          <th style="text-align:right">Payment (₹)</th>
          <th style="text-align:right">Advance (₹)</th>
          <th style="text-align:right">Balance (₹)</th>
          <th style="text-align:center">Status</th>
          <th>Paid By</th>
          <th>Paid Date</th>
        </tr></thead>
        <tbody>
          ${printRows || `<tr><td colspan="10" style="text-align:center;color:#6b8f79;padding:16px">No vendor data available</td></tr>`}
        </tbody>
        <tfoot><tr>
          <td colspan="4" style="text-align:right;font-size:11px;letter-spacing:.04em">TOTALS</td>
          <td style="text-align:right">${fmtINR(totalPayment)}</td>
          <td style="text-align:right">${fmtINR(totalAdvance)}</td>
          <td style="text-align:right;color:${totalBalance < 0 ? "#dc2626" : "#166534"}">${fmtINR(totalBalance)}</td>
          <td colspan="3"></td>
        </tr></tfoot>
      </table>
      <div class="footer">MRS Caterings &bull; Vendor List &bull; Printed on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
    </div></body></html>`);

    win.document.close();
    win.focus();
    if (autoPrint) setTimeout(() => win.print(), 400);
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Top header bar ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-green-700 flex-wrap shrink-0">
        <h2 className="text-white font-bold text-base tracking-wide">Vendor List</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={addVendor}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <FaPlus size={10} /> Add Row
          </button>
          <button
            onClick={() => openPrintWindow(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <FaDownload size={12} /> Download PDF
          </button>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="flex flex-wrap items-center gap-5 px-5 py-2.5 bg-green-50 border-b border-green-100 shrink-0">
        {[
          { label: "Total Payment", value: fmtINR(totals.payment), cls: "text-green-900" },
          { label: "Total Advance", value: fmtINR(totals.advance), cls: "text-green-900" },
          {
            label: "Total Balance",
            value: fmtINR(totals.balance),
            cls: totals.balance < 0 ? "text-red-600" : "text-emerald-700",
          },
        ].map((item, i) => (
          <div key={item.label} className="flex items-center gap-4">
            {i > 0 && <div className="h-4 w-px bg-green-200" />}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                {item.label}
              </span>
              <span className={`text-sm font-bold ${item.cls}`}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Scrollable table ── */}
      <div className="overflow-auto">
        {/*
          KEY LAYOUT RULES:
          • tableLayout:"fixed"  → browser MUST honour colgroup widths exactly
          • minWidth on table    → prevents the outer div from constraining columns
          • border-r on th/td   → visible column separators
          • overflow-auto on wrapper → horizontal scroll if viewport is too narrow
        */}
        <table
          className="border-collapse"
          style={{ width: `${TABLE_MIN_WIDTH}px`, minWidth: `${TABLE_MIN_WIDTH}px`, tableLayout: "fixed" }}
        >
          <colgroup>
            {COLS.map((c, i) => (
              <col key={i} style={{ width: `${c.width}px` }} />
            ))}
          </colgroup>

          {/* ── Sticky header ── */}
          <thead>
            <tr>
              <th className={`${thCls} text-center`}>S.No</th>
              <th className={`${thCls} text-left`}>Role</th>
              <th className={`${thCls} text-left`}>Phone Number</th>
              <th className={`${thCls} text-left`}>Assigned Vendor</th>
              <th className={`${thCls} text-right`}>Payment (₹)</th>
              <th className={`${thCls} text-right`}>Advance (₹)</th>
              <th className={`${thCls} text-right`}>Balance (₹)</th>
              <th className={`${thCls} text-center`}>Status</th>
              <th className={`${thCls} text-left`}>Paid By</th>
              <th className={`${thCls} text-left`}>Paid Date</th>
              <th className={`${thCls} text-center`}>Del</th>
            </tr>
          </thead>

          {/* ── Body rows ── */}
          <tbody>
            {vendors.map((vendor, ri) => {
              const isEditing = editingRow === ri;
              const balNum = parseFloat(vendor.balance);
              const balCls =
                vendor.balance === ""
                  ? "text-green-300"
                  : balNum < 0
                  ? "text-red-600 font-bold"
                  : "text-emerald-700 font-bold";

              const rowBg =
                highlightedRow === ri
                  ? "bg-amber-50"
                  : isEditing
                  ? "bg-green-50"
                  : "bg-white hover:bg-green-50/50";

              return (
                <tr
                  key={ri}
                  onClick={() => !isEditing && beginEdit(ri, "role")}
                  className={`cursor-pointer transition-colors ${rowBg}`}
                >
                  {/* S.No */}
                  <td className={`${tdCls} text-center text-sm font-semibold text-green-800 py-2`}>
                    {ri + 1}
                  </td>

                  {/* Role */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("role") : beginEdit(ri, "role"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "role", n)} value={vendor.role}
                          onChange={e => updateVendor(ri, "role", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "role")}
                          onClick={e => e.stopPropagation()}
                          placeholder="Role" className={inputCls} />
                      : <div className={viewCls}>{vendor.role?.trim() || <span className="text-green-300">—</span>}</div>
                    }
                  </td>

                  {/* Phone */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("phone") : beginEdit(ri, "phone"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "phone", n)} value={vendor.phone}
                          onChange={e => updateVendor(ri, "phone", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "phone")}
                          onClick={e => e.stopPropagation()}
                          placeholder="Phone number" className={inputCls} />
                      : <div className={viewCls}>{vendor.phone?.trim() || <span className="text-green-300">—</span>}</div>
                    }
                  </td>

                  {/* Assigned Vendor */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("assignedVendor") : beginEdit(ri, "assignedVendor"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "assignedVendor", n)} value={vendor.assignedVendor}
                          onChange={e => updateVendor(ri, "assignedVendor", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "assignedVendor")}
                          onClick={e => e.stopPropagation()}
                          placeholder="Assigned vendor" className={inputCls} />
                      : <div className={viewCls}>{vendor.assignedVendor?.trim() || <span className="text-green-300">—</span>}</div>
                    }
                  </td>

                  {/* Payment */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("payment") : beginEdit(ri, "payment"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "payment", n)} type="number" min="0"
                          value={vendor.payment}
                          onChange={e => updateVendor(ri, "payment", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "payment")}
                          onClick={e => e.stopPropagation()}
                          placeholder="0" className={`${inputCls} text-right`} />
                      : <div className={`${viewCls} justify-end font-medium`}>
                          {vendor.payment?.trim() ? fmtINR(vendor.payment) : <span className="text-green-300">—</span>}
                        </div>
                    }
                  </td>

                  {/* Advance */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("advance") : beginEdit(ri, "advance"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "advance", n)} type="number" min="0"
                          value={vendor.advance}
                          onChange={e => updateVendor(ri, "advance", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "advance")}
                          onClick={e => e.stopPropagation()}
                          placeholder="0" className={`${inputCls} text-right`} />
                      : <div className={`${viewCls} justify-end font-medium`}>
                          {vendor.advance?.trim() ? fmtINR(vendor.advance) : <span className="text-green-300">—</span>}
                        </div>
                    }
                  </td>

                  {/* Balance — read-only */}
                  <td className={`${tdCls} px-3 py-2 text-right`}>
                    <span className={balCls}>
                      {vendor.balance !== ""
                        ? fmtINR(vendor.balance)
                        : <span className="text-green-300 font-normal">—</span>}
                    </span>
                  </td>

                  {/* Paid Status */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); if (!isEditing) beginEdit(ri, "paidStatus"); }}
                  >
                    {isEditing
                      ? <div onClick={e => e.stopPropagation()}>
                          <InlineDropdown
                            value={vendor.paidStatus}
                            options={PAID_STATUS_OPTIONS}
                            onChange={val => updateVendor(ri, "paidStatus", val as PaidStatus)}
                            onKeyDown={e => handleDropdownKeyDown(e, ri, "paidStatus")}
                          />
                        </div>
                      : <div className="flex items-center justify-center min-h-[44px] px-2">
                          <StatusBadge status={vendor.paidStatus} />
                        </div>
                    }
                  </td>

                  {/* Paid By */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); if (!isEditing) beginEdit(ri, "paidBy"); }}
                  >
                    {isEditing
                      ? <div onClick={e => e.stopPropagation()}>
                          <InlineDropdown
                            value={vendor.paidBy}
                            options={PAID_BY_OPTIONS}
                            placeholder="Select…"
                            onChange={val => updateVendor(ri, "paidBy", val)}
                            onKeyDown={e => handleDropdownKeyDown(e, ri, "paidBy")}
                          />
                        </div>
                      : <div className={viewCls}>
                          {vendor.paidBy?.trim() || <span className="text-green-300">—</span>}
                        </div>
                    }
                  </td>

                  {/* Paid Date */}
                  <td
                    className={`${tdCls} p-0`}
                    onClick={e => { e.stopPropagation(); isEditing ? setEditingField("paidDate") : beginEdit(ri, "paidDate"); }}
                  >
                    {isEditing
                      ? <input ref={n => setInputRef(ri, "paidDate", n)} type="date"
                          value={vendor.paidDate}
                          onChange={e => updateVendor(ri, "paidDate", e.target.value)}
                          onKeyDown={e => handleCellKeyDown(e, ri, "paidDate")}
                          onClick={e => e.stopPropagation()}
                          className={inputCls} />
                      : <div className={viewCls}>
                          {vendor.paidDate?.trim()
                            ? new Date(vendor.paidDate).toLocaleDateString("en-IN", {
                                day: "2-digit", month: "short", year: "numeric",
                              })
                            : <span className="text-green-300">—</span>}
                        </div>
                    }
                  </td>

                  {/* Delete */}
                  <td className={`${tdCls} py-2 text-center`}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); deleteVendor(ri); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete row ${ri + 1}`}
                    >
                      <FaTrash size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ─────────────────────────────────────────────────────────
              TOTALS FOOTER
              Columns:  0   1   2   3  | 4       5       6      | 7  8  9  10
                       S.No Role Phone Vendor | Pay    Adv     Bal   | Sta By  Date Del
              colSpan:       4          | 1       1       1      |    4
          ───────────────────────────────────────────────────────── */}
          <tfoot>
            <tr className="bg-green-50">
              {/* cols 0-3: label */}
              <td
                colSpan={4}
                className="border-t-2 border-b border-r border-green-300 px-4 py-3 text-right text-xs font-extrabold uppercase tracking-widest text-green-700"
              >
                Totals
              </td>
              {/* col 4: Payment total */}
              <td className="border-t-2 border-b border-r border-green-300 px-3 py-3 text-right text-sm font-bold text-green-900">
                {fmtINR(totals.payment)}
              </td>
              {/* col 5: Advance total */}
              <td className="border-t-2 border-b border-r border-green-300 px-3 py-3 text-right text-sm font-bold text-green-900">
                {fmtINR(totals.advance)}
              </td>
              {/* col 6: Balance total */}
              <td className={`border-t-2 border-b border-r border-green-300 px-3 py-3 text-right text-sm font-bold ${totals.balance < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {fmtINR(totals.balance)}
              </td>
              {/* cols 7-10: empty (Status, PaidBy, PaidDate, Del) */}
              <td colSpan={4} className="border-t-2 border-b border-green-300 bg-green-50" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default VendorList;