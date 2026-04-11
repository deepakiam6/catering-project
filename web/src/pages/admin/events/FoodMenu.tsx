import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaPrint,
  FaSave,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";

/* ── Types ──────────────────────────────────────────────── */
export type FoodMenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type EditState =
  | {
      catId: string;
      type: "category" | "item";
      itemIndex?: number;
      value: string;
    }
  | null;

type FocusedItem = { catId: string; itemIndex: number } | null;
type HighlightedItem = { catId: string; index: number } | null;

/* ── Props ──────────────────────────────────────────────── */
interface FoodMenuProps {
  eventName?: string;
  location?: string;
  session?: string;
  displayTime?: string;
}

/* ── Shared input class ─────────────────────────────────── */
const inputSmCls =
  "border border-green-300 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-green-900 bg-white outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition flex-1 min-w-0";

const SectionHeading = ({ children }: { children: ReactNode }) => (
  <p className="text-xs font-extrabold uppercase tracking-widest text-green-800 mb-3 flex items-center gap-2">
    <span className="inline-block w-1 h-4 rounded-full bg-green-700" />
    {children}
  </p>
);

/* ── localStorage key ───────────────────────────────────── */
const LS_KEY = "food-menu";

/* ── Default Tamil Menu Data ────────────────────────────── */
const DEFAULT_MENU: FoodMenuCategory[] = [
  {
    id: "cat-1",
    category: "வரவேற்பு பானங்கள்",
    items: ["பானகம்", "நீர் மோர்", "தேங்காய் நீர்", "எலுமிச்சை ஜூஸ்", "பாதாம் பால்"],
  },
  {
    id: "cat-2",
    category: "தொடக்க உணவுகள்",
    items: [
      "மெது வடை",
      "மசால் வடை",
      "வாழைக்காய் பஜ்ஜி",
      "கோபி 65",
      "பனீர் 65",
      "சிக்கன் 65",
      "பழம் பொரி",
    ],
  },
  {
    id: "cat-3",
    category: "சூப் வகைகள்",
    items: ["தக்காளி சூப்", "ஸ்வீட் கார்ன் சூப்", "வெஜ் கிளியர் சூப்", "சிக்கன் சூப்"],
  },
  {
    id: "cat-4",
    category: "சிற்றுண்டிகள்",
    items: ["சமோசா", "பஜ்ஜி", "பக்கோடா", "உருளைக்கிழங்கு பாண்டா", "கட்லெட்"],
  },
  {
    id: "cat-5",
    category: "முக்கிய உணவுகள்",
    items: [
      "சாம்பார் சாதம்",
      "ரசம் சாதம்",
      "தயிர் சாதம்",
      "வெஜ் பிரியாணி",
      "சிக்கன் பிரியாணி",
      "ஆந்திரா சிக்கன் கறி",
      "மீன் குழம்பு",
      "அவியல்",
      "பொரியல்",
      "கூட்டு",
    ],
  },
  {
    id: "cat-6",
    category: "ரொட்டி வகைகள்",
    items: ["சப்பாத்தி", "நான்", "பரோட்டா", "குல்சா"],
  },
  {
    id: "cat-7",
    category: "கறி வகைகள்",
    items: [
      "வெஜ் குருமா",
      "பனீர் பட்டர் மசாலா",
      "சிக்கன் கறி",
      "மட்டன் கறி",
      "முட்டை மசாலா",
    ],
  },
  {
    id: "cat-8",
    category: "சாத வகைகள்",
    items: ["லெமன் சாதம்", "தயிர் சாதம்", "தேங்காய் சாதம்", "புளியோதரை", "தக்காளி சாதம்"],
  },
  {
    id: "cat-9",
    category: "ஊறுகாய் & அப்பளம்",
    items: ["மாங்காய் ஊறுகாய்", "எலுமிச்சை ஊறுகாய்", "அப்பளம்", "வத்தல்"],
  },
  {
    id: "cat-10",
    category: "சாலட் வகைகள்",
    items: ["வெஜிடபிள் சாலட்", "வெங்காய சாலட்", "காரட் & பீட்ரூட் சாலட்"],
  },
  {
    id: "cat-11",
    category: "இனிப்பு வகைகள்",
    items: ["ஐஸ்கிரீம்", "பாயசம்", "கேசரி", "குலாப் ஜாமுன்", "மைசூர் பாக்", "ஜாங்கிரி"],
  },
  {
    id: "cat-12",
    category: "குளிர்பானம்",
    items: [
      "வனிலா ஐஸ்கிரீம்",
      "சாக்லேட் ஐஸ்கிரீம்",
      "ஸ்ட்ராபெரி ஐஸ்கிரீம்",
      "ஃபாலூடா",
      "ஜூஸ்",
    ],
  },
  {
    id: "cat-13",
    category: "முடிவு பானங்கள்",
    items: ["காபி", "டீ", "சுக்குமல்லி காபி"],
  },
];

const cloneMenu = (menu: FoodMenuCategory[]): FoodMenuCategory[] =>
  menu.map((c) => ({
    id: c.id,
    category: c.category,
    items: [...c.items],
  }));

const createCategoryId = () =>
  `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeMenu = (value: unknown): FoodMenuCategory[] | null => {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((entry, index): FoodMenuCategory | null => {
      if (!entry || typeof entry !== "object") return null;

      const maybe = entry as Partial<FoodMenuCategory>;

      const id =
        typeof maybe.id === "string" && maybe.id.trim()
          ? maybe.id
          : `cat-restored-${index + 1}`;

      const category =
        typeof maybe.category === "string" ? maybe.category.trim() : "";

      const items = Array.isArray(maybe.items)
        ? maybe.items.filter((item): item is string => typeof item === "string")
        : [];

      if (!category) return null;

      return {
        id,
        category,
        items: items.length > 0 ? items : [""],
      };
    })
    .filter((entry): entry is FoodMenuCategory => entry !== null);

  return normalized.length > 0 ? normalized : null;
};

const loadInitialMenu = (): FoodMenuCategory[] => {
  if (typeof window === "undefined") {
    return cloneMenu(DEFAULT_MENU);
  }

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return cloneMenu(DEFAULT_MENU);

    const parsed = JSON.parse(raw);
    const normalized = normalizeMenu(parsed);

    if (normalized) return normalized;
  } catch {
    // ignore bad localStorage data
  }

  return cloneMenu(DEFAULT_MENU);
};

/* ── Inline styles for the Excel-like table ─────────────── */
const TH: CSSProperties = {
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

const TD_BASE: CSSProperties = {
  border: "1px solid #bbf7d0",
  padding: "6px 8px",
  verticalAlign: "top",
};

const TD_CAT: CSSProperties = {
  ...TD_BASE,
  background: "#f0fdf4",
  fontWeight: 700,
  color: "#14532d",
  width: "140px",
  minWidth: "110px",
};

const TD_SI: CSSProperties = {
  ...TD_BASE,
  background: "#f0fdf4",
  fontWeight: 700,
  color: "#166534",
  fontSize: "12px",
  width: "36px",
  textAlign: "center",
};

const TD_ACTION: CSSProperties = {
  ...TD_BASE,
  width: "44px",
  textAlign: "center",
  verticalAlign: "middle",
};

/* ════════════════════════════════════════════════════════ */
const FoodMenu = ({
  eventName = "",
  location = "",
  session = "",
  displayTime = "",
}: FoodMenuProps) => {
  const [menuCategories, setMenuCategories] = useState<FoodMenuCategory[]>(() =>
    cloneMenu(DEFAULT_MENU)
  );
  const [savedMenu, setSavedMenu] = useState<FoodMenuCategory[] | null>(null);
  const [showCategoryPrompt, setShowCategoryPrompt] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editState, setEditState] = useState<EditState>(null);
  const [focusedItem, setFocusedItem] = useState<FocusedItem>(null);
  const [highlightedItem, setHighlightedItem] = useState<HighlightedItem>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const menuPrintRef = useRef<HTMLDivElement>(null);

  /* ── Detect mobile ────────────────────────────────────── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* ── Load once from localStorage after mount ──────────── */
  useEffect(() => {
    const initialMenu = loadInitialMenu();
    setMenuCategories(initialMenu);
    setIsHydrated(true);
  }, []);

  /* ── Auto-save after hydration only ───────────────────── */
  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(menuCategories));
    } catch {
      // ignore write errors
    }
  }, [isHydrated, menuCategories]);

  /* ── Optional sync if localStorage changes in another tab */
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LS_KEY) return;
      const latestMenu = loadInitialMenu();
      setMenuCategories(latestMenu);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  /* ── Category helpers ─────────────────────────────────── */
  const openCategoryPrompt = () => {
    setNewCategoryName("");
    setShowCategoryPrompt(true);
    window.setTimeout(() => categoryInputRef.current?.focus(), 50);
  };

  const cancelCategoryPrompt = () => {
    setShowCategoryPrompt(false);
    setNewCategoryName("");
  };

  const confirmAddCategory = () => {
    const title = newCategoryName.trim();
    if (!title) return;

    setMenuCategories((prev) => [
      ...prev,
      { id: createCategoryId(), category: title, items: [""] },
    ]);
    setShowCategoryPrompt(false);
    setNewCategoryName("");
    setSavedMenu(null);
  };

  /* ── Item helpers ─────────────────────────────────────── */
  const updateItem = (catId: string, idx: number, val: string) => {
    setMenuCategories((prev) =>
      prev.map((cat) =>
        cat.id !== catId
          ? cat
          : {
              ...cat,
              items: cat.items.map((item, itemIndex) =>
                itemIndex === idx ? val : item
              ),
            }
      )
    );
    setSavedMenu(null);
  };

  const addItemToCategory = (catId: string) => {
    const cat = menuCategories.find((c) => c.id === catId);
    if (!cat) return;

    const lastItem = cat.items[cat.items.length - 1] ?? "";
    if (lastItem.trim() === "") {
      setFocusedItem({ catId, itemIndex: cat.items.length - 1 });
      return;
    }

    const newIndex = cat.items.length;
    setFocusedItem({ catId, itemIndex: newIndex });

    setMenuCategories((prev) =>
      prev.map((c) =>
        c.id === catId ? { ...c, items: [...c.items, ""] } : c
      )
    );

    setSavedMenu(null);
    setHighlightedItem({ catId, index: newIndex });
    window.setTimeout(() => setHighlightedItem(null), 2000);
  };

  const removeItem = (catId: string, idx: number) => {
    const cat = menuCategories.find((c) => c.id === catId);
    if (!cat || cat.items.length <= 1) return;

    setMenuCategories((prev) =>
      prev.map((c) => {
        if (c.id !== catId) return c;
        const updatedItems = c.items.filter((_, i) => i !== idx);
        return { ...c, items: updatedItems.length ? updatedItems : [""] };
      })
    );

    setFocusedItem(null);
    setSavedMenu(null);
  };

  const removeCategory = (catId: string) => {
    if (!window.confirm("Delete this category and all its items?")) return;

    setMenuCategories((prev) => prev.filter((c) => c.id !== catId));

    if (editState?.catId === catId) setEditState(null);
    if (focusedItem?.catId === catId) setFocusedItem(null);

    setSavedMenu(null);
  };

  /* ── Edit helpers ─────────────────────────────────────── */
  const startEditCategory = (cat: FoodMenuCategory) => {
    setEditState({ catId: cat.id, type: "category", value: cat.category });
  };

  const startEditItem = (catId: string, idx: number, val: string) => {
    setEditState({ catId, type: "item", itemIndex: idx, value: val });
  };

  const confirmEdit = () => {
    if (!editState) return;

    if (editState.type === "category") {
      const title = editState.value.trim();
      if (!title) return;

      setMenuCategories((prev) =>
        prev.map((c) =>
          c.id === editState.catId ? { ...c, category: title } : c
        )
      );
    } else if (editState.itemIndex !== undefined) {
      updateItem(editState.catId, editState.itemIndex, editState.value);
    }

    setEditState(null);
    setSavedMenu(null);
  };

  const cancelEdit = () => setEditState(null);

  const isEditingCat = (catId: string) =>
    editState?.catId === catId && editState.type === "category";

  const isEditingItem = (catId: string, idx: number) =>
    editState?.catId === catId &&
    editState.type === "item" &&
    editState.itemIndex === idx;

  const isHighlighted = (catId: string, idx: number) =>
    highlightedItem?.catId === catId && highlightedItem.index === idx;

  /* ── Save snapshot for preview / print ────────────────── */
  const saveMenu = () => setSavedMenu(cloneMenu(menuCategories));

  /* ── Print ────────────────────────────────────────────── */
  const handlePrintMenu = () => {
    if (!menuPrintRef.current) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const baseUrl = window.location.origin;

    const tableRows = (savedMenu ?? menuCategories)
      .map((cat) => {
        const validItems = cat.items.filter((item) => item.trim());
        if (!validItems.length) return "";

        return validItems
          .map(
            (item, idx) => `
            <tr>
              ${
                idx === 0
                  ? `<td class="cat-cell" rowspan="${validItems.length}">${cat.category}</td>`
                  : ""
              }
              <td class="item-cell">${item}</td>
            </tr>
          `
          )
          .join("");
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Food Menu</title>
          <meta charset="UTF-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
            .navbar { width: 100%; background: #fff; padding: 10px 20px 0 20px; }
            .navbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
            .navbar-left, .navbar-right { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
            .navbar-left img { width: 90px; height: auto; object-fit: contain; display: block; }
            .navbar-right img { width: 70px; height: auto; object-fit: contain; display: block; }
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
            .cat-cell { padding: 9px 14px; font-size: 13px; font-weight: 700; color: #14532d; background: #dcfce7; border-right: 2px solid #111; border-bottom: 1.5px solid #86efac; vertical-align: top; width: 32%; }
            .item-cell { padding: 8px 14px; font-size: 13px; color: #111; border-bottom: 1px solid #86efac; border-left: 1px solid #bbf7d0; }
            tbody tr:last-child .cat-cell, tbody tr:last-child .item-cell { border-bottom: none; }
            tbody tr:nth-child(odd) .item-cell { background: #fff; }
            tbody tr:nth-child(even) .item-cell { background: #f0fdf4; }
            tbody tr { page-break-inside: avoid; }
            .footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af; }
            .footer-brand { font-weight: 700; color: #15803d; }
            @media print {
              body { padding: 0; }
              .navbar, .navbar-bar, .meta-bar, thead th, .cat-cell, .item-cell { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
                <p class="phones">99655 55317 | 98427 55317</p>
                <div class="socials">
                  <a href="#"><span class="social-icon fb">f</span>MRS Caterings</a>
                  <a href="#"><span class="social-icon ig">i</span>mrs_caterings</a>
                  <a href="#"><span class="social-icon em">✉</span>mrscatering1989@gmail.com</a>
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
              <span>🍛</span>
              <span>${eventName || "Food Menu"}</span>
              ${location ? `<span class="dot">•</span><span>${location}</span>` : ""}
              ${session ? `<span class="dot">•</span><span>${session}</span>` : ""}
              ${displayTime ? `<span class="dot">•</span><span>${displayTime}</span>` : ""}
            </div>
            <div class="meta-bar-right">
              Printed: ${new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div class="page-body">
            <div class="section-label">
              <div class="section-label-bar"></div>
              <div class="section-label-text">Menu Items</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width:32%">Category</th>
                  <th>Menu Item</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>

            <div class="footer">
              <span class="footer-brand">MRS Catering</span>
              <span>Catering Management System · Food Menu</span>
              <span>Thank you for choosing us 🙏</span>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const iconBtnCls = (color: "green" | "red", alwaysVisible?: boolean) => {
    const base =
      "flex items-center justify-center rounded-md transition-colors flex-shrink-0";
    const size = "w-8 h-8 min-w-[32px] min-h-[32px]";
    const visibility = alwaysVisible || isMobile ? "" : "opacity-0 group-hover:opacity-100";
    const colours =
      color === "green"
        ? "text-green-600 hover:text-green-800 hover:bg-green-100"
        : "text-red-400 hover:text-red-600 hover:bg-red-50";

    return `${base} ${size} ${visibility} ${colours}`;
  };

  return (
    <>
      {showCategoryPrompt && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-green-200 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-10 h-1 rounded-full bg-green-700 mb-4" />
            <h3 className="text-base font-bold text-green-900 mb-1">
              New Menu Category
            </h3>
            <p className="text-xs text-black mb-4">
              Give this category a clear name before adding items.
            </p>

            <input
              ref={categoryInputRef}
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmAddCategory();
                if (e.key === "Escape") cancelCategoryPrompt();
              }}
              placeholder="e.g. Starters, Main Course, Desserts..."
              className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm text-green-900 bg-white outline-none placeholder-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-600/15 transition mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={confirmAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-700 text-white hover:bg-green-800 disabled:bg-green-100 disabled:text-green-300 disabled:cursor-not-allowed transition"
              >
                Create Category
              </button>

              <button
                onClick={cancelCategoryPrompt}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-green-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 bg-green-700">
          <div className="flex items-center gap-2">
            <h2 className="text-white font-bold text-sm sm:text-base tracking-wide">
              Food Menu
            </h2>
            {menuCategories.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {menuCategories.length}{" "}
                {menuCategories.length === 1 ? "category" : "categories"}
              </span>
            )}
          </div>
        </div>

        {menuCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-3xl mb-3">
              🍽
            </div>
            <p className="text-sm font-semibold text-green-700">
              No menu categories yet
            </p>
            <p className="text-xs text-black mt-1">
              Click <strong className="text-green-700">+ Add Category</strong> to
              start
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-1.5 sm:p-4">
            <table
              className="w-full"
              style={{
                borderCollapse: "collapse",
                border: "1px solid #86efac",
                minWidth: "360px",
                tableLayout: "fixed",
              }}
            >
              <thead>
                <tr>
                  <th
                    className="hidden sm:table-cell"
                    style={{ ...TH, width: "36px", textAlign: "center" }}
                  >
                    SI
                  </th>
                  <th style={{ ...TH, width: isMobile ? "110px" : "150px" }}>
                    Category
                  </th>
                  <th style={TH}>Items</th>
                  <th
                    style={{
                      ...TH,
                      width: "44px",
                      textAlign: "center",
                      padding: "9px 4px",
                    }}
                  />
                </tr>
              </thead>

              <tbody>
                {menuCategories.map((cat, catIdx) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-green-50/50 transition-colors"
                    style={{ borderBottom: "1px solid #bbf7d0" }}
                  >
                    <td className="hidden sm:table-cell" style={TD_SI}>
                      {catIdx + 1}
                    </td>

                    <td style={TD_CAT}>
                      {isEditingCat(cat.id) ? (
                        <div className="flex flex-col gap-1">
                          <input
                            autoFocus
                            type="text"
                            value={editState?.value ?? ""}
                            onChange={(e) =>
                              setEditState((prev) =>
                                prev ? { ...prev, value: e.target.value } : prev
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-full border border-green-600 rounded-lg px-2 py-1 text-xs font-semibold text-green-900 outline-none focus:ring-2 focus:ring-green-600/15"
                          />

                          <div className="flex gap-1">
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={confirmEdit}
                              className="flex items-center justify-center w-7 h-7 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                            >
                              <FaCheck size={10} />
                            </button>

                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={cancelEdit}
                              className="flex items-center justify-center w-7 h-7 rounded-md bg-red-50 text-red-400 hover:bg-red-100 transition"
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-green-900 text-xs leading-snug break-words">
                            {cat.category}
                          </span>

                          <button
                            onClick={() => startEditCategory(cat)}
                            className={`${iconBtnCls(
                              "green",
                              true
                            )} !w-7 !h-7 !min-w-[28px] !min-h-[28px]`}
                            title="Edit category"
                          >
                            <FaEdit size={10} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td style={{ ...TD_BASE, padding: "4px 6px" }}>
                      <div className="flex flex-col gap-0">
                        {cat.items.map((item, itemIdx) => (
                          <div
                            key={`${cat.id}-${itemIdx}`}
                            className={`flex items-center gap-1 group px-0.5 transition-colors duration-700 ${
                              isHighlighted(cat.id, itemIdx)
                                ? "bg-green-100 rounded"
                                : ""
                            }`}
                            style={{
                              borderBottom:
                                itemIdx < cat.items.length - 1
                                  ? "1px solid #f0fdf4"
                                  : "none",
                              paddingTop: "5px",
                              paddingBottom: "5px",
                            }}
                          >
                            <span className="text-[10px] text-green-400 font-bold w-4 text-right flex-shrink-0 leading-none">
                              {itemIdx + 1}.
                            </span>

                            {isEditingItem(cat.id, itemIdx) ? (
                              <>
                                <input
                                  autoFocus
                                  type="text"
                                  value={editState?.value ?? ""}
                                  onChange={(e) =>
                                    setEditState((prev) =>
                                      prev
                                        ? { ...prev, value: e.target.value }
                                        : prev
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmEdit();
                                    if (e.key === "Escape") cancelEdit();
                                  }}
                                  className={inputSmCls}
                                />

                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={confirmEdit}
                                  className="flex items-center justify-center w-8 h-8 min-w-[32px] rounded-md text-green-600 hover:bg-green-100 transition flex-shrink-0"
                                >
                                  <FaCheck size={11} />
                                </button>

                                <button
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={cancelEdit}
                                  className="flex items-center justify-center w-8 h-8 min-w-[32px] rounded-md text-red-400 hover:bg-red-50 transition flex-shrink-0"
                                >
                                  <FaTimes size={11} />
                                </button>
                              </>
                            ) : item === "" ||
                              (focusedItem?.catId === cat.id &&
                                focusedItem?.itemIndex === itemIdx) ? (
                              <>
                                <input
                                  autoFocus={
                                    focusedItem?.catId === cat.id &&
                                    focusedItem?.itemIndex === itemIdx
                                  }
                                  type="text"
                                  value={item}
                                  onChange={(e) =>
                                    updateItem(cat.id, itemIdx, e.target.value)
                                  }
                                  onFocus={() =>
                                    setFocusedItem({
                                      catId: cat.id,
                                      itemIndex: itemIdx,
                                    })
                                  }
                                  onBlur={() => setFocusedItem(null)}
                                  placeholder={`Item ${itemIdx + 1}`}
                                  className={inputSmCls}
                                />

                                {cat.items.length > 1 && (
                                  <button
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => removeItem(cat.id, itemIdx)}
                                    className="flex items-center justify-center w-8 h-8 min-w-[32px] rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition flex-shrink-0"
                                    title="Delete item"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="flex-1 text-xs text-green-900 break-words leading-snug min-w-0">
                                  {item}
                                </span>

                                <button
                                  onClick={() =>
                                    startEditItem(cat.id, itemIdx, item)
                                  }
                                  className={iconBtnCls("green")}
                                  title="Edit item"
                                >
                                  <FaEdit size={11} />
                                </button>

                                {cat.items.length > 1 && (
                                  <button
                                    onClick={() => removeItem(cat.id, itemIdx)}
                                    className={iconBtnCls("red")}
                                    title="Delete item"
                                  >
                                    <FaTrash size={11} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        <button
                          onClick={() => addItemToCategory(cat.id)}
                          className="mt-1.5 inline-flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md hover:bg-green-700 transition self-start"
                        >
                          <FaPlus size={8} /> Add Item
                        </button>
                      </div>
                    </td>

                    <td style={{ ...TD_ACTION, verticalAlign: "middle" }}>
                      <div className="flex items-center justify-center h-full">
                        <button
                          onClick={() => removeCategory(cat.id)}
                          className="flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete category"
                        >
                          <MdDelete size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={openCategoryPrompt}
          className="flex items-center gap-1.5 bg-white text-green-700 text-xs font-bold px-3 py-4 rounded-lg shadow-sm hover:bg-green-50 transition"
        >
          <FaPlus size={9} /> Add Category
        </button>

        {menuCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end px-3 sm:px-5 py-3 border-t border-green-100 bg-green-50/40">
            {savedMenu && (
              <button
                onClick={handlePrintMenu}
                className="flex items-center gap-1.5 bg-white text-green-700 border border-green-200 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-green-50 shadow-sm transition w-full sm:w-auto justify-center"
              >
                <FaPrint size={13} /> Print Menu
              </button>
            )}

            <button
              onClick={saveMenu}
              className="flex items-center gap-1.5 bg-green-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-green-800 shadow-sm transition w-full sm:w-auto justify-center"
            >
              <FaSave size={13} /> Save Menu
            </button>
          </div>
        )}
      </div>

      {savedMenu && savedMenu.length > 0 && (
        <div className="bg-white border border-green-100 rounded-2xl shadow-sm p-3 sm:p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <SectionHeading>Menu Preview</SectionHeading>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
              Saved ✓
            </span>
          </div>

          <div className="overflow-x-auto">
            <div ref={menuPrintRef}>
              <table
                className="w-full"
                style={{
                  borderCollapse: "collapse",
                  border: "1px solid #bbf7d0",
                  minWidth: "300px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...TH, width: "160px" }}>Category</th>
                    <th style={TH}>Menu Item</th>
                  </tr>
                </thead>

                <tbody>
                  {savedMenu.map((cat) => {
                    const validItems = cat.items.filter((item) => item.trim());
                    if (!validItems.length) return null;

                    return validItems.map((item, idx) => (
                      <tr key={`${cat.id}-${idx}`}>
                        {idx === 0 && (
                          <td
                            rowSpan={validItems.length}
                            style={{
                              border: "1px solid #bbf7d0",
                              padding: "7px 10px",
                              fontWeight: 700,
                              color: "#14532d",
                              background: "#f0fdf4",
                              verticalAlign: "top",
                              fontSize: "12px",
                              wordBreak: "break-word",
                            }}
                          >
                            {cat.category}
                          </td>
                        )}

                        <td
                          style={{
                            border: "1px solid #bbf7d0",
                            padding: "6px 10px",
                            color: "#166534",
                            fontSize: "12px",
                            background: idx % 2 === 0 ? "#fff" : "#f9fffe",
                          }}
                        >
                          {item}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FoodMenu;
