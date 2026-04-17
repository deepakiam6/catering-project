import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import cateringVideo from "../../assets/catering.mp4";
import Footer from "../../components/Footer";

/* Scroll-reveal hook */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".sr");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("sr-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const FOODS = [
  {
    emoji: "🍃",
    name: "வாழை இலை சாப்பாடு",
    eng: "Banana Leaf Feast",
    desc: "Served on fresh banana leaves, a timeless tradition at every Tamil celebration.",
  },
  {
    emoji: "🍛",
    name: "சாம்பார் சாதம்",
    eng: "Sambar Rice",
    desc: "Rich lentil curry simmered with tamarind, tomato, and aromatic spices.",
  },
  {
    emoji: "🥛",
    name: "பாயசம்",
    eng: "Payasam",
    desc: "Creamy milk dessert with vermicelli or rice, sweetened with jaggery.",
  },
  {
    emoji: "🫓",
    name: "அடை / தோசை",
    eng: "Adai / Dosa",
    desc: "Crispy lentil crepes served with coconut chutney and sambar.",
  },
  {
    emoji: "🌿",
    name: "அவியல்",
    eng: "Avial",
    desc: "Mixed vegetables cooked in coconut and curd - a Kerala-Tamil classic.",
  },
  {
    emoji: "🍯",
    name: "குழம்பு வகைகள்",
    eng: "Kuzhambu Varieties",
    desc: "Tamarind-based gravies - Vatha Kuzhambu, Puli Kuzhambu, and more.",
  },
];

const Home = () => {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // ── NEW: SIDEBAR state ──
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarFullyOpen, setSidebarFullyOpen] = useState(false);

  useScrollReveal();

  useEffect(() => {
    if (!document.getElementById("mrs-catering-fonts")) {
      const link = document.createElement("link");
      link.id = "mrs-catering-fonts";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Lato:wght@300;400;700&display=swap";
      document.head.appendChild(link);
    }

    const timer = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // ── NEW: SIDEBAR open/close handlers ──
  const openMenu = () => {
    setMenuOpen(true);
    // Delay "fully open" flag to after transition completes (300ms)
    setTimeout(() => setSidebarFullyOpen(true), 310);
  };

  const closeMenu = () => {
    setSidebarFullyOpen(false);
    setMenuOpen(false);
  };

  const floatingDots = [
    { top: "8%", left: "-3%", animDelay: "0s" },
    { top: "82%", left: "-2%", animDelay: "0.5s" },
    { top: "8%", right: "-3%", animDelay: "1.1s" },
    { top: "82%", right: "-2%", animDelay: "0.3s" },
  ];

  return (
    <div
      style={{
        background: "#faf8f4",
        fontFamily: "'Playfair Display', Georgia, serif",
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { overflow-x: hidden; }
        html, body, #root { width: 100%; }

        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar { display: none; }

        .sr {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1),
                      transform 0.75s cubic-bezier(0.22,1,0.36,1);
        }
        .sr-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .sr-delay-1 { transition-delay: 0.1s; }
        .sr-delay-2 { transition-delay: 0.2s; }
        .sr-delay-3 { transition-delay: 0.3s; }
        .sr-delay-4 { transition-delay: 0.4s; }
        .sr-delay-5 { transition-delay: 0.5s; }
        .sr-delay-6 { transition-delay: 0.6s; }

        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.84); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes rotateSlow {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes pulseRing {
          0%   { transform:scale(1); opacity:0.5; }
          70%  { transform:scale(1.08); opacity:0; }
          100% { transform:scale(1.08); opacity:0; }
        }
        @keyframes floatDot {
          0%,100% { transform:translateY(0px); }
          50%     { transform:translateY(-5px); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes borderPulse {
          0%,100% { box-shadow:0 0 0 3px rgba(224,123,42,0.3),0 16px 40px rgba(0,0,0,0.12); }
          50%     { box-shadow:0 0 0 5px rgba(224,123,42,0.55),0 22px 50px rgba(0,0,0,0.16); }
        }
        @keyframes lineReveal {
          from { transform:scaleX(0); }
          to   { transform:scaleX(1); }
        }
        @keyframes ticker {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }

        .shimmer-text {
          background: linear-gradient(90deg,#1a1a1a 25%,#e07b2a 50%,#1a1a1a 75%);
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          animation:shimmer 4.5s linear infinite;
        }

        .btn-admin {
          background:#f0ece6;
          color:#1a1a1a;
          border:1.5px solid #e0dbd4;
          box-shadow:0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95);
          transition:all 0.26s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-admin:hover {
          border-color:#e07b2a;
          color:#e07b2a;
          box-shadow:0 5px 20px rgba(224,123,42,0.2);
          transform:translateY(-2px) scale(1.03);
        }

        .btn-client {
          background:linear-gradient(135deg,#f5903a 0%,#e07b2a 55%,#c96820 100%);
          color:#fff;
          border:1.5px solid transparent;
          box-shadow:0 4px 18px rgba(224,123,42,0.38), inset 0 1px 0 rgba(255,255,255,0.18);
          transition:all 0.26s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-client:hover {
          background:linear-gradient(135deg,#f9a05a 0%,#e98230 55%,#d0721f 100%);
          box-shadow:0 7px 28px rgba(224,123,42,0.5);
          transform:translateY(-2px) scale(1.03);
        }

        .anim-fade-down  { animation:fadeDown 0.65s ease both; }
        .anim-fade-in    { animation:fadeIn 0.75s ease both; }
        .anim-scale-in   { animation:scaleIn 0.95s cubic-bezier(0.34,1.56,0.64,1) both; }
        .anim-fade-up    { animation:fadeUp 0.75s ease both; }
        .anim-fade-fast  { animation:fadeIn 0.6s ease both; }
        .anim-line-reveal {
          animation:lineReveal 0.8s ease both;
          animation-delay:0.4s;
        }

        .food-card {
          background:#fff;
          border:1.5px solid #ede8e0;
          border-radius:18px;
          padding:20px 16px;
          text-align:center;
          transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          cursor:default;
          box-shadow:0 2px 12px rgba(0,0,0,0.04);
        }
        .food-card:hover {
          border-color:#e07b2a;
          box-shadow:0 10px 36px rgba(224,123,42,0.16);
          transform:translateY(-6px) scale(1.02);
        }

        .stat-box {
          background:rgba(224,123,42,0.06);
          border:1px solid rgba(224,123,42,0.18);
          border-radius:14px;
          padding:12px 18px;
          text-align:center;
          transition:all 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        .stat-box:hover {
          background:rgba(224,123,42,0.1);
          transform:translateY(-3px);
          box-shadow:0 8px 24px rgba(224,123,42,0.14);
        }

        .ticker-wrap {
          overflow:hidden;
          white-space:nowrap;
          width:100%;
          display: flex;
          align-items: flex-end;
          height: 100%;
        }
        .ticker-inner {
          display:inline-block;
          animation:ticker 22s linear infinite;
          transform: translateY(4px);
        }
        .ticker-inner:hover { animation-play-state:paused; }

        .corner-badge-wa {
          position:fixed;
          bottom:5px;
          right:5px;
          z-index:40;
          transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
          filter:drop-shadow(0 4px 12px rgba(37,211,102,0.3));
        }
        .corner-badge-wa:hover { transform:scale(1.08); }

        .section-divider {
          display:flex;
          align-items:center;
          gap:10px;
          width:100%;
          max-width:340px;
          margin:0 auto;
        }
        .section-divider::before,
        .section-divider::after {
          content:'';
          flex:1;
          height:1px;
          background:linear-gradient(to right,transparent,#e07b2a,transparent);
        }

        /* ===== COMMON BUTTON STYLE ===== */
        .btn-common {
          padding: 8px 16px;
          font-family: 'Lato', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.25s ease;
          white-space: nowrap;
        }

        /* ===== CONTAINER ===== */
        .header-actions {
          gap: 8px;
          margin-left: auto;
          align-items: center;
        }

        /* ===== MOBILE RESPONSIVE ===== */
        @media (max-width: 640px) {
          .header-actions {
            width: auto;
            margin-top: 0;
            gap: 6px;
          }

          .btn-common {
            padding: 6px 14px;
            font-size: 10px;
            border-radius: 20px;
          }
        }

        /* ── NEW: SIDEBAR styles ── */

        /* Hamburger button — mobile only */
        .hamburger-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f0ece6;
          border: 1.5px solid #e0dbd4;
          cursor: pointer;
          transition: all 0.22s ease;
          flex-shrink: 0;
          margin-right: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .hamburger-btn:hover {
          border-color: #e07b2a;
          background: #fdf5ec;
          box-shadow: 0 4px 14px rgba(224,123,42,0.18);
        }
        .hamburger-icon {
          font-size: 18px;
          line-height: 1;
          color: #1a1a1a;
          transition: transform 0.25s ease, opacity 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 640px) {
          .hamburger-btn { display: flex; }
        }

        /* Overlay */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(20, 15, 10, 0.55);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          transition: opacity 0.3s ease;
        }
        .sidebar-overlay.open { opacity: 1; pointer-events: auto; }
        .sidebar-overlay.closed { opacity: 0; pointer-events: none; }

        /* Sidebar drawer */
        .sidebar-drawer {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 60;
          height: 100dvh;
          width: 72vw;
          max-width: 280px;
          background: #faf8f4;
          box-shadow: 4px 0 32px rgba(0,0,0,0.18);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
        }
        .sidebar-drawer.open  { transform: translateX(0); }
        .sidebar-drawer.closed { transform: translateX(-100%); }

        /* Sidebar top bar */
        .sidebar-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #ede8e0;
        }

        /* Back arrow button */
        .sidebar-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1.5px solid #e0dbd4;
          background: #f0ece6;
          cursor: pointer;
          font-size: 17px;
          color: #1a1a1a;
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          line-height: 1;
        }
        .sidebar-back-btn:hover {
          border-color: #e07b2a;
          color: #e07b2a;
          transform: translateX(-2px);
          box-shadow: 0 3px 12px rgba(224,123,42,0.2);
        }

        /* Sidebar brand mini */
        .sidebar-brand {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #1a1a1a;
        }

        /* Sidebar nav items */
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          gap: 6px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 14px;
          border-radius: 13px;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: transparent;
          transition: all 0.22s cubic-bezier(0.34,1.56,0.64,1);
          text-align: left;
          width: 100%;
        }
        .sidebar-nav-item:hover {
          background: rgba(224,123,42,0.07);
          border-color: rgba(224,123,42,0.2);
          transform: translateX(3px);
        }
        .sidebar-nav-item-icon {
          font-size: 18px;
          width: 28px;
          text-align: center;
          flex-shrink: 0;
        }
        .sidebar-nav-item-label {
          font-family: 'Lato', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          letter-spacing: 0.04em;
        }
        .sidebar-nav-item-sub {
          font-family: 'Lato', sans-serif;
          font-size: 10px;
          color: #b88855;
          letter-spacing: 0.06em;
          margin-top: 1px;
        }

        /* Admin special item */
        .sidebar-nav-item.admin-item:hover {
          background: rgba(26,26,26,0.05);
          border-color: rgba(26,26,26,0.12);
        }
        .sidebar-nav-item.admin-item .sidebar-nav-item-label { color: #1a1a1a; }

        /* Client special item */
        .sidebar-nav-item.client-item {
          background: linear-gradient(135deg, rgba(245,144,58,0.08), rgba(224,123,42,0.04));
          border-color: rgba(224,123,42,0.2);
        }
        .sidebar-nav-item.client-item:hover {
          background: linear-gradient(135deg, rgba(245,144,58,0.14), rgba(224,123,42,0.08));
          border-color: rgba(224,123,42,0.38);
        }
        .sidebar-nav-item.client-item .sidebar-nav-item-label { color: #e07b2a; }

        /* Sidebar footer */
        .sidebar-footer {
          padding: 14px 16px;
          border-top: 1px solid #ede8e0;
          font-family: 'Lato', sans-serif;
          font-size: 10px;
          color: #b88855;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-align: center;
        }
      `}</style>

      {/* ── NEW: SIDEBAR OVERLAY ── */}
      <div
        className={`sidebar-overlay ${menuOpen ? "open" : "closed"}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ── NEW: SIDEBAR DRAWER ── */}
      <div
        className={`sidebar-drawer ${menuOpen ? "open" : "closed"}`}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Top bar */}
        <div className="sidebar-topbar">
          <button
            className="sidebar-back-btn"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            ←
          </button>
          <span className="sidebar-brand">MRS CATERINGS</span>
          {/* spacer to balance the flex */}
          <div style={{ width: 34 }} />
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {/* Home */}
          <button
            className="sidebar-nav-item"
            onClick={() => { closeMenu(); }}
          >
            <span className="sidebar-nav-item-icon">🏠</span>
            <div>
              <div className="sidebar-nav-item-label">Home</div>
              <div className="sidebar-nav-item-sub">Back to main page</div>
            </div>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "#ede8e0", margin: "6px 4px" }} />

          {/* Admin */}
          <button
            className="sidebar-nav-item admin-item"
            onClick={() => { closeMenu(); navigate("/admin/login"); }}
          >
            <span className="sidebar-nav-item-icon">⚙️</span>
            <div>
              <div className="sidebar-nav-item-label">Admin</div>
              <div className="sidebar-nav-item-sub">Manage your catering</div>
            </div>
          </button>

          {/* Client */}
          <button
            className="sidebar-nav-item client-item"
            onClick={() => { closeMenu(); navigate("/userlogin"); }}
          >
            <span className="sidebar-nav-item-icon">👤</span>
            <div>
              <div className="sidebar-nav-item-label">Client</div>
              <div className="sidebar-nav-item-sub">View your orders</div>
            </div>
          </button>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">Est. 1989 · Premium Catering</div>
      </div>
      {/* ── END SIDEBAR ── */}

      <img
        src="/images/whatsapp.png"
        alt="WhatsApp"
        className="corner-badge-wa"
        style={{ width: 44, borderRadius: 10 }}
      />

      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(224,123,42,0.07) 0%,transparent 70%)",
        }}
      />
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          bottom: 300,
          left: -30,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(224,123,42,0.05) 0%,transparent 70%)",
        }}
      />
      <div
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          opacity: 0.022,
          backgroundImage: "radial-gradient(circle,#555 1px,transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          paddingBottom: 0,
          gap: 0,
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ width: "100%", padding: "14px 18px 0", flexShrink: 0 }}>
          <div
            className={loaded ? "anim-fade-down" : ""}
            style={{
              opacity: loaded ? 1 : 0,
              animationDelay: loaded ? "0.1s" : undefined,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* ── NEW: HAMBURGER BUTTON (mobile only) ── */}
              <button
                className="hamburger-btn"
                onClick={openMenu}
                aria-label="Open menu"
                aria-expanded={menuOpen}
              >
                <span className="hamburger-icon">
                  {menuOpen ? "✖" : "☰"}
                </span>
              </button>
              {/* ── END HAMBURGER ── */}

              <img
                src="/images/owner.png"
                alt="Owner"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid #e07b2a",
                  boxShadow: "0 3px 14px rgba(224,123,42,0.28)",
                  flexShrink: 0,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <h1
                  className="shimmer-text"
                  style={{
                    fontFamily: "'Playfair Display',Georgia,serif",
                    fontSize: "clamp(20px,5.5vw,28px)",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    lineHeight: 1.1,
                  }}
                >
                  MRS CATERINGS
                </h1>
                <p
                  style={{
                    fontFamily: "'Lato',sans-serif",
                    fontSize: "clamp(9px,2vw,11px)",
                    letterSpacing: "0.55em",
                    fontWeight: 400,
                    color: "#b88855",
                  }}
                >
                  EST - 1989
                </p>
              </div>
            </div>

            <div className="header-actions hidden md:flex">
              <button
                onClick={() => navigate("/admin/login")}
                className="btn-admin btn-common"
              >
                Admin
              </button>

              <button
                onClick={() => navigate("/userlogin")}
                className="btn-client btn-common"
              >
                Client
              </button>
            </div>
          </div>

          <div
            className={loaded ? "anim-fade-in" : ""}
            style={{
              opacity: loaded ? 1 : 0,
              animationDelay: loaded ? "0.4s" : undefined,
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              className="anim-line-reveal"
              style={{
                height: 1,
                flex: 1,
                background: "linear-gradient(to right,transparent,#e07b2a)",
                transformOrigin: "left",
              }}
            />
            <svg width="8" height="8" viewBox="0 0 9 9">
              <rect
                x="1"
                y="1"
                width="7"
                height="7"
                transform="rotate(45 4.5 4.5)"
                fill="#e07b2a"
                opacity="0.8"
              />
            </svg>
            <div
              className="anim-line-reveal"
              style={{
                height: 1,
                flex: 1,
                background: "linear-gradient(to left,transparent,#e07b2a)",
                transformOrigin: "right",
              }}
            />
          </div>
        </div>

        {/* ── VIDEO CIRCLE ── */}
        <div
          className={loaded ? "anim-scale-in" : ""}
          style={{
            opacity: loaded ? 1 : 0,
            animationDelay: loaded ? "0.3s" : undefined,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 12,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid #e07b2a",
              pointerEvents: "none",
              animationName: "pulseRing",
              animationDuration: "3s",
              animationTimingFunction: "ease-out",
              animationIterationCount: "infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -18,
              left: -18,
              right: -18,
              bottom: -18,
              borderRadius: "50%",
              border: "1.5px dashed rgba(224,123,42,0.25)",
              pointerEvents: "none",
              animationName: "rotateSlow",
              animationDuration: "22s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -26,
              left: -26,
              right: -26,
              bottom: -26,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(224,123,42,0.08) 0%,transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: "min(68vw,60vh,290px)",
              height: "min(68vw,60vh,290px)",
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid #fff",
              position: "relative",
              animationName: "borderPulse",
              animationDuration: "3.5s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              boxShadow: "0 6px 36px rgba(0,0,0,0.12)",
            }}
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scale(1.04)",
                display: "block",
              }}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setLoaded(true)}
            >
              <source src={cateringVideo} type="video/mp4" />
            </video>
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "radial-gradient(circle,transparent 55%,rgba(0,0,0,0.16) 100%)",
                pointerEvents: "none",
              }}
            />
          </div>

          {floatingDots.map((dot, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: dot.top,
                ...(dot.left ? { left: dot.left } : {}),
                ...(dot.right ? { right: dot.right } : {}),
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#e07b2a",
                opacity: 0.55,
                animationName: "floatDot",
                animationDuration: "2.8s",
                animationTimingFunction: "ease-in-out",
                animationDelay: dot.animDelay,
                animationIterationCount: "infinite",
              }}
            />
          ))}
        </div>

        {/* ── TAGLINE ── */}
        <div
          className={loaded ? "anim-fade-up" : ""}
          style={{
            opacity: loaded ? 1 : 0,
            animationDelay: loaded ? "0.65s" : undefined,
            textAlign: "center",
            padding: "12px 20px 0",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(15px,4.2vw,19px)",
              fontWeight: 600,
              color: "#1a1a1a",
              lineHeight: 1.3,
            }}
          >
            Taste the Tradition,
          </h2>
          <h2
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(15px,4.2vw,19px)",
              fontWeight: 600,
              fontStyle: "italic",
              color: "#e07b2a",
              lineHeight: 1.3,
            }}
          >
            Savour the Moment
          </h2>
          <p
            style={{
              fontFamily: "'Lato',sans-serif",
              fontWeight: 300,
              fontSize: "clamp(7px,1.8vw,9px)",
              letterSpacing: "0.28em",
              color: "#a0896e",
              textTransform: "uppercase",
              marginTop: 5,
            }}
          >
            Premium Catering · Since 1989
          </p>
        </div>

        {/* ── DOT DIVIDER ── */}
        <div
          className={loaded ? "anim-fade-fast" : ""}
          style={{
            opacity: loaded ? 1 : 0,
            animationDelay: loaded ? "0.9s" : undefined,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginTop: 10,
          }}
        >
          <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: i === 1 ? "#e07b2a" : "#d8cfc6",
                animationName: "floatDot",
                animationDuration: "2.2s",
                animationTimingFunction: "ease-in-out",
                animationDelay: `${i * 0.28}s`,
                animationIterationCount: "infinite",
              }}
            />
          ))}
          <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{ width: "100%", maxWidth: 760, padding: "28px 18px 0", boxSizing: "border-box" }}>
        <div className="sr" style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          {[
            { num: "0+", label: "Years of Trust", sub: "Since 1989" },
            { num: "0+", label: "Events Served", sub: "Weddings & More" },
            { num: "0+", label: "Menu Items", sub: "Tamil Specials" },
            { num: "0%", label: "Fresh & Authentic", sub: "Every Time" },
          ].map((s, i) => (
            <div key={i} className={`stat-box sr-delay-${i + 1}`} style={{ flex: "1 1 100px", minWidth: 80 }}>
              <p
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontSize: "clamp(18px,4vw,26px)",
                  fontWeight: 700,
                  color: "#e07b2a",
                  lineHeight: 1,
                }}
              >
                {s.num}
              </p>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "clamp(9px,2vw,11px)",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginTop: 3,
                  letterSpacing: "0.03em",
                }}
              >
                {s.label}
              </p>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "clamp(8px,1.5vw,10px)",
                  color: "#b88855",
                  marginTop: 2,
                }}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── TICKER BANNER ── */}
      <div
        style={{
          width: "100%",
          background: "linear-gradient(135deg,#c96820,#e07b2a,#f5903a,#e07b2a,#c96820)",
          padding: "12px 0 6px",
          marginTop: 54,
          overflow: "hidden",
        }}
      >
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[
              "🌿 Traditional Tamil Feasts",
              "🍛 அசல் தமிழ்நாடு சமையல்",
              "🎊 திருமண விருந்துகள்",
              "🍃 வாழை இலை விருந்து",
              "✨ Premium Wedding Catering",
              "🌿 Traditional Tamil Feasts",
              "🎊 திருவிழா சாப்பாட்டு ஏற்பாடு",
              "🍃 Taste of Tradition, Served Fresh",
              "🌿 Pure Veg,Non Traditional Delights",
              "🎉 Outdoor & Event Catering",
              "🥘 Rich Cultural Food Experience",
              "🎊 Grand Celebration Catering",
            ].map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontWeight: 600,
                  fontSize: "clamp(10px,2.5vw,12px)",
                  color: "#fff",
                  letterSpacing: "0.1em",
                  marginRight: 40,
                  opacity: 0.92,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRADITIONAL FOOD SECTION ── */}
      <div style={{ width: "100%", maxWidth: 760, padding: "32px 18px 0", boxSizing: "border-box" }}>
        <div className="sr" style={{ textAlign: "center", marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "'Lato',sans-serif",
              fontSize: "clamp(8px,1.8vw,10px)",
              letterSpacing: "0.35em",
              color: "#e07b2a",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            - அசல் சுவை -
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(18px,5vw,26px)",
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.2,
            }}
          >
            Traditional Tamil Food
          </h2>
          <p
            style={{
              fontFamily: "'Lato',sans-serif",
              fontSize: "clamp(10px,2.2vw,13px)",
              color: "#7a6a5a",
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            Every dish carries the soul of Tamil Nadu - cooked with love,
            <br />
            served with tradition at every celebration.
          </p>
          <div className="section-divider" style={{ marginTop: 12 }}>
            <svg width="8" height="8" viewBox="0 0 9 9">
              <rect
                x="1"
                y="1"
                width="7"
                height="7"
                transform="rotate(45 4.5 4.5)"
                fill="#e07b2a"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
          {FOODS.map((f, i) => (
            <div key={i} className={`food-card sr sr-delay-${(i % 6) + 1}`}>
              <div style={{ fontSize: "clamp(26px,6vw,34px)", marginBottom: 8 }}>{f.emoji}</div>
              <p
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontSize: "clamp(12px,2.8vw,15px)",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {f.name}
              </p>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "clamp(9px,1.8vw,10px)",
                  fontWeight: 700,
                  color: "#e07b2a",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                {f.eng}
              </p>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "clamp(9px,1.8vw,10px)",
                  color: "#7a6a5a",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHY CHOOSE US ── */}
      <div style={{ width: "100%", maxWidth: 760, padding: "32px 18px 0", boxSizing: "border-box" }}>
        <div className="sr" style={{ textAlign: "center", marginBottom: 18 }}>
          <p
            style={{
              fontFamily: "'Lato',sans-serif",
              fontSize: "clamp(8px,1.8vw,10px)",
              letterSpacing: "0.35em",
              color: "#e07b2a",
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            - ஏன் MRS கேட்டரிங்ஸ் -
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(18px,5vw,24px)",
              fontWeight: 700,
              color: "#1a1a1a",
            }}
          >
            Why Choose Us?
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
          {[
            {
              icon: "👨‍🍳",
              title: "Expert Chefs",
              desc: "Trained in authentic Tamil Nadu recipes with decades of experience.",
            },
            {
              icon: "🕐",
              title: "On-Time Service",
              desc: "We respect your schedule - every dish served fresh and on time.",
            },
            {
              icon: "🌱",
              title: "Fresh Ingredients",
              desc: "Only the freshest locally sourced vegetables and spices used.",
            },
            {
              icon: "🎊",
              title: "Any Event Size",
              desc: "From intimate family dinners to grand wedding feasts for 1000+.",
            },
          ].map((w, i) => (
            <div
              key={i}
              className={`sr sr-delay-${i + 1}`}
              style={{
                background: "#fff",
                border: "1.5px solid #ede8e0",
                borderRadius: 16,
                padding: "16px 14px",
                textAlign: "center",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: "clamp(22px,5vw,28px)", marginBottom: 8 }}>{w.icon}</div>
              <p
                style={{
                  fontFamily: "'Playfair Display',Georgia,serif",
                  fontSize: "clamp(12px,2.5vw,14px)",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 5,
                }}
              >
                {w.title}
              </p>
              <p
                style={{
                  fontFamily: "'Lato',sans-serif",
                  fontSize: "clamp(9px,1.8vw,10px)",
                  color: "#7a6a5a",
                  lineHeight: 1.55,
                }}
              >
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUOTE ── */}
      <div className="sr" style={{ width: "100%", maxWidth: 760, padding: "28px 18px 0", boxSizing: "border-box" }}>
        <div
          style={{
            background: "linear-gradient(135deg,rgba(224,123,42,0.08),rgba(224,123,42,0.04))",
            border: "1.5px solid rgba(224,123,42,0.2)",
            borderRadius: 20,
            padding: "20px 22px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(224,123,42,0.12),transparent)",
              pointerEvents: "none",
            }}
          />
          <p
            style={{
              fontFamily: "'Playfair Display',Georgia,serif",
              fontSize: "clamp(14px,3.5vw,18px)",
              fontStyle: "italic",
              fontWeight: 600,
              color: "#1a1a1a",
              lineHeight: 1.5,
            }}
          >
            "உணவே மருந்து - Food is Medicine,
            <br />
            <span style={{ color: "#e07b2a" }}>and every plate we serve is made with love."</span>
          </p>
          <p
            style={{
              fontFamily: "'Lato',sans-serif",
              fontSize: "clamp(9px,2vw,11px)",
              color: "#b88855",
              marginTop: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            - MRS Caterings, Est. 1989
          </p>
        </div>
      </div>

      <div style={{ height: 28 }} />

      <Footer />
    </div>
  );
};

export default Home;