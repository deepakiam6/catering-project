import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import cateringVideo from "../../assets/catering.mp4";

const Home = () => {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Inject Google Fonts <link> into <head> — avoids @import inside <style> tag
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

  const floatingDots: { top: string; left?: string; right?: string; animDelay: string }[] = [
    { top: "8%",  left: "-3%",  animDelay: "0s" },
    { top: "82%", left: "-2%",  animDelay: "0.5s" },
    { top: "8%",  right: "-3%", animDelay: "1.1s" },
    { top: "82%", right: "-2%", animDelay: "0.3s" },
  ];

  return (
    <div
      style={{
        background: "#faf8f4",
        fontFamily: "'Playfair Display', Georgia, serif",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
        boxSizing: "border-box",
        paddingBottom: 4,
      }}
    >
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.84); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);    opacity: 0.5; }
          70%  { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(1.08); opacity: 0; }
        }
        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(224,123,42,0.3), 0 16px 40px rgba(0,0,0,0.12); }
          50%      { box-shadow: 0 0 0 5px rgba(224,123,42,0.55), 0 22px 50px rgba(0,0,0,0.16); }
        }
        @keyframes lineReveal {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .shimmer-text {
          background: linear-gradient(90deg, #1a1a1a 25%, #e07b2a 50%, #1a1a1a 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4.5s linear infinite;
        }

        .btn-admin {
          background: #f0ece6;
          color: #1a1a1a;
          border: 1.5px solid #e0dbd4;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.95);
          transition: all 0.26s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-admin:hover {
          border-color: #e07b2a; color: #e07b2a;
          box-shadow: 0 5px 20px rgba(224,123,42,0.2);
          transform: translateY(-2px) scale(1.03);
        }
        .btn-admin:active { transform: scale(0.97); box-shadow: none; }

        .btn-client {
          background: linear-gradient(135deg, #f5903a 0%, #e07b2a 55%, #c96820 100%);
          color: #fff;
          border: 1.5px solid transparent;
          box-shadow: 0 4px 18px rgba(224,123,42,0.38), inset 0 1px 0 rgba(255,255,255,0.18);
          transition: all 0.26s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-client:hover {
          background: linear-gradient(135deg, #f9a05a 0%, #e98230 55%, #d0721f 100%);
          box-shadow: 0 7px 28px rgba(224,123,42,0.5);
          transform: translateY(-2px) scale(1.03);
        }
        .btn-client:active { transform: scale(0.97); box-shadow: none; }

        .anim-fade-down  { animation-name: fadeDown;  animation-duration: 0.65s; animation-timing-function: ease; animation-fill-mode: both; }
        .anim-fade-in    { animation-name: fadeIn;    animation-duration: 0.75s; animation-timing-function: ease; animation-fill-mode: both; }
        .anim-scale-in   { animation-name: scaleIn;   animation-duration: 0.95s; animation-timing-function: cubic-bezier(0.34,1.56,0.64,1); animation-fill-mode: both; }
        .anim-fade-up    { animation-name: fadeUp;    animation-duration: 0.75s; animation-timing-function: ease; animation-fill-mode: both; }
        .anim-fade-fast  { animation-name: fadeIn;    animation-duration: 0.6s;  animation-timing-function: ease; animation-fill-mode: both; }
        .anim-line-reveal {
          animation-name: lineReveal; animation-duration: 0.8s;
          animation-timing-function: ease; animation-fill-mode: both; animation-delay: 0.4s;
        }
      `}</style>

      {/* Background blobs */}
      <div style={{
        pointerEvents: "none", position: "absolute", top: -50, right: -50,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,123,42,0.07) 0%, transparent 70%)",
      }} />
      <div style={{
        pointerEvents: "none", position: "absolute", bottom: -30, left: -30,
        width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(224,123,42,0.05) 0%, transparent 70%)",
      }} />

      {/* Dot grid */}
      <div style={{
        pointerEvents: "none", position: "absolute", inset: 0, opacity: 0.022,
        backgroundImage: "radial-gradient(circle, #555 1px, transparent 1px)",
        backgroundSize: "26px 26px",
      }} />

      {/* ── HEADER ── */}
      <div style={{ width: "100%", padding: "14px 18px 0", flexShrink: 0 }}>
        <div
          className={loaded ? "anim-fade-down" : ""}
          style={{
            opacity: loaded ? 1 : 0,
            animationDelay: loaded ? "0.1s" : undefined,
            display: "flex", alignItems: "center", gap: "10px",
          }}
        >
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
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(20px, 5.5vw, 28px)",
                fontWeight: 700,
                letterSpacing: "0.18em",
                lineHeight: 1.1,
              }}
            >
              MRS CATERINGS
            </h1>
            <p style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: "clamp(9px, 2vw, 11px)",
              letterSpacing: "0.55em",
              fontWeight: 400,
              color: "#b88855",
            }}>
              EST — 1989
            </p>
          </div>
        </div>

        {/* Ornament */}
        <div
          className={loaded ? "anim-fade-in" : ""}
          style={{
            opacity: loaded ? 1 : 0,
            animationDelay: loaded ? "0.4s" : undefined,
            display: "flex", alignItems: "center", gap: "8px", marginTop: "8px",
          }}
        >
          <div className="anim-line-reveal" style={{
            height: 1, flex: 1,
            background: "linear-gradient(to right, transparent, #e07b2a)",
            transformOrigin: "left",
          }} />
          <svg width="8" height="8" viewBox="0 0 9 9">
            <rect x="1" y="1" width="7" height="7" transform="rotate(45 4.5 4.5)" fill="#e07b2a" opacity="0.8" />
          </svg>
          <div className="anim-line-reveal" style={{
            height: 1, flex: 1,
            background: "linear-gradient(to left, transparent, #e07b2a)",
            transformOrigin: "right",
          }} />
        </div>
      </div>

      {/* ── VIDEO CIRCLE ── */}
      <div
        className={loaded ? "anim-scale-in" : ""}
        style={{
          opacity: loaded ? 1 : 0,
          animationDelay: loaded ? "0.3s" : undefined,
          position: "relative", display: "flex",
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* Pulse ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "2px solid #e07b2a", pointerEvents: "none",
          animationName: "pulseRing", animationDuration: "3s",
          animationTimingFunction: "ease-out", animationIterationCount: "infinite",
        }} />

        {/* Rotating dashed ring */}
        <div style={{
          position: "absolute", top: -18, left: -18, right: -18, bottom: -18,
          borderRadius: "50%", border: "1.5px dashed rgba(224,123,42,0.25)",
          pointerEvents: "none",
          animationName: "rotateSlow", animationDuration: "22s",
          animationTimingFunction: "linear", animationIterationCount: "infinite",
        }} />

        {/* Glow */}
        <div style={{
          position: "absolute", top: -26, left: -26, right: -26, bottom: -26,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(224,123,42,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Circle */}
        <div style={{
          width: "min(68vw, 60vh, 290px)",
          height: "min(68vw, 60vh, 290px)",
          borderRadius: "50%", overflow: "hidden",
          border: "4px solid #fff", position: "relative",
          animationName: "borderPulse", animationDuration: "3.5s",
          animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
          boxShadow: "0 6px 36px rgba(0,0,0,0.12)",
        }}>
          <video
            ref={videoRef}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.04)", display: "block" }}
            autoPlay muted loop playsInline
            onLoadedData={() => setLoaded(true)}
          >
            <source src={cateringVideo} type="video/mp4" />
          </video>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "radial-gradient(circle, transparent 55%, rgba(0,0,0,0.16) 100%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Floating dots */}
        {floatingDots.map((dot, i) => (
          <div key={i} style={{
            position: "absolute", top: dot.top,
            ...(dot.left !== undefined ? { left: dot.left } : {}),
            ...(dot.right !== undefined ? { right: dot.right } : {}),
            width: 8, height: 8, borderRadius: "50%",
            background: "#e07b2a", opacity: 0.55,
            animationName: "floatDot", animationDuration: "2.8s",
            animationTimingFunction: "ease-in-out",
            animationDelay: dot.animDelay, animationIterationCount: "infinite",
          }} />
        ))}
      </div>

      {/* ── TAGLINE ── */}
      <div
        className={loaded ? "anim-fade-up" : ""}
        style={{
          opacity: loaded ? 1 : 0,
          animationDelay: loaded ? "0.65s" : undefined,
          textAlign: "center", padding: "0 20px", flexShrink: 0,
        }}
      >
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(15px, 4.2vw, 19px)",
          fontWeight: 600, color: "#1a1a1a", lineHeight: 1.3,
        }}>
          Taste the Tradition,
        </h2>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(15px, 4.2vw, 19px)",
          fontWeight: 600, fontStyle: "italic",
          color: "#e07b2a", lineHeight: 1.3,
        }}>
          Savour the Moment
        </h2>
        <p style={{
          fontFamily: "'Lato', sans-serif", fontWeight: 300,
          fontSize: "clamp(7px, 1.8vw, 9px)",
          letterSpacing: "0.28em", color: "#a0896e",
          textTransform: "uppercase", marginTop: 5,
        }}>
          Premium Catering · Since 1989
        </p>
      </div>

      {/* ── Dot divider ── */}
      <div
        className={loaded ? "anim-fade-fast" : ""}
        style={{
          opacity: loaded ? 1 : 0,
          animationDelay: loaded ? "0.9s" : undefined,
          display: "flex", alignItems: "center", gap: "8px", flexShrink: 0,
        }}
      >
        <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: i === 1 ? "#e07b2a" : "#d8cfc6",
            animationName: "floatDot", animationDuration: "2.2s",
            animationTimingFunction: "ease-in-out",
            animationDelay: `${i * 0.28}s`, animationIterationCount: "infinite",
          }} />
        ))}
        <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
      </div>

      {/* ── BUTTONS ── */}
      <div
        className={loaded ? "anim-fade-up" : ""}
        style={{
          opacity: loaded ? 1 : 0,
          animationDelay: loaded ? "1.05s" : undefined,
          display: "flex", flexDirection: "row", gap: 12,
          width: "100%", padding: "0 28px 16px",
          maxWidth: 340, flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate("/admin/login")}
          className="btn-admin"
          style={{
            flex: 1, padding: "11px 0",
            fontFamily: "'Lato', sans-serif",
            fontWeight: 700, fontSize: "12px",
            letterSpacing: "0.22em", textTransform: "uppercase",
            borderRadius: "50px", cursor: "pointer",
          }}
        >
          Admin
        </button>
        <button
          onClick={() => navigate("/userlogin")}
          className="btn-client"
          style={{
            flex: 1, padding: "11px 0",
            fontFamily: "'Lato', sans-serif",
            fontWeight: 700, fontSize: "12px",
            letterSpacing: "0.22em", textTransform: "uppercase",
            borderRadius: "50px", cursor: "pointer",
          }}
        >
          Client
        </button>
      </div>
    </div>
  );
};

export default Home;