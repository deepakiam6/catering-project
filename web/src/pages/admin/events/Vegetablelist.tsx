import { useState, useRef, useEffect, useCallback } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

/* ── Predefined suggestions ──────────────────────────────── */
const SUGGESTIONS = [
  "மஞ்சள் தூள்", "குங்குமம்", "சந்தனம்", "விபூதி பாக்கெட்", "பத்தி பாக்கெட்",
  "கற்பூரம் பாக்கெட்", "சாம்பிராணி", "டேபிள் சால்ட்", "கல் உப்பு", "துவரம் பருப்பு",
  "கடலை பருப்பு", "வெ.உ. பருப்பு", "அவரை பருப்பு", "பட்டாணி பருப்பு", "பாசி பருப்பு",
  "பாசி பயிர்", "உடைத்த முந்திரி", "முழு முந்திரி", "சாரப்பருப்பு", "பாதாம் சீவல்",
  "பிஸ்தா சீவல்", "நந்தி மார்க் ஜிலேபி பருப்பு", "குண்டு உளுந்து", "சுண்டல்", "கடுகு",
  "மிளகு", "மிளகுத் தூள்", "சீரகம்", "சீரகத்தூள்", "வெந்தயம்", "கொத்தமல்லி",
  "கொத்தமல்லித் தூள்", "குண்டு மிளகாய்", "வரமிளகாய்", "மிளகாய் தூள்", "மோர் மிளகாய்",
  "புளி", "பெங்களூர் புளி", "மணத்தக்காளி வத்தல்", "பெருங்காயம்", "பெருங்காயம் பவுடர்",
  "ஜாதிக்காய்", "ஏலக்காய்", "பட்டை", "கிராம்பு", "சோம்பு", "கசகசா", "மலை பூண்டு",
  "ஜாதி பத்திரி", "ரோஜா மொக்கு", "மராட்டி மொக்கு", "அன்னாசி மொக்கு", "பிரெஞ்சு இலை",
  "ட்ரை திராட்சை", "பேரிச்சம்பழம்", "பச்சை கற்பூரம்", "வரகு", "தினை", "சாமை", "கம்பு",
  "உடைத்த கம்பு", "சிவப்பரிசி", "மாப்பிளை சம்பா", "குதிரைவாலி", "கோதுமை ரவை",
  "பச்சரிசி", "பொன்னி அரிசி", "இட்லி அரிசி", "ஐ ஆர்-20 அரிசி", "பிரியாணி அரிசி",
  "சீரக சம்பா", "பாஸ்மதி அரிசி", "சில்லி ஆரஞ்சு பவுடர்", "சில்லி சிக்கன் மசாலா",
  "கொட்டமுத்து (ஈமனுக்கு)", "சிறு ஜவ்வரிசி", "மீன் 65 மசாலா",
];

const UNITS = ["kg", "gm", "ltrs", "nos", "pkt", "box"];

type Row = { id: number; name: string; qty: string; unit: string };

let nextId = 1;
const makeRow = (): Row => ({ id: nextId++, name: "", qty: "", unit: "kg" });

/* ── Highlight matched substring ─────────────────────────── */
const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-green-200 text-green-900 rounded-sm px-0.5 font-bold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
};

/* ── Autocomplete Input ──────────────────────────────────── */
type AutocompleteProps = {
  value: string;
  onChange: (v: string) => void;
  usedNames: string[];
};

const AutocompleteInput = ({ value, onChange, usedNames }: AutocompleteProps) => {
  const [open, setOpen]         = useState(false);
  const [cursor, setCursor]     = useState(-1);
  const wrapRef                 = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);
  const listRef                 = useRef<HTMLUListElement>(null);

  const filtered = value.trim()
    ? SUGGESTIONS.filter(
        s =>
          s.toLowerCase().includes(value.toLowerCase()) &&
          !usedNames.includes(s)
      )
    : SUGGESTIONS.filter(s => !usedNames.includes(s));

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* scroll highlighted item into view */
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const item = listRef.current.children[cursor] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setCursor(-1);
    inputRef.current?.blur();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === "ArrowDown") { setOpen(true); setCursor(0); } return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); setCursor(c => Math.min(c + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter")      { if (cursor >= 0 && filtered[cursor]) select(filtered[cursor]); else setOpen(false); e.preventDefault(); }
    if (e.key === "Escape")     { setOpen(false); setCursor(-1); }
    if (e.key === "Tab")        { setOpen(false); }
  };

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder="பொருளின் பெயர்..."
        autoComplete="off"
        onChange={e => { onChange(e.target.value); setOpen(true); setCursor(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        className="
          w-full border border-green-200 rounded-xl px-3 py-2.5 text-sm text-green-900 bg-white
          outline-none placeholder-green-300
          focus:border-green-600 focus:ring-2 focus:ring-green-500/20
          transition-all duration-150
          font-medium
        "
      />

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="
            absolute z-50 left-0 right-0 mt-1.5
            bg-white border border-green-100 rounded-2xl shadow-xl shadow-green-900/10
            max-h-52 overflow-y-auto
            py-1.5
          "
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => select(s)}
              onMouseEnter={() => setCursor(i)}
              className={`
                px-3 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors duration-75
                ${cursor === i
                  ? "bg-green-600 text-white"
                  : "text-green-800 hover:bg-green-50"}
              `}
            >
              <span
                className={`
                  w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${cursor === i ? "bg-white/70" : "bg-green-400"}
                `}
              />
              <span className={cursor === i ? "" : ""}>
                {cursor === i
                  ? s
                  : <Highlight text={s} query={value} />
                }
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const VegetableList = () => {
  const [rows, setRows] = useState<Row[]>([makeRow()]);

  const usedNames = rows.map(r => r.name).filter(Boolean);

  const update = useCallback(
    (id: number, field: keyof Row, val: string) =>
      setRows(prev =>
        prev.map(r => (r.id === id ? { ...r, [field]: val } : r))
      ),
    []
  );

  const addRow    = () => setRows(prev => [...prev, makeRow()]);
  const removeRow = (id: number) =>
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));

  const filledCount = rows.filter(r => r.name.trim()).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-start justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl">

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-green-900/10 border border-green-100 overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg">
                  🛒
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg tracking-wide leading-tight">
                    Grocery / Vegetable List
                  </h1>
                  <p className="text-green-200 text-xs mt-0.5 font-medium">
                    பொருட்கள் பட்டியல்
                  </p>
                </div>
              </div>
              {filledCount > 0 && (
                <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30">
                  {filledCount} item{filledCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* ── Column Headers ── */}
          <div className="grid grid-cols-[1fr_90px_76px_36px] gap-2 px-5 pt-4 pb-1.5">
            {["பொருள் / Item", "அளவு / Qty", "Unit", ""].map((h, i) => (
              <span
                key={i}
                className="text-[10px] font-extrabold uppercase tracking-widest text-green-500"
              >
                {h}
              </span>
            ))}
          </div>

          {/* ── Rows ── */}
          <div className="px-4 pb-3 flex flex-col gap-2">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_90px_76px_36px] gap-2 items-center group animate-fadeIn"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Name */}
                <AutocompleteInput
                  value={row.name}
                  onChange={v => update(row.id, "name", v)}
                  usedNames={usedNames.filter(n => n !== row.name)}
                />

                {/* Qty */}
                <input
                  type="text"
                  inputMode="decimal"
                  value={row.qty}
                  onChange={e => update(row.id, "qty", e.target.value)}
                  placeholder="0"
                  className="
                    border border-green-200 rounded-xl px-3 py-2.5 text-sm text-green-900 bg-white
                    outline-none placeholder-green-300 text-center font-semibold
                    focus:border-green-600 focus:ring-2 focus:ring-green-500/20
                    transition-all duration-150 w-full
                  "
                />

                {/* Unit */}
                <select
                  value={row.unit}
                  onChange={e => update(row.id, "unit", e.target.value)}
                  className="
                    border border-green-200 rounded-xl px-2 py-2.5 text-sm text-green-900 bg-white
                    outline-none font-semibold
                    focus:border-green-600 focus:ring-2 focus:ring-green-500/20
                    transition-all duration-150 w-full appearance-none text-center cursor-pointer
                  "
                >
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>

                {/* Delete */}
                <button
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  title="Remove row"
                  className="
                    w-9 h-9 flex items-center justify-center rounded-xl
                    text-red-300 hover:text-red-500 hover:bg-red-50
                    disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent
                    transition-all duration-150
                  "
                >
                  <FaTrash size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Divider ── */}
          <div className="mx-5 border-t border-green-50" />

          {/* ── Footer ── */}
          <div className="px-5 py-4 flex items-center justify-between">
            <button
              onClick={addRow}
              className="
                flex items-center gap-2
                bg-green-50 hover:bg-green-100 active:bg-green-200
                border border-green-200 hover:border-green-400
                text-green-700 font-semibold text-sm
                px-4 py-2.5 rounded-xl
                transition-all duration-150
                group
              "
            >
              <span className="
                w-5 h-5 rounded-lg bg-green-700 text-white
                flex items-center justify-center
                group-hover:scale-110 transition-transform
              ">
                <FaPlus size={8} />
              </span>
              Add Item
            </button>

            <div className="text-xs text-green-400 font-medium">
              {rows.filter(r => !r.name.trim()).length > 0
                ? `${rows.filter(r => !r.name.trim()).length} empty row${rows.filter(r => !r.name.trim()).length !== 1 ? "s" : ""}`
                : <span className="text-green-600 font-semibold">✓ All filled</span>
              }
            </div>
          </div>

          {/* ── Quick Stats ── */}
          {filledCount > 0 && (
            <div className="mx-5 mb-5 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex flex-wrap gap-3">
              {Object.entries(
                rows
                  .filter(r => r.name.trim())
                  .reduce<Record<string, number>>((acc, r) => {
                    acc[r.unit] = (acc[r.unit] || 0) + 1;
                    return acc;
                  }, {})
              ).map(([unit, count]) => (
                <div key={unit} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-green-700 font-semibold">
                    {count} × {unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tip ── */}
        <p className="text-center text-xs text-green-400 mt-4 font-medium">
          ↑ ↓ arrow keys to navigate · Enter to select · Esc to close
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.18s ease both; }
      `}</style>
    </div>
  );
};

export default VegetableList;