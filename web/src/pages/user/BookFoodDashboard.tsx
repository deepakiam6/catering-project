import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

type MenuCategory = {
  id: string;
  category: string;
  items: string[];
};

type BookingData = {
  eventId: string;
  event?: {
    nameTamil?: string;
    nameEnglish?: string;
  };
  location?: string;
  session: string;
  time: string;
  foodType: string;
  menu: MenuCategory[];
  vegetables?: { name: string; qty: string; unit: string }[];
  vendors?: unknown[];
  version?: number;
  savedAt?: string | number;
};

type BookingVersion = BookingData & {
  version: number;
  savedAt: string | number;
};

const LS_KEY = "bookFoodData";

const formatDate = (value?: string | number) => {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const foodTypeMeta = (type: string) => {
  if (type === "Non Veg") {
    return {
      label: "Non Vegetarian",
      accent: "#dc2626",
      soft: "rgba(220, 38, 38, 0.12)",
      border: "rgba(220, 38, 38, 0.24)",
    };
  }

  if (type === "Both") {
    return {
      label: "Veg & Non-Veg",
      accent: "#d97706",
      soft: "rgba(217, 119, 6, 0.12)",
      border: "rgba(217, 119, 6, 0.24)",
    };
  }

  return {
    label: "Vegetarian",
    accent: "#059669",
    soft: "rgba(5, 150, 105, 0.12)",
    border: "rgba(5, 150, 105, 0.24)",
  };
};

const normaliseVersions = (raw: BookingData[]): BookingVersion[] => {
  const grouped: Record<string, BookingData[]> = {};

  raw.forEach((entry) => {
    if (!entry?.eventId) return;
    if (!grouped[entry.eventId]) grouped[entry.eventId] = [];
    grouped[entry.eventId].push(entry);
  });

  const result: BookingVersion[] = [];

  Object.values(grouped).forEach((group) => {
    const byTime = [...group].sort((a, b) => {
      const aTime = a.savedAt ? new Date(a.savedAt).getTime() : 0;
      const bTime = b.savedAt ? new Date(b.savedAt).getTime() : 0;
      return aTime - bTime;
    });

    byTime.forEach((entry, index) => {
      result.push({
        ...entry,
        menu: Array.isArray(entry.menu) ? entry.menu : [],
        version: entry.version && entry.version > 0 ? entry.version : index + 1,
        savedAt: entry.savedAt ?? new Date().toISOString(),
      });
    });
  });

  return result;
};

const BookFoodDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [versions, setVersions] = useState<BookingVersion[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(0);
  const [ready, setReady] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LS_KEY) || "[]") as BookingData[];
      const safeData = Array.isArray(stored) ? stored : [];

      const eventVersions = normaliseVersions(safeData)
        .filter((entry) => entry.eventId === id)
        .sort((a, b) => b.version - a.version);

      setVersions(eventVersions);
      setActiveVersion(0);
    } catch {
      setVersions([]);
      setActiveVersion(0);
    }

    const timer = window.setTimeout(() => setReady(true), 120);
    return () => window.clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    if (!showEditModal) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEditModal(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showEditModal]);

  const selectedVersion = versions[activeVersion] ?? null;

  const stats = useMemo(() => {
    if (!selectedVersion) {
      return { totalItems: 0, totalCategories: 0 };
    }

    const filledCategories = selectedVersion.menu.filter((category) =>
      category.items?.some((item) => item.trim())
    );

    const totalItems = filledCategories.reduce(
      (sum, category) => sum + category.items.filter((item) => item.trim()).length,
      0
    );

    return {
      totalItems,
      totalCategories: filledCategories.length,
    };
  }, [selectedVersion]);

  const handleEditVersionSelect = (clickedVersion: BookingVersion) => {
    setShowEditModal(false);
    navigate(`/user-edit-food/${id}`, {
      state: { editData: clickedVersion },
    });
  };

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "linear-gradient(135deg, #f7f7f2 0%, #eef6f0 100%)",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              margin: "0 auto 14px",
              borderRadius: "50%",
              border: "3px solid rgba(5,150,105,0.15)",
              borderTopColor: "#059669",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ margin: 0, color: "#4b5563", fontSize: 13, fontWeight: 600 }}>
            Loading food history...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!selectedVersion) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "linear-gradient(135deg, #f7f7f2 0%, #eef6f0 100%)",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            borderRadius: 24,
            padding: 28,
            textAlign: "center",
            boxShadow: "0 18px 48px rgba(15, 23, 42, 0.08)",
            border: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.2em", marginBottom: 12 }}>
            NO DATA
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#111827" }}>No booking found</h2>
          <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14 }}>
            No saved food versions were found for this event.
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "none",
              borderRadius: 12,
              padding: "12px 18px",
              background: "#059669",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const eventName =
    selectedVersion.event?.nameTamil ||
    selectedVersion.event?.nameEnglish ||
    "Event";

  const foodMeta = foodTypeMeta(selectedVersion.foodType);
  const visibleMenu = selectedVersion.menu.filter((category) =>
    category.items?.some((item) => item.trim())
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8faf8 0%, #eef4ef 100%)",
        fontFamily: "'Segoe UI', sans-serif",
        color: "#111827",
      }}
    >
      <style>{`
        .version-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .version-scroll::-webkit-scrollbar-thumb {
          background: rgba(5, 150, 105, 0.22);
          border-radius: 999px;
        }
        .fade-switch {
          animation: fadeSwitch 220ms ease;
        }
        .edit-modal-overlay {
          animation: modalOverlayFade 180ms ease;
        }
        .edit-modal-panel {
          animation: modalPanelRise 220ms ease;
        }
        @keyframes fadeSwitch {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes modalOverlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPanelRise {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(12px)",
          background: "rgba(248, 250, 248, 0.86)",
          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.08)",
              background: "#fff",
              color: "#374151",
              borderRadius: 12,
              padding: "10px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back
          </button>

          <div style={{ textAlign: "center", minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#6b7280",
              }}
            >
              Catering History
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#14532d",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 300,
              }}
            >
              {eventName}
            </div>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            style={{
              border: "none",
              background: "#059669",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Edit
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 48px" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #062f23 0%, #0b5d45 100%)",
            color: "#fff",
            borderRadius: 28,
            padding: "28px 24px",
            boxShadow: "0 24px 60px rgba(6, 47, 35, 0.18)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              marginBottom: 16,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: foodMeta.accent,
                display: "inline-block",
              }}
            />
            {foodMeta.label}
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(2rem, 4vw, 3.4rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            {eventName}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 20,
              color: "rgba(255,255,255,0.82)",
              fontSize: 14,
            }}
          >
            {selectedVersion.location && <span>{selectedVersion.location}</span>}
            <span>{selectedVersion.session}</span>
            <span>{selectedVersion.time}</span>
            <span>{selectedVersion.foodType}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <div
              style={{
                minWidth: 140,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.totalItems}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>Menu items</div>
            </div>
            <div
              style={{
                minWidth: 140,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18,
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900 }}>{stats.totalCategories}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>Categories</div>
            </div>
          </div>
        </section>

        <section
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            border: "1px solid rgba(15, 23, 42, 0.06)",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>Saved List</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Select a List to preview that booking snapshot.
              </p>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#047857",
                background: "rgba(5,150,105,0.08)",
                border: "1px solid rgba(5,150,105,0.16)",
                borderRadius: 999,
                padding: "8px 12px",
              }}
            >
              {versions.length} version{versions.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div
            className="version-scroll"
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {versions.map((version, index) => {
              const isActive = index === activeVersion;
              const isLatest = index === 0;

              return (
                <button
                  key={`${version.eventId}-${version.version}-${index}`}
                  onClick={() => setActiveVersion(index)}
                  style={{
                    flex: "0 0 auto",
                    minWidth: 168,
                    textAlign: "left",
                    borderRadius: 18,
                    padding: 14,
                    cursor: "pointer",
                    border: isActive
                      ? `1px solid ${foodMeta.border}`
                      : "1px solid rgba(15, 23, 42, 0.08)",
                    background: isActive ? foodMeta.soft : "#f9fafb",
                    boxShadow: isActive
                      ? "0 10px 24px rgba(5, 150, 105, 0.12)"
                      : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                        color: isActive ? "#fff" : "#14532d",
                        background: isActive ? foodMeta.accent : "rgba(5,150,105,0.1)",
                      }}
                    >
                      {version.version}
                    </div>

                    {isLatest && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: "#fff",
                          background: "#111827",
                          borderRadius: 999,
                          padding: "4px 8px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Latest
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 6,
                    }}
                  >
                    List {version.version}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.45,
                    }}
                  >
                    {formatDate(version.savedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section
          key={`${selectedVersion.eventId}-${selectedVersion.version}`}
          className="fade-switch"
          style={{
            background: "#fff",
            borderRadius: 24,
            border: "1px solid rgba(15, 23, 42, 0.06)",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 24,
              borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: foodMeta.soft,
                    color: foodMeta.accent,
                    border: `1px solid ${foodMeta.border}`,
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Viewing List {selectedVersion.version}
                  {activeVersion === 0 && <span>• Latest</span>}
                </div>

                <h2
                  style={{
                    margin: "0 0 8px",
                    fontSize: 28,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {eventName}
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    color: "#4b5563",
                    fontSize: 14,
                  }}
                >
                  <span>Session: {selectedVersion.session || "-"}</span>
                  <span>Time: {selectedVersion.time || "-"}</span>
                  <span>Food Type: {selectedVersion.foodType || "-"}</span>
                </div>

                {selectedVersion.location && (
                  <div style={{ marginTop: 10, fontSize: 14, color: "#6b7280" }}>
                    Location: {selectedVersion.location}
                  </div>
                )}
              </div>

              
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18 }}>Menu Categories</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Lightweight version view for the selected booking.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#047857",
                    background: "rgba(5,150,105,0.08)",
                    border: "1px solid rgba(5,150,105,0.16)",
                    borderRadius: 999,
                    padding: "8px 12px",
                  }}
                >
                  {stats.totalCategories} categories
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#374151",
                    background: "#f3f4f6",
                    border: "1px solid #e5e7eb",
                    borderRadius: 999,
                    padding: "8px 12px",
                  }}
                >
                  {stats.totalItems} items
                </span>
              </div>
            </div>

            {visibleMenu.length === 0 ? (
              <div
                style={{
                  borderRadius: 18,
                  border: "1px dashed rgba(15, 23, 42, 0.12)",
                  padding: 28,
                  textAlign: "center",
                  color: "#6b7280",
                  background: "#f9fafb",
                }}
              >
                No menu items available for this version.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                {visibleMenu.map((category, categoryIndex) => {
                  const items = category.items.filter((item) => item.trim());

                  return (
                    <div
                      key={category.id || `${category.category}-${categoryIndex}`}
                      style={{
                        borderRadius: 20,
                        border: "1px solid rgba(15, 23, 42, 0.08)",
                        overflow: "hidden",
                        background: "#fff",
                        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
                      }}
                    >
                      <div
                        style={{
                          padding: "14px 16px",
                          background: "linear-gradient(135deg, #f7faf8 0%, #eef7f2 100%)",
                          borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#111827",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {category.category}
                          </div>
                        </div>

                        <span
                          style={{
                            flexShrink: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#047857",
                            background: "rgba(5,150,105,0.08)",
                            border: "1px solid rgba(5,150,105,0.16)",
                            borderRadius: 999,
                            padding: "6px 10px",
                          }}
                        >
                          {items.length}
                        </span>
                      </div>

                      <ul
                        style={{
                          margin: 0,
                          padding: 14,
                          listStyle: "none",
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        {items.map((item, itemIndex) => (
                          <li
                            key={`${category.id}-${itemIndex}`}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "10px 12px",
                              borderRadius: 14,
                              background: "#f9fafb",
                            }}
                          >
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: foodMeta.accent,
                                marginTop: 6,
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.45 }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {showEditModal && (
        <div
          className="edit-modal-overlay"
          onClick={() => setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.6)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            className="edit-modal-panel"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "min(80vh, 680px)",
              overflow: "hidden",
              borderRadius: 24,
              background: "#ffffff",
              boxShadow: "0 28px 80px rgba(15, 23, 42, 0.28)",
              border: "1px solid rgba(255,255,255,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "20px 20px 16px",
                borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 22, color: "#111827" }}>
                  Select List to Edit
                </h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Choose a saved List to open in the edit screen.
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(false)}
                aria-label="Close version picker"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  background: "#fff",
                  color: "#374151",
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: "pointer",
                }}
              >
                X
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 12,
                padding: 20,
                maxHeight: "calc(min(80vh, 680px) - 88px)",
                overflowY: "auto",
              }}
            >
              {versions.map((version, index) => {
                const isLatest = index === 0;

                return (
                  <button
                    key={`edit-version-${version.eventId}-${version.version}-${index}`}
                    onClick={() => handleEditVersionSelect(version)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 18,
                      border: isLatest
                        ? `1px solid ${foodMeta.border}`
                        : "1px solid rgba(15, 23, 42, 0.08)",
                      background: isLatest ? foodMeta.soft : "#f9fafb",
                      padding: "16px 18px",
                      cursor: "pointer",
                      transition:
                        "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      boxShadow: isLatest
                        ? "0 14px 30px rgba(5, 150, 105, 0.12)"
                        : "0 8px 20px rgba(15, 23, 42, 0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            minWidth: 48,
                            height: 32,
                            borderRadius: 10,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 800,
                            fontSize: 13,
                            color: isLatest ? "#fff" : "#14532d",
                            background: isLatest ? foodMeta.accent : "rgba(5,150,105,0.12)",
                          }}
                        >
                          {version.version}
                        </span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                          {version.version}
                          {isLatest ? " (Latest)" : ""}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: isLatest ? foodMeta.accent : "#6b7280",
                        }}
                      >
                        {formatDate(version.savedAt)}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: "#4b5563",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <span>{version.session || "-"}</span>
                      <span>{version.time || "-"}</span>
                      <span>{version.foodType || "-"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookFoodDashboard;