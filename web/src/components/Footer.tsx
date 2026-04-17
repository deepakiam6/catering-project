import { FaFacebookF, FaInstagram, FaPhoneAlt, FaMapMarkerAlt, FaHeart } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        width: "100%",
        background: "#faf8f4",
        fontFamily: "'Playfair Display', Georgia, serif",
        boxShadow: "0 -6px 32px rgba(0,0,0,0.07)",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }

        .footer-shimmer {
          background: linear-gradient(90deg, #1a1a1a 25%, #e07b2a 50%, #1a1a1a 75%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: footerShimmer 4.5s linear infinite;
        }
        @keyframes footerShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .fsocial {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          border-radius: 50px;
          border: 1.5px solid #e8e0d4;
          background: #fff;
          color: #5a5a5a;
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.26s cubic-bezier(0.34,1.56,0.64,1);
          white-space: nowrap;
        }
        .fsocial:hover {
          border-color: #e07b2a;
          color: #e07b2a;
          box-shadow: 0 4px 14px rgba(224,123,42,0.18);
          transform: translateY(-2px) scale(1.04);
        }
        .fsocial:active { transform: scale(0.97); }

        .fowner {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .fowner:hover {
          transform: scale(1.06);
          box-shadow: 0 8px 28px rgba(224,123,42,0.3) !important;
        }

        @keyframes floatDot {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.35); }
        }
        .fheart { animation: heartBeat 1.6s ease-in-out infinite; display: inline-block; }

        /* ── LAYOUT GRID ── */
        .footer-body {
          display: grid;
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto;
          align-items: center;
          gap: 12px;
          padding: 18px 28px 14px;
          width: 100%;
        }

        .footer-left   { grid-column: 1; grid-row: 1; }
        .footer-center { grid-column: 2; grid-row: 1; }
        .footer-right  { grid-column: 3; grid-row: 1; }

        /* ── TABLET (≤ 768px) ── */
        @media (max-width: 768px) {
          .footer-body {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            padding: 16px 18px 12px;
            gap: 14px;
          }
          .footer-left   { grid-column: 1; grid-row: 1; justify-self: center; }
          .footer-right  { grid-column: 2; grid-row: 1; justify-self: center; }
          .footer-center { grid-column: 1 / -1; grid-row: 2; }
          .footer-brand-name { font-size: 22px !important; }
        }

        /* ── MOBILE (≤ 480px) ── */
        @media (max-width: 480px) {
          .footer-body {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            padding: 16px 14px 12px;
            gap: 14px;
          }
          .footer-left   { grid-column: 1; grid-row: 1; }
          .footer-right  { grid-column: 1; grid-row: 3; }
          .footer-center { grid-column: 1; grid-row: 2; }

          .footer-side-row {
            flex-direction: row !important;
            justify-content: center;
            gap: 16px !important;
          }
          .footer-side-row > div {
            padding: 6px !important;
          }
          .footer-side-row img {
            width: 60px !important;
          }
          .footer-owner-img {
            width: 64px !important;
            height: 64px !important;
          }
          .footer-brand-name { font-size: 20px !important; }
          .footer-phone-text { font-size: 13px !important; letter-spacing: 0.02em !important; }
          .fsocial { font-size: 10px !important; padding: 4px 9px !important; }
          .footer-tagline { font-size: 11px !important; }
          .footer-loc-badge { font-size: 9px !important; }
          .footer-addr { font-size: 12px !important; }
        }

        /* ── VERY SMALL (≤ 360px) ── */
        @media (max-width: 360px) {
          .footer-brand-name { font-size: 17px !important; }
          .footer-phone-text { font-size: 12px !important; }
          .fsocial { font-size: 9.5px !important; padding: 4px 8px !important; }
        }

        .footer-copyright-bar {
          background: linear-gradient(135deg, #c96820 0%, #e07b2a 55%, #c96820 100%);
          padding: 10px 16px;
        }
        .footer-copyright-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .footer-copyright-text {
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.06em;
          margin: 0;
          text-align: center;
        }
        .footer-made-text {
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 0;
        }
        @media (max-width: 400px) {
          .footer-copyright-text { font-size: 10px; letter-spacing: 0.03em; }
          .footer-made-text { font-size: 10px; }
        }
      `}</style>

      {/* ── TOP ORANGE BAR ── */}
      <div style={{ height: 6, background: "linear-gradient(90deg,#c96820,#e07b2a,#f5903a,#e07b2a,#c96820)" }} />

      {/* ── ORNAMENT LINES ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px 0" }}>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(to right,transparent,#e07b2a)" }} />
        <svg width="8" height="8" viewBox="0 0 9 9">
          <rect x="1" y="1" width="7" height="7" transform="rotate(45 4.5 4.5)" fill="#e07b2a" opacity="0.8" />
        </svg>
        <div style={{ height: 1, flex: 1, background: "linear-gradient(to left,transparent,#e07b2a)" }} />
      </div>

      {/* ── MAIN BODY ── */}
      <div className="footer-body">

        {/* LEFT — OWNER */}
        <div
          className="footer-left"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
          <img
            src="/images/owner.png"
            alt="Owner"
            className="fowner footer-owner-img"
            style={{
              width: 76,
              height: 76,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2.5px solid #e07b2a",
              boxShadow: "0 3px 14px rgba(224,123,42,0.28)",
            }}
          />
          <p style={{
            fontFamily: "'Lato',sans-serif",
            fontSize: 10,
            letterSpacing: "0.45em",
            fontWeight: 600,
            color: "#b88855",
            textTransform: "uppercase",
            margin: 0,
            whiteSpace: "nowrap",
          }}>
            Est — 1989
          </p>
        </div>

        {/* CENTER — BRAND INFO */}
        <div
          className="footer-center"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 7 }}
        >
          {/* Brand Name */}
          <h2
            className="footer-shimmer footer-brand-name"
            style={{ fontSize: 28, fontWeight: 700, letterSpacing: "0.1em", lineHeight: 1.1, margin: 0 }}
          >
            MRS கேட்டரிங்ஸ்{" "}
            <span style={{ fontSize: 13, fontFamily: "'Lato',sans-serif", WebkitTextFillColor: "#e07b2a", color: "#e07b2a", verticalAlign: "super" }}>®</span>
          </h2>

          <div style={{ width: 48, height: 1, background: "linear-gradient(to right,transparent,#e07b2a,transparent)" }} />

          {/* Address */}
          <p
            className="footer-addr"
            style={{ fontFamily: "'Lato',sans-serif", fontSize: 14, color: "#7a6a5a", lineHeight: 1.4, margin: 0, fontWeight: 500 }}
          >
            கோபி, ஈரோடு — 638456
          </p>

          {/* Phone */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "rgba(224,123,42,0.1)",
              border: "1px solid rgba(224,123,42,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FaPhoneAlt style={{ fontSize: 9, color: "#e07b2a" }} />
            </span>
            <p
              className="footer-phone-text"
              style={{ fontFamily: "'Lato',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1a1a", letterSpacing: "0.04em", margin: 0 }}
            >
              99655 55317 / 98427 55317
            </p>
          </div>

          {/* Social Links */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 2 }}>
            <a
              href="https://www.facebook.com/mrscatering/?ref=NONE_xav_ig_profile_page_web#"
              target="_blank"
              rel="noopener noreferrer"
              className="fsocial"
            >
              <FaFacebookF style={{ color: "#1877F2", fontSize: 11, flexShrink: 0 }} />
              MRS Caterings
            </a>
            <a
              href="https://www.instagram.com/mrs_caterings"
              target="_blank"
              rel="noopener noreferrer"
              className="fsocial"
            >
              <FaInstagram style={{ color: "#E1306C", fontSize: 11, flexShrink: 0 }} />
              mrs_caterings
            </a>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=mrscatering1989@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="fsocial"
            >
              <MdEmail style={{ color: "#EA4335", fontSize: 12, flexShrink: 0 }} />
              mrscatering1989@gmail.com
            </a>
          </div>

          {/* Tagline */}
          <p
            className="footer-tagline"
            style={{ fontFamily: "'Lato',sans-serif", fontSize: 12, fontWeight: 700, color: "#c87b28", letterSpacing: "0.06em", margin: "2px 0 0" }}
          >
            Premium Wedding · Traditional Events · Outdoor Catering
          </p>

          {/* Location badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(224,123,42,0.07)",
            border: "1px solid rgba(224,123,42,0.22)",
            borderRadius: 50,
            padding: "4px 12px",
          }}>
            <FaMapMarkerAlt style={{ fontSize: 9, color: "#e07b2a", flexShrink: 0 }} />
            <span
              className="footer-loc-badge"
              style={{ fontFamily: "'Lato',sans-serif", fontSize: 10, color: "#b88855", fontWeight: 500 }}
            >
              கோபி, ஈரோடு, தமிழ்நாடு — Serving since 1989
            </span>
          </div>
        </div>

        {/* RIGHT — ASSOCIATION + QR */}
        <div
          className="footer-right"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
        >
          <div
            className="footer-side-row"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
          >
            <div style={{
              background: "#fff",
              border: "1.5px solid #ede8e0",
              borderRadius: 12,
              padding: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}>
              <img
                src="/images/association.png"
                alt="Tamil Nadu Caterers Association"
                style={{ width: 76, objectFit: "contain", display: "block" }}
              />
            </div>
            <div style={{
              background: "#fff",
              border: "1.5px solid #ede8e0",
              borderRadius: 10,
              padding: 6,
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}>
              <img
                src="/images/whatsapp.png"
                alt="WhatsApp QR"
                style={{ width: 66, objectFit: "contain", display: "block", borderRadius: 6 }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── DOT DIVIDER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "2px 18px 10px" }}>
        <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: i === 1 ? "#e07b2a" : "#d8cfc6",
              animation: `floatDot 2.2s ease-in-out ${i * 0.28}s infinite`,
            }}
          />
        ))}
        <div style={{ width: 24, height: 1, background: "#e0dbd4" }} />
      </div>

      {/* ── COPYRIGHT BAR ── */}
      <div className="footer-copyright-bar">
        <div className="footer-copyright-inner">
          <p className="footer-copyright-text">
            © {currentYear} MRS Caterings. All rights reserved.
          </p>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>·</span>
          <p className="footer-made-text">
            Made with <span className="fheart"><FaHeart style={{ color: "#ffe0c8", fontSize: 9 }} /></span> for every celebration
          </p>
        </div>
      </div>

      {/* ── BLOB ── */}
      <div style={{
        pointerEvents: "none",
        position: "absolute",
        bottom: -20, right: -20,
        width: 130, height: 130,
        borderRadius: "50%",
        background: "radial-gradient(circle,rgba(224,123,42,0.06) 0%,transparent 70%)",
      }} />
    </footer>
  );
};

export default Footer;