import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

type MenuCategory = { id: string; category: string; items: string[] };
type BookingData  = {
  eventId: string;
  event: { nameTamil?: string; nameEnglish?: string };
  location: string; session: string; time: string; foodType: string;
  menu: MenuCategory[];
};

const foodTypeConfig = (type: string) => {
  if (type === "Non Veg") return { dot:"#f87171", label:"Non Vegetarian", accent:"#ef4444", glow:"rgba(239,68,68,0.28)" };
  if (type === "Both")    return { dot:"#fbbf24", label:"Veg & Non-Veg",  accent:"#f59e0b", glow:"rgba(245,158,11,0.28)" };
  return                         { dot:"#34d399", label:"Vegetarian",     accent:"#10b981", glow:"rgba(16,185,129,0.28)" };
};

const useCountUp = (target: number, ms = 1000, go = false) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!go || !target) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / ms, 1);
      setN(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, go, ms]);
  return n;
};

/* ══════════════════════════════════════════════════════════ */
const BookFoodDashboard = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [booking,  setBooking]  = useState<BookingData | null>(null);
  const [ready,    setReady]    = useState(false);
  const [entered,  setEntered]  = useState(false);
  const [visCards, setVisCards] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const all: BookingData[] = JSON.parse(localStorage.getItem("bookFoodData") || "[]");
      setBooking(all.find(b => b.eventId === id) ?? null);
    } catch { setBooking(null); }
    setTimeout(() => { setReady(true); setTimeout(() => setEntered(true), 80); }, 100);
  }, [id]);

  useEffect(() => {
    if (!cardsRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisCards(true); }, { threshold: 0.04 });
    obs.observe(cardsRef.current);
    return () => obs.disconnect();
  }, [ready]);

  const totalItems = booking?.menu.reduce((s, c) => s + c.items.filter(i => i.trim()).length, 0) ?? 0;
  const totalCats  = booking?.menu.filter(c => c.items.filter(i => i.trim()).length > 0).length ?? 0;
  const eventName  = booking?.event?.nameTamil || booking?.event?.nameEnglish || "Event";
  const ft         = foodTypeConfig(booking?.foodType || "");
  const animItems  = useCountUp(totalItems, 1100, entered);
  const animCats   = useCountUp(totalCats,  850,  entered);

  if (!ready) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#060f09,#0d2b1c)", fontFamily:"'Georgia',serif" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:18 }}>
        <div style={{ position:"relative", width:52, height:52 }}>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid rgba(52,211,153,0.12)", animation:"pingAnim 1.4s ease-out infinite" }}/>
          <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#34d399", animation:"spinAnim 0.9s linear infinite" }}/>
          <div style={{ position:"absolute", inset:9, borderRadius:"50%", border:"1.5px solid transparent", borderTopColor:"rgba(52,211,153,0.45)", animation:"spinAnim 1.5s linear infinite reverse" }}/>
        </div>
        <p style={{ fontSize:9, color:"rgba(52,211,153,0.6)", letterSpacing:"0.3em", textTransform:"uppercase", fontFamily:"sans-serif" }}>Preparing</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#060f09,#0d2b1c)", fontFamily:"'Georgia',serif", padding:"0 16px" }}>
      <div style={{ textAlign:"center", animation:"fadeSlideUp 0.65s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div style={{ fontSize:50, marginBottom:18, opacity:0.45 }}>📭</div>
        <h2 style={{ margin:"0 0 8px", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>No booking found</h2>
        <p style={{ margin:"0 0 26px", fontSize:13, color:"rgba(255,255,255,0.35)", fontFamily:"sans-serif" }}>No data matched for this event ID.</p>
        <button onClick={() => navigate(-1)} style={{ padding:"11px 28px", background:"linear-gradient(135deg,#065f46,#059669)", color:"#fff",
          border:"none", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"sans-serif" }}>← Go Back</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#ecf0ec", fontFamily:"'Georgia',serif" }}>

      {/* ═══════════ ALL KEYFRAMES ═══════════ */}
      <style>{`
        /* 1. FADE + SLIDE UP */
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        /* 2. STAGGER + SLIDE (horizontal) */
        @keyframes staggerSlide {
          from { opacity:0; transform:translateX(-20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        /* 3. ZOOM IN */
        @keyframes zoomIn {
          0%   { opacity:0; transform:scale(0.78); }
          65%  { opacity:1; transform:scale(1.04); }
          100% { opacity:1; transform:scale(1); }
        }
        /* Shimmer scroll */
        @keyframes shimmerScroll {
          0%,100% { background-position:0% 50%;   }
          50%      { background-position:100% 50%; }
        }
        /* Float */
        @keyframes floatBob {
          0%,100% { transform:translateY(0);   }
          50%      { transform:translateY(-5px); }
        }
        /* Ripple dot */
        @keyframes rippleOut {
          0%   { transform:scale(1);   opacity:0.75; }
          100% { transform:scale(2.9); opacity:0; }
        }
        /* Scanline sweep */
        @keyframes scanSweep {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(600%); }
        }
        /* Spinner / ping (loader) */
        @keyframes spinAnim { to { transform:rotate(360deg); } }
        @keyframes pingAnim {
          0%   { transform:scale(0.9); opacity:0.7; }
          70%  { transform:scale(1.7); opacity:0; }
          100% { transform:scale(0.9); opacity:0; }
        }
        /* Counter pop */
        @keyframes counterPop {
          0%   { opacity:0; transform:scale(0.45) translateY(10px); }
          65%  { opacity:1; transform:scale(1.06); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }

        /* ── Classes ── */
        .fu  { animation: fadeSlideUp   0.7s  cubic-bezier(0.22,1,0.36,1) both; }
        .ss  { animation: staggerSlide  0.62s cubic-bezier(0.22,1,0.36,1) both; }
        .zi  { animation: zoomIn        0.6s  cubic-bezier(0.34,1.56,0.64,1) both; }
        .cp  { animation: counterPop    0.72s cubic-bezier(0.34,1.56,0.64,1) both; }
        .bob { animation: floatBob      3.8s  ease-in-out infinite; }
        .sg  { background-size:220% 220%; animation: shimmerScroll 4.5s ease infinite; }

        .rdot { position:relative; }
        .rdot::after { content:''; position:absolute; inset:0; border-radius:50%;
          background:currentColor; animation:rippleOut 2.1s ease-out infinite; }

        /* Card hover */
        .mc { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.26s ease; }
        .mc:hover { transform:translateY(-6px) scale(1.015); box-shadow:0 8px 28px rgba(0,0,0,0.09),0 20px 48px rgba(6,95,70,0.12) !important; }
        .mc:hover .cab { opacity:1 !important; }

        /* Item hover */
        .li:hover { background:rgba(16,185,129,0.065); }
        .li { transition:background 0.14s; }
        .li:hover .id { transform:scale(1.7); }
        .id { transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1); }

        /* Item reveal (stagger inside card body) */
        @keyframes itemReveal {
          from { opacity:0; transform:translateX(-14px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .ir { animation: itemReveal 0.42s cubic-bezier(0.22,1,0.36,1) both; }

        .abtn { transition:transform 0.2s ease, box-shadow 0.2s ease; }
        .abtn:hover { transform:translateY(-2px); }
        .nbk { transition:color 0.18s; }
        .nbk:hover { color:#111 !important; }
        .nbk svg { transition:transform 0.2s; }
        .nbk:hover svg { transform:translateX(-3px); }
      `}</style>

      {/* ═══════════ NAV ═══════════ */}
      <nav style={{
        position:"sticky", top:0, zIndex:50,
        background:"rgba(255,255,255,0.88)",
        backdropFilter:"blur(22px)", WebkitBackdropFilter:"blur(22px)",
        borderBottom:"1px solid rgba(0,0,0,0.055)",
        boxShadow:"0 2px 20px rgba(0,0,0,0.05)",
      }}>
        <div style={{ maxWidth:960, margin:"0 auto", padding:"0 20px",
          height:56, display:"flex", alignItems:"center", justifyContent:"space-between" }}>

          <button onClick={() => navigate(-1)} className="nbk"
            style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none",
              cursor:"pointer", fontSize:13, fontWeight:600, color:"#9ca3af", fontFamily:"sans-serif" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <span className="bob" style={{ fontSize:16, lineHeight:1 }}>🍃</span>
            <span style={{ fontSize:13, fontWeight:900, color:"#14532d", letterSpacing:"-0.028em" }}>Mrs. Caterings</span>
          </div>

          {/* Print — Zoom In */}
          <button onClick={() => window.print()} className="zi abtn"
            style={{ animationDelay:"280ms",
              display:"flex", alignItems:"center", gap:5, padding:"7px 14px",
              background:"linear-gradient(135deg,#065f46,#059669)", color:"#fff",
              border:"none", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer",
              fontFamily:"sans-serif", boxShadow:"0 3px 12px rgba(6,95,70,0.3)" }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
              <path d="M4 6V2h8v4M4 12H2V7h12v5h-2M4 12v2h8v-2" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <header style={{
        position:"relative", overflow:"hidden", minHeight:360,
        background:"linear-gradient(145deg,#060f09 0%,#031a0f 22%,#053520 52%,#085c3a 78%,#0a7a50 100%)",
      }}>
        {/* Grain */}
        <div style={{ position:"absolute", inset:0, opacity:0.04, pointerEvents:"none",
          backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`}}/>
        {/* Glows */}
        <div style={{ position:"absolute", top:"-10%", right:"-8%", width:520, height:520, pointerEvents:"none",
          background:"radial-gradient(ellipse,rgba(16,185,129,0.12) 0%,transparent 65%)" }}/>
        <div style={{ position:"absolute", bottom:"-15%", left:"-10%", width:420, height:420, pointerEvents:"none",
          background:"radial-gradient(ellipse,rgba(202,138,4,0.06) 0%,transparent 68%)" }}/>
        <div style={{ position:"absolute", top:"25%", left:"35%", width:360, height:360, pointerEvents:"none",
          background:`radial-gradient(ellipse,${ft.glow} 0%,transparent 70%)`, opacity:0.38 }}/>
        {/* Scanline */}
        <div style={{ position:"absolute", inset:0, overflow:"hidden", opacity:0.015, pointerEvents:"none" }}>
          <div style={{ height:2, background:"rgba(255,255,255,0.8)", animation:"scanSweep 7s linear infinite" }}/>
        </div>
        {/* Diagonal SVG lines */}
        <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.05, pointerEvents:"none" }}
          preserveAspectRatio="none" viewBox="0 0 500 360">
          <line x1="-30" y1="70"  x2="230" y2="400" stroke="white" strokeWidth="0.6"/>
          <line x1="80"  y1="-10" x2="390" y2="380" stroke="white" strokeWidth="0.45"/>
          <line x1="230" y1="-20" x2="530" y2="300" stroke="white" strokeWidth="0.32"/>
          <line x1="360" y1="0"   x2="570" y2="290" stroke="white" strokeWidth="0.22"/>
        </svg>

        <div style={{ position:"relative", maxWidth:960, margin:"0 auto", padding:"60px 20px 76px" }}>

          {/* ── FOOD TYPE — STAGGER + SLIDE ── */}
          {entered && (
            <div className="ss" style={{ animationDelay:"0ms",
              display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div className="rdot" style={{ position:"relative", width:8, height:8, flexShrink:0, color:ft.accent }}>
                <span style={{ display:"block", width:"100%", height:"100%", borderRadius:"50%", background:ft.dot }}/>
              </div>
              <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.28em", color:"rgba(255,255,255,0.45)", fontFamily:"sans-serif" }}>
                {ft.label}
              </span>
              <div style={{ height:1, flex:1, maxWidth:88,
                background:"linear-gradient(90deg,rgba(255,255,255,0.18),transparent)" }}/>
            </div>
          )}

          {/* ── EVENT TITLE — FADE + SLIDE UP ── */}
          {entered && (
            <h1 className="fu sg" style={{
              animationDelay:"95ms", margin:"0 0 14px",
              fontSize:"clamp(2.7rem,6.5vw,5.2rem)",
              fontWeight:900, lineHeight:1.0, letterSpacing:"-0.052em",
              backgroundImage:"linear-gradient(95deg,#fff 0%,rgba(255,255,255,0.7) 36%,#6ee7b7 60%,#a7f3d0 78%,#fff 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            }}>
              {eventName}
            </h1>
          )}

          {/* ── ORNAMENT — ZOOM IN ── */}
          {entered && (
            <div className="zi" style={{ animationDelay:"185ms",
              display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
              <div style={{ height:1, width:44, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.25))" }}/>
              <span style={{ color:"#34d399", fontSize:12, opacity:0.6 }}>✦</span>
              <div style={{ height:1, width:90, background:"linear-gradient(90deg,rgba(255,255,255,0.25),transparent)" }}/>
            </div>
          )}

          {/* ── META CHIPS — STAGGER + SLIDE (each offset) ── */}
          {entered && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 22px", marginBottom:38 }}>
              {[
                booking.location && { d:"M8 1.5A4.5 4.5 0 0 1 12.5 6c0 3.5-4.5 8.5-4.5 8.5S3.5 9.5 3.5 6A4.5 4.5 0 0 1 8 1.5ZM8 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z", t:booking.location },
                booking.session  && { d:"M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2ZM8 5v3.5l2 2", t:booking.session },
                booking.time     && { d:"M2 4h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4ZM5 1.5v3M11 1.5v3M2 7.5h12", t:booking.time },
              ].filter(Boolean).map((item: any, i) => (
                <span key={i} className="ss"
                  style={{ animationDelay:`${230 + i * 75}ms`,
                    display:"flex", alignItems:"center", gap:6,
                    fontSize:13, color:"rgba(255,255,255,0.42)", fontFamily:"sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d={item.d} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item.t}
                </span>
              ))}
            </div>
          )}

          {/* ── COUNTERS — ZOOM IN + counter-pop number ── */}
          {entered && (
            <div className="fu" style={{ animationDelay:"380ms",
              display:"flex", gap:44, paddingTop:24,
              borderTop:"1px solid rgba(255,255,255,0.08)" }}>
              {[
                { v:animItems, label:"Menu Items",  sub:"dishes prepared",  d:400 },
                { v:animCats,  label:"Courses",     sub:"categories total", d:500 },
              ].map(({ v, label, sub, d }) => (
                <div key={label} style={{ display:"flex", flexDirection:"column" }}>
                  <span className="cp" style={{ animationDelay:`${d}ms`,
                    fontSize:"clamp(2.2rem,5vw,3.1rem)", fontWeight:900, color:"#fff",
                    lineHeight:1, letterSpacing:"-0.055em",
                    textShadow:`0 0 40px ${ft.glow}` }}>
                    {v}
                  </span>
                  <span style={{ fontSize:10, fontWeight:700, textTransform:"uppercase",
                    letterSpacing:"0.2em", color:"rgba(255,255,255,0.55)",
                    marginTop:5, fontFamily:"sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.22)", marginTop:2, fontFamily:"sans-serif" }}>
                    {sub}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wave bottom */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:38, overflow:"hidden", pointerEvents:"none" }}>
          <svg viewBox="0 0 1440 38" preserveAspectRatio="none" style={{ width:"100%", height:"100%" }}>
            <path d="M0 38 Q360 10 720 22 Q1080 34 1440 10 V38 H0Z" fill="#ecf0ec"/>
          </svg>
        </div>
      </header>

      {/* ═══════════ CONTENT ═══════════ */}
      <main style={{ maxWidth:960, margin:"0 auto", padding:"36px 20px 64px" }}>

        {booking.menu.length > 0 && (
          <section>

            {/* ── SECTION HEADER — FADE + SLIDE UP ── */}
            <div className={entered ? "fu" : ""}
              style={{ animationDelay:"460ms", opacity: entered ? undefined : 0,
                display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:26 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                {/* Icon — ZOOM IN */}
                <div className={entered ? "zi" : ""} style={{ animationDelay:"500ms",
                  position:"relative", width:44, height:44 }}>
                  <div style={{ position:"absolute", inset:0, borderRadius:12,
                    background:"linear-gradient(135deg,#065f46,#10b981)", opacity:0.22 }}/>
                  <div style={{ position:"absolute", inset:0, borderRadius:12,
                    background:"linear-gradient(135deg,#042d1c,#065f46)",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🍽</div>
                </div>
                <div>
                  <h2 style={{ margin:0, fontSize:18, fontWeight:900, color:"#111827", letterSpacing:"-0.027em" }}>
                    Event Menu
                  </h2>
                  <p style={{ margin:"2px 0 0", fontSize:11, color:"#9ca3af", fontFamily:"sans-serif" }}>
                    Complete catering plan
                  </p>
                </div>
              </div>

              {/* Badges — STAGGER + SLIDE */}
              <div style={{ display:"flex", gap:8 }}>
                {[`${totalItems} items`, `${totalCats} courses`].map((t, i) => (
                  <span key={t} className={entered ? "ss" : ""}
                    style={{ animationDelay:`${520 + i * 80}ms`,
                      fontSize:11, fontWeight:700, padding:"5px 13px",
                      borderRadius:20, background:"#f0fdf4",
                      border:"1px solid #86efac", color:"#15803d",
                      fontFamily:"sans-serif", letterSpacing:"0.01em" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* ── MENU CARDS — ZOOM IN (staggered) ── */}
            <div ref={cardsRef}
              style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))", gap:16 }}>
              {booking.menu.map((cat, ci) => {
                const items = cat.items.filter(i => i.trim());
                if (!items.length) return null;
                const d = Math.min(ci, 8) * 80;
                return (
                  <div key={cat.id}
                    className={visCards ? "zi" : ""}
                    style={{ animationDelay:`${d}ms`, opacity: visCards ? undefined : 0 }}>

                    <div className="mc" style={{
                      background:"#fff", borderRadius:18, overflow:"hidden",
                      border:"1px solid rgba(0,0,0,0.052)",
                      boxShadow:"0 2px 8px rgba(0,0,0,0.042),0 6px 22px rgba(0,0,0,0.038)",
                    }}>
                      {/* Header */}
                      <div style={{ position:"relative", padding:"14px 18px", overflow:"hidden",
                        background:"linear-gradient(112deg,#031a0f 0%,#053a22 48%,#0a6644 100%)" }}>
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:1, opacity:0.32,
                          background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)" }}/>
                        <div style={{ position:"absolute", inset:0, opacity:0.05,
                          backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.45) 10px,rgba(255,255,255,0.45) 11px)" }}/>
                        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                            {/* Initial — ZOOM IN */}
                            <div className={visCards ? "zi" : ""} style={{ animationDelay:`${d + 60}ms`,
                              width:30, height:30, borderRadius:8, flexShrink:0,
                              background:"rgba(255,255,255,0.15)",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:12, fontWeight:900, color:"#d1fae5", fontFamily:"sans-serif",
                              border:"1px solid rgba(255,255,255,0.12)" }}>
                              {cat.category.charAt(0).toUpperCase()}
                            </div>
                            {/* Category name — STAGGER + SLIDE */}
                            <span className={visCards ? "ss" : ""} style={{ animationDelay:`${d + 80}ms`,
                              color:"#fff", fontWeight:700, fontSize:13,
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                              letterSpacing:"-0.01em" }}>
                              {cat.category}
                            </span>
                          </div>
                          <span style={{ flexShrink:0, fontSize:9, fontWeight:700,
                            padding:"3px 8px", borderRadius:20, fontFamily:"sans-serif",
                            background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.6)",
                            border:"1px solid rgba(255,255,255,0.12)", letterSpacing:"0.05em" }}>
                            {items.length}
                          </span>
                        </div>
                      </div>

                      {/* Items — each STAGGER + SLIDE inside card */}
                      <ul style={{ margin:0, padding:"6px 0", listStyle:"none" }}>
                        {items.map((item, idx) => (
                          <li key={idx} className={`li ir ${visCards ? "" : ""}`}
                            style={{ animationDelay:`${d + 100 + idx * 42}ms`,
                              padding:"9px 18px", display:"flex", alignItems:"center", gap:10 }}>
                            <span className="id" style={{
                              width:5, height:5, borderRadius:"50%", flexShrink:0,
                              background:"linear-gradient(135deg,#059669,#34d399)",
                              boxShadow:"0 0 6px rgba(52,211,153,0.28)" }}/>
                            <span style={{ fontSize:13, fontWeight:500, color:"#374151", lineHeight:1.4 }}>
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Hover accent bar */}
                      <div className="cab" style={{
                        height:2, margin:"2px 16px 10px", borderRadius:2, opacity:0,
                        background:"linear-gradient(90deg,transparent,#059669,#34d399,transparent)",
                        transition:"opacity 0.3s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── BOTTOM ACTIONS — FADE + SLIDE UP ── */}
        <div className={entered ? "fu" : ""}
          style={{ animationDelay:"580ms", opacity: entered ? undefined : 0,
            marginTop:44, paddingTop:22, borderTop:"1px solid rgba(0,0,0,0.07)",
            display:"flex", flexWrap:"wrap", gap:10, justifyContent:"flex-end" }}>

          <button onClick={() => navigate(-1)} className="abtn"
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px",
              background:"#fff", border:"1px solid rgba(0,0,0,0.10)", color:"#374151",
              borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"sans-serif" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <button onClick={() => window.print()} className="abtn"
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 22px",
              background:"linear-gradient(135deg,#042d1c,#065f46,#059669)", color:"#fff",
              border:"none", borderRadius:12, fontSize:13, fontWeight:600, cursor:"pointer",
              fontFamily:"sans-serif", boxShadow:"0 4px 16px rgba(6,95,70,0.28)" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 6V2h8v4M4 12H2V7h12v5h-2M4 12v2h8v-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Print Summary
          </button>

        </div>
      </main>
    </div>
  );
};

export default BookFoodDashboard;