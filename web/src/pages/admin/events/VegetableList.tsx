import { useRef, useState, useEffect } from "react";
import { FaPlus, FaPrint, FaSave, FaEdit, FaCheck, FaTimes, FaTrash } from "react-icons/fa";

/* ── Types ──────────────────────────────────────────────── */
export type Vegetable = { name: string; qty: string; unit: string; headingId?: string };

export type VegetableHeading = { id: string; label: string };

type EditField = "name" | "qty" | "unit";

type EditState = {
  index: number;
  name: string;
  qty: string;
  unit: string;
} | null;

type HighlightedRow = number | null;

/* ── Props ──────────────────────────────────────────────── */
interface VegetableListProps {
  vegetables: Vegetable[];
  setVegetables: React.Dispatch<React.SetStateAction<Vegetable[]>>;
  savedVegetables: Vegetable[] | null;
  setSavedVegetables: React.Dispatch<React.SetStateAction<Vegetable[] | null>>;
  eventName?: string;
  location?: string;
  session?: string;
  displayTime?: string;
  eventId?: string;
}

/* ── localStorage keys ───────────────────────────────────── */
export const getVegetablesStorageKey = (eventId?: string) => eventId ? `vegetables-${eventId}` : "vegetables";
export const getVegetableHeadingsStorageKey = (eventId?: string) => eventId ? `vegetable_headings-${eventId}` : "vegetable_headings";

/* ── localStorage helpers ────────────────────────────────── */
export function loadVegetables(eventId?: string): Vegetable[] {
  try {
    const raw = localStorage.getItem(getVegetablesStorageKey(eventId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Vegetable[];
  } catch {
    return [];
  }
}

export function saveVegetablesToStorage(data: Vegetable[], eventId?: string): void {
  try {
    localStorage.setItem(getVegetablesStorageKey(eventId), JSON.stringify(data));
  } catch {}
}

function saveHeadingsToStorage(data: VegetableHeading[], eventId?: string): void {
  try {
    localStorage.setItem(getVegetableHeadingsStorageKey(eventId), JSON.stringify(data));
  } catch {}
}

/* ── Default vegetable list ──────────────────────────────── */
const DEFAULT_VEGETABLES: Vegetable[] = [
  "மஞ்சள் தூள்",
  "குங்குமம்",
  "சந்தனம்",
  "விபூதி பாக்கெட்",
  "பத்தி பாக்கெட்",
  "கற்பூரம் பாக்கெட்",
  "சாம்பிராணி",
  "டேபிள் சால்ட்",
  "கல் உப்பு",
  "துவரம் பருப்பு",
  "கடலை பருப்பு",
  "வெ.உ. பருப்பு",
  "அவரை பருப்பு",
  "பட்டாணி பருப்பு",
  "பாசி பருப்பு",
  "பாசி பயிர்",
  "உடைத்த முந்திரி",
  "முழு முந்திரி",
  "சாரப்பருப்பு",
  "பாதாம் சீவல்",
  "பிஸ்தா சீவல்",
  "நந்தி மார்க் ஜிலேபி பருப்பு",
  "குண்டு உளுந்து",
  "சுண்டல்",
  "கடுகு",
  "மிளகு",
  "மிளகுத் தூள்",
  "சீரகம்",
  "சீரகத்தூள்",
  "வெந்தயம்",
  "கொத்தமல்லி",
  "கொத்தமல்லித் தூள்",
  "குண்டு மிளகாய்",
  "வரமிளகாய்",
  "மிளகாய் தூள்",
  "மோர் மிளகாய்",
  "புளி",
  "பெங்களூர் புளி",
  "மணத்தக்காளி வத்தல்",
  "பெருங்காயம்",
  "பெருங்காயம் பவுடர்",
  "ஜாதிக்காய்",
  "ஏலக்காய்",
  "பட்டை",
  "கிராம்பு",
  "சோம்பு",
  "கசகசா",
  "மலை பூண்டு",
  "ஜாதி பத்திரி",
  "ரோஜா மொக்கு",
  "மராட்டி மொக்கு",
  "அன்னாசி மொக்கு",
  "பிரெஞ்சு இலை",
  "ட்ரை திராட்சை",
  "பேரிச்சம்பழம்",
  "பச்சை கற்பூரம்",
  "வரகு",
  "தினை",
  "சாமை",
  "கம்பு",
  "உடைத்த கம்பு",
  "சிவப்பரிசி",
  "மாப்பிளை சம்பா",
  "குதிரைவாலி",
  "கோதுமை ரவை",
  "பச்சரிசி",
  "பொன்னி அரிசி",
  "இட்லி அரிசி",
  "ஐ ஆர்- 20 அரிசி",
  "பிரியாணி அரிசி",
  "சீரக சம்பா",
  "பாஸ்மதி அரிசி",
  "சில்லி ஆரஞ்சு பவுடர்",
  "சில்லி சிக்கன் மசாலா",
  "கொட்டமுத்து (ஈமனுக்கு)",
  "சிறு ஜவ்வரிசி",
  "மீன் 65 மசாலா",
].map((name) => ({ name: name.trim(), qty: "", unit: "" }));

/* ── Shared styles ───────────────────────────────────────── */
const TH: React.CSSProperties = {
  border: "1px solid #166534",
  padding: "9px 10px",
  color: "#fff",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  textAlign: "left",
  background: "#15803d",
};

const TD_BASE: React.CSSProperties = {
  border: "1px solid #bbf7d0",
  padding: "6px 8px",
  verticalAlign: "middle",
};

const TD_SI: React.CSSProperties = {
  ...TD_BASE,
  background: "#f0fdf4",
  fontWeight: 700,
  color: "#166534",
  fontSize: "12px",
  width: "36px",
  textAlign: "center",
};

const TD_ACTION: React.CSSProperties = {
  ...TD_BASE,
  width: "72px",
  textAlign: "center",
  verticalAlign: "middle",
};

const inputCls =
  "border border-green-300 rounded-lg px-2 py-1.5 text-xs text-green-900 bg-white outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition w-full";



/* ── uid helper ─────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

/* ════════════════════════════════════════════════════════ */
const VegetableList = ({
  vegetables,
  setVegetables,
  savedVegetables,
  setSavedVegetables,
  eventName = "",
  location = "",
  session = "",
  displayTime = "",
  eventId,
}: VegetableListProps) => {

  const [editState, setEditState] = useState<EditState>(null);
  const [highlighted, setHighlighted] = useState<HighlightedRow>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [headings, setHeadings] = useState<VegetableHeading[]>([]);
  const [editHeadingId, setEditHeadingId] = useState<string | null>(null);
  const [editHeadingLabel, setEditHeadingLabel] = useState("");
  const [activeEditField, setActiveEditField] = useState<EditField>("name");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const unitSelectRef = useRef<HTMLSelectElement>(null);

  /* ── On mount: load from localStorage or set defaults ── */
  useEffect(() => {
    const storedVegs = localStorage.getItem(getVegetablesStorageKey(eventId));
    const storedHeadings = localStorage.getItem(getVegetableHeadingsStorageKey(eventId));

    let parsed: Vegetable[] = [];

try {
  parsed = storedVegs ? JSON.parse(storedVegs) : [];
} catch {
  parsed = [];
}

const isEmpty = parsed.length === 0;

    if (isEmpty) {
      setVegetables(DEFAULT_VEGETABLES);
      setHeadings([]);
    } else {
      try {
        const parsed2 = JSON.parse(storedVegs || "[]");
        if (Array.isArray(parsed2) && parsed2.length > 0) {
          setVegetables(parsed2);
        }
      } catch {}

      if (storedHeadings) {
        try {
          const parsedH = JSON.parse(storedHeadings);
          if (Array.isArray(parsedH)) setHeadings(parsedH);
        } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  /* ── Persist vegetables ─────────────────────────────── */
  useEffect(() => {
    saveVegetablesToStorage(vegetables, eventId);
  }, [vegetables, eventId]);

  /* ── Persist headings ───────────────────────────────── */
  useEffect(() => {
    saveHeadingsToStorage(headings, eventId);
  }, [headings, eventId]);

  /* ── Detect mobile ──────────────────────────────────── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Focus active spreadsheet field ─────────────────── */
  useEffect(() => {
    if (!editState) return;
    if (activeEditField === "name") nameInputRef.current?.focus();
    if (activeEditField === "qty") qtyInputRef.current?.focus();
    if (activeEditField === "unit") unitSelectRef.current?.focus();
  }, [editState, activeEditField]);

  /* ── Icon button class ──────────────────────────────── */
  const iconBtnCls = (color: "green" | "red") => {
    const base =
      "flex items-center justify-center rounded-md transition-colors flex-shrink-0 w-8 h-8 min-w-[32px] min-h-[32px]";
    const vis = isMobile ? "" : "opacity-0 group-hover:opacity-100";
    const col =
      color === "green"
        ? "text-green-600 hover:text-green-800 hover:bg-green-100"
        : "text-red-400 hover:text-red-600 hover:bg-red-50";
    return `${base} ${vis} ${col}`;
  };

  const startEdit = (index: number, field: EditField = "name") => {
    const v = vegetables[index];
    if (!v) return;
    setEditState({ index, name: v.name, qty: v.qty, unit: v.unit });
    setActiveEditField(field);
  };

  /* ── Add vegetable at bottom of section only ────────── */
  const addVegetable = (headingId?: string) => {
    const newVeg: Vegetable = { name: "", qty: "", unit: "", headingId: headingId || undefined };

    setVegetables((prev) => {
      let insertIndex = prev.length;

      if (headingId) {
        const sectionIndexes = prev
          .map((v, i) => ({ v, i }))
          .filter(({ v }) => v.headingId === headingId)
          .map(({ i }) => i);

        insertIndex = sectionIndexes.length ? sectionIndexes[sectionIndexes.length - 1] + 1 : prev.length;
      } else {
        const ungroupedIndexes = prev
          .map((v, i) => ({ v, i }))
          .filter(({ v }) => !v.headingId)
          .map(({ i }) => i);

        if (ungroupedIndexes.length) {
          insertIndex = ungroupedIndexes[ungroupedIndexes.length - 1] + 1;
        } else {
          const firstGrouped = prev.findIndex((v) => !!v.headingId);
          insertIndex = firstGrouped === -1 ? prev.length : firstGrouped;
        }
      }

      const next = [...prev];
      next.splice(insertIndex, 0, newVeg);

      setHighlighted(insertIndex);
      setTimeout(() => setHighlighted(null), 2000);
      setEditState({ index: insertIndex, name: "", qty: "", unit: "" });
      setActiveEditField("name");
      setSavedVegetables(null);

      return next;
    });
  };

  /* ── Delete vegetable ───────────────────────────────── */
  const deleteVegetable = (index: number) => {
    setVegetables((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (editState) {
        if (editState.index === index) setEditState(null);
        else if (editState.index > index) {
          setEditState((es) => (es ? { ...es, index: es.index - 1 } : null));
        }
      }
      return next;
    });
    setSavedVegetables(null);
  };

  /* ── Heading CRUD ───────────────────────────────────── */
  const addHeading = () => {
    const newH: VegetableHeading = { id: uid(), label: "" };
    setHeadings((prev) => [...prev, newH]);
    setEditHeadingId(newH.id);
    setEditHeadingLabel("");
  };

  const deleteHeading = (id: string) => {
    setHeadings((prev) => prev.filter((h) => h.id !== id));
    setVegetables((prev) => prev.filter((v) => v.headingId !== id));
    setSavedVegetables(null);
  };

  const confirmHeadingEdit = (id: string) => {
    setHeadings((prev) => prev.map((h) => (h.id === id ? { ...h, label: editHeadingLabel } : h)));
    setEditHeadingId(null);
  };

  /* ── Save ───────────────────────────────────────────── */
  const saveVegetables = () => setSavedVegetables(JSON.parse(JSON.stringify(vegetables)));

  /* ── Edit helpers ───────────────────────────────────── */
  const confirmEdit = () => {
    if (!editState) return;

    setVegetables((prev) => {
      const updated = [...prev];
      updated[editState.index] = {
        ...updated[editState.index],
        name: editState.name,
        qty: editState.qty,
        unit: editState.unit,
      };
      return updated;
    });

    setSavedVegetables(null);
    setEditState(null);
    setActiveEditField("name");
  };

  const confirmEditAndMaybeAddNext = () => {
    if (!editState) return;

    const currentIndex = editState.index;
    const currentHeadingId = vegetables[currentIndex]?.headingId;

    const sameSectionIndexes = vegetables
      .map((v, i) => ({ v, i }))
      .filter(({ v }) => (currentHeadingId ? v.headingId === currentHeadingId : !v.headingId))
      .map(({ i }) => i);

    const lastIndexInSection = sameSectionIndexes[sameSectionIndexes.length - 1];
    const shouldAddNext = currentIndex === lastIndexInSection;

    confirmEdit();

    if (shouldAddNext) {
      setTimeout(() => addVegetable(currentHeadingId), 0);
    }
  };

  const cancelEdit = () => {
    if (!editState) return;
    const veg = vegetables[editState.index];
    if (veg && veg.name === "" && veg.qty === "" && veg.unit === "") {
      setVegetables((prev) => prev.filter((_, i) => i !== editState.index));
    }
    setEditState(null);
    setActiveEditField("name");
  };

  const handleFieldKeyDown = (field: EditField) => (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
      return;
    }

    if (e.key !== "Enter") return;

    e.preventDefault();

    if (field === "name") {
      setActiveEditField("qty");
      return;
    }

    if (field === "qty") {
      setActiveEditField("unit");
      return;
    }

    confirmEditAndMaybeAddNext();
  };

  /* ── Render single row ──────────────────────────────── */
  const renderRow = (veg: Vegetable, i: number, displayIndex: number) => {
    const isEditing = editState?.index === i;
    const isNew = highlighted === i;

    return (
      <tr
        key={i}
        className={`group transition-colors duration-700 cursor-pointer ${
          isNew ? "bg-green-100" : "hover:bg-green-50/50"
        }`}
        style={{ borderBottom: "1px solid #bbf7d0" }}
        onClick={() => {
          if (!isEditing) startEdit(i, "name");
        }}
      >
        <td className="hidden sm:table-cell" style={TD_SI}>
          {displayIndex}
        </td>

        <td style={TD_BASE}>
          {isEditing ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editState!.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditState({ ...editState!, name: e.target.value })}
              onKeyDown={handleFieldKeyDown("name")}
              className={inputCls}
              placeholder="Item name"
            />
          ) : (
            <span className="text-xs sm:text-sm text-green-900 font-medium break-words">
              {veg.name || <span className="text-green-300 italic">—</span>}
            </span>
          )}
        </td>

        <td style={TD_BASE}>
          {isEditing ? (
            <input
              ref={qtyInputRef}
              type="text"
              value={editState!.qty}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditState({ ...editState!, qty: e.target.value })}
              onKeyDown={handleFieldKeyDown("qty")}
              className={inputCls}
              placeholder="Qty"
            />
          ) : (
            <span className="text-xs sm:text-sm text-green-800">
              {veg.qty || <span className="text-green-300">—</span>}
            </span>
          )}
        </td>

        <td style={TD_BASE}>
          {isEditing ? (
            <select
              ref={unitSelectRef}
              value={editState!.unit}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditState({ ...editState!, unit: e.target.value })}
              onKeyDown={handleFieldKeyDown("unit")}
              className={inputCls}
            >
              <option value="">—</option>
              <option>kg</option>
              <option>gm</option>
              <option>ltrs</option>
              <option>nos</option>
            </select>
          ) : (
            <span className="text-xs sm:text-sm text-green-800">
              {veg.unit || <span className="text-green-300">—</span>}
            </span>
          )}
        </td>

        <td style={TD_ACTION} onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <div className="flex items-center justify-center gap-1">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={confirmEdit}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                title="Save"
              >
                <FaCheck size={10} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={cancelEdit}
                className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 transition"
                title="Cancel"
              >
                <FaTimes size={10} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => startEdit(i, "name")} className={iconBtnCls("green")} title="Edit">
                <FaEdit size={11} />
              </button>
              <button onClick={() => deleteVegetable(i)} className={iconBtnCls("red")} title="Delete">
                <FaTrash size={11} />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  /* ── Shared table shell ─────────────────────────────── */
  const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto px-1.5 sm:px-4 pb-1">
      <table
        className="w-full"
        style={{
          borderCollapse: "collapse",
          border: "1px solid #86efac",
          minWidth: isMobile ? "320px" : "420px",
          tableLayout: "fixed",
        }}
      >
        <thead>
          <tr>
            <th className="hidden sm:table-cell" style={{ ...TH, width: "36px", textAlign: "center" }}>
              SI
            </th>
            <th style={TH}>Item Name</th>
            <th style={{ ...TH, width: isMobile ? "72px" : "100px" }}>Qty</th>
            <th style={{ ...TH, width: isMobile ? "74px" : "90px" }}>Unit</th>
            <th style={{ ...TH, width: isMobile ? "64px" : "72px", textAlign: "center", padding: "9px 4px" }}></th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );

  /* ── Ungrouped items ────────────────────────────────── */
  const ungrouped = vegetables.map((v, i) => ({ v, i })).filter(({ v }) => !v.headingId);

  /* ── Print ──────────────────────────────────────────── */
  const handlePrintVegetables = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const baseUrl = window.location.origin;
    const data = (savedVegetables ?? vegetables).filter((v) => v.name.trim());

    let gIdx = 0;
    let tableRows = "";

    const ungroupedSaved = data.filter((v) => !v.headingId);
    ungroupedSaved.forEach((veg) => {
      gIdx++;
      tableRows += `<tr>
        <td class="si-cell">${gIdx}</td>
        <td class="name-cell">${veg.name}</td>
        <td class="qty-cell">${veg.qty || "—"}</td>
        <td class="unit-cell">${veg.unit || "—"}</td>
      </tr>`;
    });

    headings.forEach((h) => {
      const items = data.filter((v) => v.headingId === h.id);
      if (!items.length) return;
      tableRows += `<tr>
        <td colspan="4" style="background:#dcfce7;font-weight:800;color:#14532d;font-size:12px;padding:8px 14px;border-top:2px solid #15803d;border-bottom:1px solid #86efac;text-transform:uppercase;letter-spacing:0.06em;">
          ${h.label || "—"}
        </td>
      </tr>`;
      items.forEach((veg) => {
        gIdx++;
        tableRows += `<tr>
          <td class="si-cell">${gIdx}</td>
          <td class="name-cell">${veg.name}</td>
          <td class="qty-cell">${veg.qty || "—"}</td>
          <td class="unit-cell">${veg.unit || "—"}</td>
        </tr>`;
      });
    });

    const printedDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vegetable List</title>
          <meta charset="UTF-8"/>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
            .navbar { width: 100%; background: #fff; padding: 10px 20px 0px 20px; }
            .navbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
            .navbar-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
            .navbar-left img { width: 90px; height: auto; object-fit: contain; display: block; }
            .navbar-left p { font-size: 10px; letter-spacing: 0.12em; color: #444; margin-top: 3px; }
            .navbar-center { flex: 1; text-align: center; min-width: 0; }
            .navbar-center h1 { font-size: 28px; font-weight: 800; color: #15803d; line-height: 1.15; display: flex; align-items: flex-start; justify-content: center; gap: 4px; }
            .navbar-center h1 sup { font-size: 12px; font-weight: 600; margin-top: 4px; }
            .navbar-center .address { font-size: 12px; color: #444; margin-top: 2px; }
            .navbar-center .phones { font-size: 13px; font-weight: 700; color: #111; margin-top: 2px; }
            .navbar-center .socials { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 5px; flex-wrap: wrap; }
            .navbar-center .socials a { font-size: 11px; color: #333; text-decoration: none; display: flex; align-items: center; gap: 4px; }
            .social-icon { width: 14px; height: 14px; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; flex-shrink: 0; }
            .social-icon.fb { background: #1877f2; }
            .social-icon.ig { background: linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); }
            .social-icon.em { background: #ea4335; }
            .navbar-center .tagline { font-size: 11.5px; font-weight: 700; color: #15803d; margin-top: 5px; }
            .navbar-right { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
            .navbar-right img { width: 70px; height: auto; object-fit: contain; display: block; }
            .navbar-bar { width: 100%; height: 7px; background: #15803d; margin-top: 10px; }
            .meta-bar { width: 100%; background: #f0fdf4; border-top: 1px solid #bbf7d0; border-bottom: 2px solid #15803d; padding: 7px 24px; display: flex; justify-content: space-between; align-items: center; }
            .meta-bar-left { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #166534; font-weight: 700; }
            .meta-bar-left .dot { color: #4ade80; }
            .meta-bar-right { font-size: 11px; color: #6b7280; }
            .page-body { padding: 16px 24px 24px; }
            .section-label { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
            .section-label-bar { width: 4px; height: 16px; background: #15803d; border-radius: 2px; }
            .section-label-text { font-size: 12px; font-weight: 800; color: #14532d; text-transform: uppercase; letter-spacing: 0.08em; }
            table { width: 100%; border-collapse: collapse; border: 2.5px solid #111; }
            thead th { background: #15803d; color: #fff; font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px; text-align: left; border: 1.5px solid #0d5c28; }
            thead th.center { text-align: center; }
            .si-cell { padding: 9px 14px; font-size: 13px; font-weight: 700; color: #166534; background: #dcfce7; border-right: 2px solid #111; border-bottom: 1.5px solid #86efac; text-align: center; width: 6%; }
            .name-cell { padding: 8px 14px; font-size: 13px; font-weight: 600; color: #14532d; border-right: 1px solid #bbf7d0; border-bottom: 1px solid #86efac; width: 50%; }
            .qty-cell { padding: 8px 14px; font-size: 13px; color: #111; border-right: 1px solid #bbf7d0; border-bottom: 1px solid #86efac; width: 24%; }
            .unit-cell { padding: 8px 14px; font-size: 13px; color: #111; border-bottom: 1px solid #86efac; width: 20%; }
            tbody tr:nth-child(odd) .name-cell,
            tbody tr:nth-child(odd) .qty-cell,
            tbody tr:nth-child(odd) .unit-cell { background: #fff; }
            tbody tr:nth-child(even) .name-cell,
            tbody tr:nth-child(even) .qty-cell,
            tbody tr:nth-child(even) .unit-cell { background: #f0fdf4; }
            tbody tr { page-break-inside: avoid; }
            .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af; }
            .footer-brand { font-weight: 700; color: #15803d; }
            @media print {
              body,.navbar,.navbar-bar,.meta-bar,thead th,.si-cell,.name-cell,.qty-cell,.unit-cell { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { margin: 0.3in 0.3in; size: A4; }
            }
          </style>
        </head>
        <body>
          <div class="navbar">
            <div class="navbar-inner">
              <div class="navbar-left">
                <img src="${baseUrl}/images/owner.png" alt="Owner" />
                <p>EST - 1989</p>
              </div>
              <div class="navbar-center">
                <h1>MRS கேட்டரிங்ஸ் <sup>®</sup></h1>
                <p class="address">கோபி, ஈரோடு - 638456</p>
                <p class="phones">99655 55317 &nbsp;|&nbsp; 98427 55317</p>
                <div class="socials">
                  <a href="#"><span class="social-icon fb">f</span> MRS Caterings</a>
                  <a href="#"><span class="social-icon ig">i</span> mrs_caterings</a>
                  <a href="#"><span class="social-icon em">✉</span> mrscatering1989@gmail.com</a>
                </div>
                <p class="tagline">Premium Wedding · Traditional Events · Outdoor Catering</p>
              </div>
              <div class="navbar-right">
                <img src="${baseUrl}/images/association.png" alt="Association" />
                <img src="${baseUrl}/images/whatsapp.png" alt="WhatsApp" />
              </div>
            </div>
            <div class="navbar-bar"></div>
          </div>
          <div class="meta-bar">
            <div class="meta-bar-left">
              <span>🥦</span>
              <span>${eventName || "Vegetable List"}</span>
              ${location ? `<span class="dot">•</span><span>${location}</span>` : ""}
              ${session ? `<span class="dot">•</span><span>${session}</span>` : ""}
              ${displayTime ? `<span class="dot">•</span><span>${displayTime}</span>` : ""}
            </div>
            <div class="meta-bar-right">Printed: ${printedDate}</div>
          </div>
          <div class="page-body">
            <div class="section-label">
              <div class="section-label-bar"></div>
              <div class="section-label-text">Vegetable Items</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="center" style="width:6%">#</th>
                  <th style="width:50%">Item Name</th>
                  <th style="width:24%">Quantity</th>
                  <th style="width:20%">Unit</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows || `<tr><td colspan="4" style="text-align:center;padding:20px;color:#6b7280;font-size:13px;">No items added.</td></tr>`}
              </tbody>
            </table>
            <div class="footer">
              <span class="footer-brand">MRS Catering</span>
              <span>Catering Management System · Vegetable List</span>
              <span>Thank you for choosing us 🙏</span>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-green-700">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-sm sm:text-base tracking-wide">Vegetable List</h2>
            {vegetables.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {vegetables.length} {vegetables.length === 1 ? "item" : "items"}
              </span>
            )}
          </div>
        </div>

        {ungrouped.length > 0 && (
          <div className="pt-3">
            <TableWrapper>
              {ungrouped.map(({ v, i }, localIndex) => renderRow(v, i, localIndex + 1))}
            </TableWrapper>
            <div className="px-3 sm:px-5 py-2 border-b border-green-100 bg-green-50/30">
              <button
                onClick={() => addVegetable()}
                className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-green-700 transition"
              >
                <FaPlus size={8} /> Add Item
              </button>
            </div>
          </div>
        )}

        {vegetables.length === 0 && headings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-3xl mb-3">
              🥦
            </div>
            <p className="text-sm font-semibold text-green-700">No items added yet</p>
            <p className="text-xs text-black mt-1">
              Click <strong className="text-green-700">+ Add Item</strong> to start
            </p>
          </div>
        )}

        {headings.map((h) => {
          const items = vegetables.map((v, i) => ({ v, i })).filter(({ v }) => v.headingId === h.id);

          return (
            <div key={h.id} className="mt-3">
              <div className="flex items-center px-3 sm:px-5 py-2 bg-green-50 border-y border-green-200 gap-2">
                {editHeadingId === h.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      type="text"
                      value={editHeadingLabel}
                      onChange={(e) => setEditHeadingLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmHeadingEdit(h.id);
                        if (e.key === "Escape") setEditHeadingId(null);
                      }}
                      placeholder="Heading name (e.g. Grocery)"
                      className="flex-1 border border-green-300 rounded-lg px-3 py-1.5 text-sm font-bold text-green-900 bg-white outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition"
                    />
                    <button
                      onClick={() => confirmHeadingEdit(h.id)}
                      className="flex items-center justify-center w-7 h-7 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                    >
                      <FaCheck size={10} />
                    </button>
                    <button
                      onClick={() => setEditHeadingId(null)}
                      className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 transition"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 text-center">
                      <span className="text-center font-bold text-base sm:text-lg text-green-700 break-words">
                        {h.label || <span className="text-green-300 italic font-normal">Untitled Heading</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditHeadingId(h.id);
                          setEditHeadingLabel(h.label);
                        }}
                        className="flex items-center justify-center w-7 h-7 rounded-md text-green-600 hover:bg-green-100 transition"
                        title="Edit heading"
                      >
                        <FaEdit size={11} />
                      </button>
                      <button
                        onClick={() => deleteHeading(h.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-md text-red-400 hover:bg-red-50 transition"
                        title="Delete heading and its items"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {items.length > 0 && (
                <TableWrapper>
                  {items.map(({ v, i }, localIndex) => renderRow(v, i, localIndex + 1))}
                </TableWrapper>
              )}

              <div className="px-3 sm:px-5 py-2 border-b border-green-100 bg-green-50/30">
                <button
                  onClick={() => addVegetable(h.id)}
                  className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-green-700 transition"
                >
                  <FaPlus size={8} /> Add Item
                </button>
              </div>
            </div>
          );
        })}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-5 py-3 border-t border-green-100 bg-green-50/40 mt-1">
          <div className="flex flex-wrap gap-2">
            {ungrouped.length === 0 && (
              <button
                onClick={() => addVegetable()}
                className="inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-green-700 transition"
              >
                <FaPlus size={8} /> Add Item
              </button>
            )}
            <button
              onClick={addHeading}
              className="inline-flex items-center gap-1 bg-white text-green-700 border border-green-300 text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-green-50 transition"
            >
              <FaPlus size={8} /> Add Heading
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {savedVegetables && (
              <button
                onClick={handlePrintVegetables}
                className="flex items-center gap-1.5 bg-white text-green-700 border border-green-200 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-green-50 shadow-sm transition w-full sm:w-auto justify-center"
              >
                <FaPrint size={13} /> Print List
              </button>
            )}
            <button
              onClick={saveVegetables}
              className="flex items-center gap-1.5 bg-green-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-green-800 shadow-sm transition w-full sm:w-auto justify-center"
            >
              <FaSave size={13} /> Save Vegetables
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default VegetableList;
