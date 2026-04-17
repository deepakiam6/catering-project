import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";

/* ── Types ─────────────────────────────────────────────── */
export type SessionOption = "Morning" | "Afternoon" | "Evening" | "Night";

export type DynamicTable = {
  id: string;
  rows: number;
  cols: number;
  data: string[][];
  createdAt: string;
};

export type EventSheet = {
  id: string;
  title: string;
  day: string;
  date: string;
  time: string;
  session: SessionOption;
  tables: DynamicTable[];
  vendorName: string;
  vendorPhone: string;
  createdAt: string;
  updatedAt: string;
};

/* ── Storage helpers ─────────────────────────────────────── */
export const STORAGE_KEY = "eventSheets";

export const readSheets = (): EventSheet[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.map((sheet) => ({
          ...sheet,
          day: sheet?.day ?? "",
          tables: Array.isArray(sheet?.tables) ? sheet.tables : [],
        }))
      : [];
  } catch {
    return [];
  }
};

const saveSheets = (sheets: EventSheet[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
};

const makeTable = (rows: number, cols: number): DynamicTable => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  rows,
  cols,
  data: Array.from({ length: rows }, () => Array(cols).fill("")),
  createdAt: new Date().toISOString(),
});

const makeSheet = (index: number): EventSheet => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2),
  title: `Event Sheet ${index}`,
  day: "",
  date: "",
  time: "",
  session: "Morning",
  tables: [],
  vendorName: "",
  vendorPhone: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/* ── Word limiter ─────────────────────────────────────────── */
const limitWords = (value: string, max: number): string => {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length <= max) return value;
  return words.slice(0, max).join(" ");
};

/* ── Icons ───────────────────────────────────────────────── */
const TrashIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const ResetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
  </svg>
);

const TableIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

/* ── Create Table Modal ───────────────────────────────────── */
const CreateTableModal = ({
  onConfirm,
  onClose,
}: {
  onConfirm: (rows: number, cols: number) => void;
  onClose: () => void;
}) => {
  const [rows, setRows] = useState<string>("3");
  const [cols, setCols] = useState<string>("3");
  const [errors, setErrors] = useState<{ rows?: string; cols?: string }>({});
  const modalRef = useRef<HTMLDivElement>(null);

  const PRESETS = [
    { label: "2×2", r: 2, c: 2 },
    { label: "3×3", r: 3, c: 3 },
    { label: "4×4", r: 4, c: 4 },
    { label: "5×5", r: 5, c: 5 },
    { label: "3×5", r: 3, c: 5 },
    { label: "5×3", r: 5, c: 3 },
  ];

  const validate = () => {
    const r = parseInt(rows, 10);
    const c = parseInt(cols, 10);
    const errs: { rows?: string; cols?: string } = {};

    if (!rows || isNaN(r) || r < 1) errs.rows = "Min 1";
    else if (r > 10) errs.rows = "Max 10";

    if (!cols || isNaN(c) || c < 1) errs.cols = "Min 1";
    else if (c > 10) errs.cols = "Max 10";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onConfirm(parseInt(rows, 10), parseInt(cols, 10));
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") handleSubmit();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [rows, cols]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-stone-200 overflow-hidden"
        style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <TableIcon />
            </div>
            <span className="text-sm font-bold text-stone-800">Create New Table</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Quick Presets</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setRows(String(p.r));
                    setCols(String(p.c));
                    setErrors({});
                  }}
                  className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    rows === String(p.r) && cols === String(p.c)
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
              Custom Size (max 10)
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-semibold text-stone-500 mb-1 block">Rows</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={rows}
                  onChange={(e) => {
                    setRows(e.target.value);
                    setErrors((prev) => ({ ...prev, rows: undefined }));
                  }}
                  className={`w-full h-10 rounded-xl border text-sm font-medium text-stone-700 text-center outline-none transition-colors px-3 ${
                    errors.rows
                      ? "border-red-400 bg-red-50"
                      : "border-stone-200 bg-stone-50 focus:border-emerald-400 focus:bg-white"
                  }`}
                />
                {errors.rows && <p className="text-[10px] text-red-500 mt-0.5">{errors.rows}</p>}
              </div>

              <div className="text-stone-300 text-lg font-light mt-4">×</div>

              <div className="flex-1">
                <label className="text-[10px] font-semibold text-stone-500 mb-1 block">Columns</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={cols}
                  onChange={(e) => {
                    setCols(e.target.value);
                    setErrors((prev) => ({ ...prev, cols: undefined }));
                  }}
                  className={`w-full h-10 rounded-xl border text-sm font-medium text-stone-700 text-center outline-none transition-colors px-3 ${
                    errors.cols
                      ? "border-red-400 bg-red-50"
                      : "border-stone-200 bg-stone-50 focus:border-emerald-400 focus:bg-white"
                  }`}
                />
                {errors.cols && <p className="text-[10px] text-red-500 mt-0.5">{errors.cols}</p>}
              </div>
            </div>
          </div>

          {rows &&
            cols &&
            !errors.rows &&
            !errors.cols &&
            parseInt(rows, 10) > 0 &&
            parseInt(cols, 10) > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-xs text-emerald-700 font-medium text-center">
                Creates a {rows} × {cols} table with {parseInt(rows, 10) * parseInt(cols, 10)} cells
              </div>
            )}
        </div>

        <div className="px-5 py-4 border-t border-stone-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors shadow-sm active:scale-[0.98]"
          >
            Create Table
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

/* ── Dynamic Table Component ─────────────────────────────── */
const DynamicTableBlock = ({
  table,
  onUpdate,
  onDelete,
  onReset,
}: {
  table: DynamicTable;
  tableIndex: number;
  onUpdate: (updated: DynamicTable) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);

  const updateCell = (r: number, c: number, value: string) => {
    const limited = limitWords(value, 15);
    const newData = table.data.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? limited : cell)) : row
    );

    onUpdate({ ...table, data: newData });
  };

  const cellKey = (r: number, c: number) => `${r}-${c}`;

  const addRow = () => {
    const newRow = Array(table.cols).fill("");
    const newData = [...table.data, newRow];

    onUpdate({
      ...table,
      rows: table.rows + 1,
      data: newData,
    });
  };

  const addColumn = () => {
    const newData = table.data.map((row) => [...row, ""]);

    onUpdate({
      ...table,
      cols: table.cols + 1,
      data: newData,
    });
  };

  const deleteRow = () => {
    if (table.rows <= 1) return;

    const newData = table.data.slice(0, -1);

    onUpdate({
      ...table,
      rows: table.rows - 1,
      data: newData,
    });
  };

  const deleteColumn = () => {
    if (table.cols <= 1) return;

    const newData = table.data.map((row) => row.slice(0, -1));

    onUpdate({
      ...table,
      cols: table.cols - 1,
      data: newData,
    });
  };

  return (
    <div className="rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
            <TableIcon />
          </div>
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-widest">
            Table
          </span>
          <span className="text-[10px] text-stone-400 font-medium">
            {table.rows}×{table.cols}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          <button
            onClick={() => onReset(table.id)}
            title="Reset table data"
            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-amber-600 hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors font-semibold"
          >
            <ResetIcon /> Reset
          </button>

          <button
            onClick={addRow}
            className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold"
          >
            + Row
          </button>

          <button
            onClick={deleteRow}
            disabled={table.rows <= 1}
            className={`text-[10px] px-2 py-1 rounded font-semibold transition-colors ${
              table.rows <= 1
                ? "bg-red-50 text-red-300 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
          >
            <TrashIcon size={10} /> Row
          </button>

          <button
            onClick={addColumn}
            className="text-[10px] px-2 py-1 rounded bg-purple-50 text-purple-600 hover:bg-purple-100 font-semibold"
          >
            + Col
          </button>

          <button
            onClick={deleteColumn}
            disabled={table.cols <= 1}
            className={`text-[10px] px-2 py-1 rounded font-semibold transition-colors ${
              table.cols <= 1
                ? "bg-orange-50 text-orange-300 cursor-not-allowed"
                : "bg-orange-50 text-orange-600 hover:bg-orange-100"
            }`}
          >
            <TrashIcon size={10} /> Col
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400">Delete table?</span>
              <button
                onClick={() => onDelete(table.id)}
                className="text-[10px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-md font-semibold transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md font-semibold transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-stone-300 hover:text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
              title="Delete table"
            >
              <TrashIcon size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: `${table.cols * 120}px` }}>
          <tbody>
            {table.data.map((row, ri) => (
              <tr key={ri} className="group">
                {row.map((cell, ci) => {
                  const key = cellKey(ri, ci);
                  const isFocused = focusedCell === key;

                  return (
                    <td
                      key={ci}
                      className={`border border-stone-200 relative transition-colors ${
                        isFocused ? "bg-emerald-50/60 border-emerald-300" : "bg-white hover:bg-stone-50/80"
                      }`}
                      style={{ minWidth: 120, maxWidth: 200 }}
                    >
                      <input
                        type="text"
                        value={cell}
                        placeholder="Enter text..."
                        onFocus={() => setFocusedCell(key)}
                        onBlur={() => setFocusedCell(null)}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        className="w-full px-3 py-2.5 text-xs text-stone-700 bg-transparent outline-none placeholder-stone-300 resize-none leading-snug"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Single Event Sheet Card ─────────────────────────────── */
const EventSheetCard = ({
  sheet,
  onUpdate,
  onDelete,
  onAssignVendor,
}: {
  sheet: EventSheet;
  onUpdate: (updated: EventSheet) => void;
  onDelete: (id: string) => void;
  onAssignVendor: (id: string) => void;
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const updateField = <K extends keyof EventSheet>(key: K, value: EventSheet[K]) => {
    onUpdate({ ...sheet, [key]: value, updatedAt: new Date().toISOString() });
  };

  const handleAddTable = (rows: number, cols: number) => {
    const newTable = makeTable(rows, cols);
    onUpdate({
      ...sheet,
      tables: [...sheet.tables, newTable],
      updatedAt: new Date().toISOString(),
    });
    setShowModal(false);
  };

  const handleUpdateTable = (updated: DynamicTable) => {
    onUpdate({
      ...sheet,
      tables: sheet.tables.map((t) => (t.id === updated.id ? updated : t)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTable = (tableId: string) => {
    onUpdate({
      ...sheet,
      tables: sheet.tables.filter((t) => t.id !== tableId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResetTable = (tableId: string) => {
    onUpdate({
      ...sheet,
      tables: sheet.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              data: Array.from({ length: t.rows }, () => Array(t.cols).fill("")),
            }
          : t
      ),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <>
      {showModal && <CreateTableModal onConfirm={handleAddTable} onClose={() => setShowModal(false)} />}

      <div className="bg-white rounded-[20px] border border-stone-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.11)] transition-shadow duration-300 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <input
              type="text"
              value={sheet.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="text-sm font-bold text-stone-800 bg-transparent outline-none border-b border-transparent focus:border-emerald-400 transition-colors w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500">Delete?</span>
                <button
                  onClick={() => onDelete(sheet.id)}
                  className="text-[11px] bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded-md font-semibold transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-md font-semibold transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                title="Delete sheet"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 flex-1 flex flex-col gap-4">
          <div className="rounded-[18px] border border-stone-200 bg-stone-50/70 p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">Day</label>
                <select
                  value={sheet.day}
                  onChange={(e) => updateField("day", e.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white appearance-none cursor-pointer"
                >
                  <option value="">Select day</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">Date</label>
                <input
                  type="date"
                  value={sheet.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-white text-sm font-medium text-stone-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-[0.22em] text-stone-500">Time</label>
                <input
                  type="time"
                  value={sheet.time}
                  onChange={(e) => updateField("time", e.target.value)}
                  className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 outline-none transition-colors focus:border-emerald-400 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {sheet.tables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 gap-2">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <TableIcon />
                </div>
                <p className="text-xs text-stone-400 font-medium text-center">
                  No tables yet. Click <span className="text-emerald-600 font-bold">+ Add Table</span> to create one.
                </p>
              </div>
            ) : (
              sheet.tables.map((table, idx) => (
                <DynamicTableBlock
                  key={table.id}
                  table={table}
                  tableIndex={idx}
                  onUpdate={handleUpdateTable}
                  onDelete={handleDeleteTable}
                  onReset={handleResetTable}
                />
              ))
            )}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold self-start transition-colors group"
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
              <PlusIcon />
            </span>
            Add Table
          </button>

          {(sheet.vendorName || sheet.vendorPhone) && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 flex items-center gap-2">
              <span className="text-emerald-600 text-base">🏪</span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">
                  Vendor Assigned
                </p>
                <p className="text-xs font-semibold text-stone-700">{sheet.vendorName || "—"}</p>
                {sheet.vendorPhone && <p className="text-xs text-stone-500">{sheet.vendorPhone}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 mt-auto">
          <button
            onClick={() => onAssignVendor(sheet.id)}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Assign Vendor
            <ChevronRightIcon />
          </button>
        </div>
      </div>
    </>
  );
};

/* ── Main EventSheets Page ───────────────────────────────── */
const EventSheets: React.FC = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<EventSheet[]>([]);

  useEffect(() => {
    setSheets(readSheets());
  }, []);

  const persistAndSet = useCallback((updated: EventSheet[]) => {
    saveSheets(updated);
    setSheets(updated);
  }, []);

  const addSheet = () => {
    const next = makeSheet(sheets.length + 1);
    persistAndSet([...sheets, next]);
  };

  const updateSheet = (updated: EventSheet) => {
    persistAndSet(sheets.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteSheet = (id: string) => {
    persistAndSet(sheets.filter((s) => s.id !== id));
  };

  const handleAssignVendor = (id: string) => {
    navigate(`/assign-vendor/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-emerald-600 mb-1">
              Admin Panel
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">Assign Vendor</h1>
            <p className="text-sm text-stone-500 mt-1">
              {sheets.length === 0
                ? "No sheets yet. Click + to create your first."
                : `${sheets.length} sheet${sheets.length > 1 ? "s" : ""} created`}
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {sheets.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl">
              📋
            </div>
            <p className="text-stone-400 text-sm font-medium text-center max-w-xs">
              No event sheets yet. Tap the <span className="font-bold text-emerald-600">+</span> button below to
              create your first sheet.
            </p>
          </div>
        </div>
      )}

      {sheets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sheets.map((sheet) => (
              <EventSheetCard
                key={sheet.id}
                sheet={sheet}
                onUpdate={updateSheet}
                onDelete={deleteSheet}
                onAssignVendor={handleAssignVendor}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={addSheet}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-full shadow-[0_8px_24px_rgba(4,120,87,0.38)] flex items-center justify-center transition-all duration-200"
        title="Create new event sheet"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
};

export default EventSheets;
