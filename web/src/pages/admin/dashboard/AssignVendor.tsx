import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { readSheets, STORAGE_KEY } from "./Eventsheets";
import type { EventSheet, DynamicTable } from "./Eventsheets";
import { useBackNavigation } from "../../../hooks/useBackNavigation";

/* ── Read-only Dynamic Table Preview ────────────────────── */
const TablePreview = ({ table, index }: { table: DynamicTable; index: number }) => {
  return (
    <div className="rounded-2xl border border-stone-200 overflow-hidden">
      {/* Table label bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
              fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-stone-600 uppercase tracking-widest">
            Table {index + 1}
          </span>
        </div>
        <span className="text-[10px] text-stone-400 font-semibold bg-stone-100 px-2 py-0.5 rounded-full">
          {table.rows} × {table.cols}
        </span>
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: `${table.cols * 110}px` }}
        >
          <tbody>
            {table.data.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-stone-50/60"}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="border border-stone-100 px-3 py-2.5 text-sm text-stone-700 align-top"
                    style={{ minWidth: 110, maxWidth: 200 }}
                  >
                    {cell.trim() !== "" ? (
                      <span className="leading-snug">{cell}</span>
                    ) : (
                      <span className="text-stone-300 select-none">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── AssignVendor Page ───────────────────────────────────── */
const AssignVendor: React.FC = () => {
  const navigate = useNavigate();
  const goBack = useBackNavigation({ role: "admin" });
  const { id } = useParams<{ id: string }>();

  const [sheet, setSheet] = useState<EventSheet | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    const found = readSheets().find((s) => s.id === id) || null;
    setSheet(found);
    setVendorName(found?.vendorName || "");
    setVendorPhone(found?.vendorPhone || "");
  }, [id]);

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!vendorName.trim()) e.name = "Vendor name is required";
    if (!vendorPhone.trim()) e.phone = "Vendor phone is required";
    return e;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const all = readSheets();
    const updated = all.map((s) =>
      s.id === id
        ? {
            ...s,
            vendorName: vendorName.trim(),
            vendorPhone: vendorPhone.trim(),
            updatedAt: new Date().toISOString(),
          }
        : s
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSheet((prev) =>
      prev
        ? { ...prev, vendorName: vendorName.trim(), vendorPhone: vendorPhone.trim() }
        : prev
    );
    setSaved(true);
    setErrors({});
    setTimeout(() => setSaved(false), 2200);
  };

  /* ── Not found ── */
  if (!sheet) {
    return (
      <div className="min-h-screen bg-[#f5f2ed]">
        <Navbar />
        <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-4">
          <div className="w-full rounded-[28px] border border-stone-200 bg-white p-10 text-center shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Sheet Not Found</h1>
            <p className="text-sm text-stone-500 mb-6">
              This event sheet doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tableCount = sheet.tables?.length ?? 0;

  /* ── Main layout ── */
  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <Navbar />

      {/* Toast */}
      {saved && (
        <div className="fixed top-4 right-4 z-[80] flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Vendor saved successfully
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-emerald-600 mb-1">
              Assign Vendor
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
              {sheet.title}
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              Sheet ID:{" "}
              <span className="font-mono font-semibold text-stone-700">
                {sheet.id.slice(0, 10)}…
              </span>
            </p>
          </div>
          <button
            onClick={goBack}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors shadow-sm"
          >
            ← Back
          </button>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 items-start">

          {/* ── LEFT: Event Summary + Table Preview ── */}
          <section className="rounded-[24px] border border-stone-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 sm:p-6 flex flex-col gap-5">

            {/* Event meta pills */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400 mb-3">
                Event Summary
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: "Date", value: sheet.date || "Not set" },
                  { label: "Time", value: sheet.time || "Not set" },
                  { label: "Session", value: sheet.session },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-stone-100 bg-stone-50 px-3 py-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                      {label}
                    </p>
                    <p className="text-sm font-semibold text-stone-800 leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tables preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-stone-400">
                  Tables Preview
                </p>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  {tableCount} table{tableCount !== 1 ? "s" : ""}
                </span>
              </div>

              {tableCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-stone-200 bg-stone-50/60 gap-2">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                      fill="none" stroke="#a8a29e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                  </div>
                  <p className="text-sm text-stone-400 font-medium">No tables available</p>
                  <p className="text-xs text-stone-300 text-center max-w-[200px]">
                    Go back and add tables to this event sheet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sheet.tables.map((table, idx) => (
                    <TablePreview key={table.id} table={table} index={idx} />
                  ))}
                </div>
              )}
            </div>

            {/* Already assigned vendor info (read-only) */}
            {(sheet.vendorName || sheet.vendorPhone) && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">🏪</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-0.5">
                    Current Vendor
                  </p>
                  <p className="text-sm font-semibold text-stone-800">{sheet.vendorName || "—"}</p>
                  {sheet.vendorPhone && (
                    <p className="text-xs text-stone-500 mt-0.5">{sheet.vendorPhone}</p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ── RIGHT: Vendor Form ── */}
          <section className="rounded-[24px] border border-stone-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] p-5 sm:p-6 flex flex-col gap-5 sticky top-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600 mb-1">
                Vendor Assignment
              </p>
              <h2 className="text-xl font-bold text-stone-900">Vendor Details</h2>
              <p className="text-sm text-stone-500 mt-1">
                Enter vendor contact info and save to link them to this event sheet.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Vendor Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400 block mb-1.5">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="e.g. Sri Balaji Suppliers"
                  className={`w-full h-12 rounded-2xl border px-4 text-sm font-medium text-stone-700 outline-none transition-all bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    errors.name
                      ? "border-red-400"
                      : "border-stone-200 focus:border-emerald-400"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>
                )}
              </div>

              {/* Vendor Phone */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400 block mb-1.5">
                  Vendor Phone
                </label>
                <input
                  type="tel"
                  value={vendorPhone}
                  onChange={(e) => {
                    setVendorPhone(e.target.value);
                    setErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  placeholder="e.g. 98765 43210"
                  className={`w-full h-12 rounded-2xl border px-4 text-sm font-medium text-stone-700 outline-none transition-all bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    errors.phone
                      ? "border-red-400"
                      : "border-stone-200 focus:border-emerald-400"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 mt-auto pt-2">
              <button
                onClick={handleSave}
                className="w-full h-12 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {saved ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved!
                  </>
                ) : (
                  "Save Vendor"
                )}
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full h-12 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] text-stone-600 text-sm font-semibold transition-all"
              >
                Done
              </button>
              <button
                onClick={goBack}
                className="w-full h-10 text-xs text-stone-400 hover:text-stone-600 transition-colors font-medium"
              >
                ← Back to Event Sheets
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AssignVendor;
