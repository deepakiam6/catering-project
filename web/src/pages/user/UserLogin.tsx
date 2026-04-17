import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLoading } from "../../context/LoadingContext";
import { setClientAuth } from "../../utils/auth";


interface FormState {
  phone: string;
  password: string;
}

interface FormErrors {
  phone: string;
  password: string;
}

const UserLogin = () => {
  const [form, setForm] = useState<FormState>({ phone: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({ phone: "", password: "" });
  const [touched, setTouched] = useState<{ phone: boolean; password: boolean }>({ phone: false, password: false });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const navigate = useNavigate();
  const { isLoading, startLoading, stopLoading } = useLoading();

  useEffect(() => { setMounted(true); }, []);

  const validatePhone = (value: string): string => {
    if (!value) return "Phone number is required.";
    if (!/^\d+$/.test(value)) return "Only digits are allowed.";
    if (value.length < 1 || value.length > 10) return "Must be 1–10 digits.";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required.";
    return "";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]: name === "phone" ? validatePhone(value) : validatePassword(value),
    }));
  };

  const handleBlur = (field: "phone" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFormValid =
    form.phone !== "" &&
    form.password !== "" &&
    validatePhone(form.phone) === "" &&
    validatePassword(form.password) === "";

  const handleSubmit = () => {
    if (!isFormValid || isLoading) return;

    setTouched({ phone: true, password: true });
    startLoading("client-login");
    setTimeout(() => {
      // Read from "events" localStorage key (saved by CreateMahal)
      const events: any[] = JSON.parse(localStorage.getItem("events") || "[]");

      // Match userId (phone) and password
      const matched = events.find(
        (e) =>
          String(e.userId).trim() === String(form.phone).trim() &&
          String(e.password).trim() === String(form.password).trim()
      );

      if (matched) {
        setClientAuth(matched);
        // ✅ KEY FIX: matched.id (not matched.eventId — events use "id", not "eventId")
        stopLoading("client-login");
        navigate(`/book-food/${matched.id}/dashboard`, { replace: true });
      } else {
        stopLoading("client-login");
        alert("Invalid phone number or password. Please check your credentials.");
      }
    }, 1000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --cream: #FAF7F2;
          --charcoal: #1A1A1A;
          --slate: #4A4A5A;
          --border: #E4DDD3;
          --error: #C0392B;
          --success: #2E7D52;
        }

        html, body, #root { height: 100%; }
        body { background: var(--cream); font-family: 'Outfit', sans-serif; }

        .login-root {
          min-height: 100vh; display: flex;
          font-family: 'Outfit', sans-serif; background: var(--cream);
        }

        .left-panel {
          display: none; flex: 1; position: relative;
          background: var(--charcoal); overflow: hidden;
          flex-direction: column; min-height: 100vh; padding: 0;
        }
        @media (min-width: 900px) { .left-panel { display: flex; } }

        .lp-bg-pattern {
          position: absolute; inset: 0;
          background-image:
            radial-gradient(circle at 20% 20%, rgba(201,168,76,0.13) 0%, transparent 55%),
            radial-gradient(circle at 80% 80%, rgba(201,168,76,0.09) 0%, transparent 55%);
          pointer-events: none;
        }
        .lp-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
          background-size: 64px 64px; pointer-events: none;
        }
        .lp-blob1 {
          position: absolute; top: -120px; right: -120px;
          width: 380px; height: 380px;
          border: 1px solid rgba(201,168,76,0.15);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: morph 12s ease-in-out infinite; pointer-events: none;
        }
        .lp-blob2 {
          position: absolute; bottom: -80px; left: -80px;
          width: 260px; height: 260px;
          border: 1px solid rgba(201,168,76,0.1);
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: morph 16s ease-in-out infinite reverse; pointer-events: none;
        }
        @keyframes morph {
          0%,100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          50%      { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
        }

        .lp-inner {
          position: relative; display: flex; flex-direction: column;
          height: 100%; min-height: 100vh; padding: 36px 52px 32px;
        }
        .lp-logo {
          display: flex; align-items: center; justify-content: center;
          width: 100%; gap: 12px; flex-shrink: 0;
        }
        .lp-logo-icon {
          width: 42px; height: 42px; background: var(--gold); border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .lp-logo-text {
          font-family: 'Playfair Display', serif; font-size: 19px;
          color: #fff; letter-spacing: 0.03em; line-height: 1.2;
        }
        .lp-logo-text span { color: var(--gold); }
        .lp-body {
          flex: 1; display: flex; flex-direction: column;
          justify-content: center; align-items: center; padding: 28px 0 20px;
        }
        .lp-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.22em;
          color: var(--gold); text-transform: uppercase; margin-bottom: 14px; text-align: center;
        }
        .lp-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(32px, 2.8vw, 44px);
          line-height: 1.18; color: #fff; margin-bottom: 16px; text-align: center;
        }
        .lp-headline em { font-style: italic; color: var(--gold-light); }
        .lp-desc {
          font-size: 13.5px; font-weight: 300; color: rgba(255,255,255,0.52);
          line-height: 1.8; margin-bottom: 28px; max-width: 340px; text-align: center;
        }
        .lp-desc strong { color: rgba(255,255,255,0.75); font-weight: 500; }
        .lp-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden; max-width: 380px;
        }
        .lp-stat {
          background: rgba(255,255,255,0.025); padding: 16px 12px;
          text-align: center; transition: background 0.25s;
        }
        .lp-stat:hover { background: rgba(201,168,76,0.07); }
        .lp-stat-num {
          font-family: 'Playfair Display', serif; font-size: 22px;
          color: var(--gold); display: block; margin-bottom: 4px;
        }
        .lp-stat-label {
          font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.38);
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .lp-footer {
          flex-shrink: 0; display: flex; align-items: center; gap: 12px;
          padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.07);
        }
        .lp-badge {
          display: flex; align-items: center; gap: 7px;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.22);
          border-radius: 100px; padding: 5px 13px;
          font-size: 11px; font-weight: 500; color: var(--gold); letter-spacing: 0.05em;
        }
        .lp-badge::before {
          content: ''; width: 6px; height: 6px; background: var(--gold);
          border-radius: 50%; box-shadow: 0 0 6px var(--gold);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .mobile-header {
          display: none; background: var(--charcoal);
          position: relative; overflow: hidden; padding: 28px 24px 24px;
        }
        @media (max-width: 899px) { .mobile-header { display: block; } }
        .mobile-header .lp-bg-pattern,
        .mobile-header .lp-grid { position: absolute; inset: 0; pointer-events: none; }
        .mobile-header-inner {
          position: relative; display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 10px;
        }
        .mobile-header-logo {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; margin-bottom: 4px;
        }
        .mobile-header-logo .lp-logo-icon { width: 36px; height: 36px; border-radius: 8px; }
        .mobile-header-logo .lp-logo-text { font-size: 16px; }
        .mobile-header-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(24px, 6vw, 32px);
          line-height: 1.18; color: #fff; margin-bottom: 4px;
        }
        .mobile-header-headline em { font-style: italic; color: var(--gold-light); }
        .mobile-header-desc {
          font-size: 12.5px; font-weight: 300;
          color: rgba(255,255,255,0.52); line-height: 1.7;
        }
        .mobile-header-desc strong { color: rgba(255,255,255,0.75); font-weight: 500; }

        .mobile-footer {
          display: none; background: var(--charcoal);
          position: relative; overflow: hidden; padding: 20px 24px 28px;
        }
        @media (max-width: 899px) { .mobile-footer { display: block; } }
        .mobile-footer .lp-bg-pattern,
        .mobile-footer .lp-grid { position: absolute; inset: 0; pointer-events: none; }
        .mobile-footer-inner { position: relative; display: flex; flex-direction: column; gap: 16px; }
        .mobile-footer-desc {
          font-size: 12px; font-weight: 300; color: rgba(255,255,255,0.45); line-height: 1.7;
        }
        .mobile-footer-stats {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden;
        }
        .mobile-footer-badge {
          display: flex; align-items: center; gap: 7px;
          background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.22);
          border-radius: 100px; padding: 5px 13px;
          font-size: 11px; font-weight: 500; color: var(--gold);
          letter-spacing: 0.05em; width: fit-content;
        }
        .mobile-footer-badge::before {
          content: ''; width: 6px; height: 6px; background: var(--gold);
          border-radius: 50%; box-shadow: 0 0 6px var(--gold);
          animation: blink 2s ease-in-out infinite;
        }

        .right-panel {
          width: 100%; display: flex; align-items: center; justify-content: center;
          padding: 40px 24px; background: var(--cream); min-height: 100vh;
        }
        @media (min-width: 900px) {
          .right-panel {
            width: 460px; min-width: 460px; flex-shrink: 0;
            padding: 48px 52px; overflow-y: auto; min-height: 100vh;
          }
        }
        @media (max-width: 899px) {
          .right-panel { min-height: unset; align-items: flex-start; padding: 32px 24px; }
        }

        .form-container {
          width: 100%; max-width: 370px;
          opacity: 0; transform: translateY(22px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .form-container.visible { opacity: 1; transform: translateY(0); }

        .form-header { margin-bottom: 28px; }
        .form-eyebrow {
          font-size: 11px; font-weight: 600; letter-spacing: 0.22em;
          color: var(--gold); text-transform: uppercase; margin-bottom: 8px;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 3.5vw, 34px);
          color: var(--charcoal); line-height: 1.2; margin-bottom: 6px;
        }
        .form-subtitle { font-size: 13.5px; color: var(--slate); font-weight: 300; }

        .field { margin-bottom: 18px; }
        .field-label {
          display: block; font-size: 11px; font-weight: 600;
          letter-spacing: 0.13em; text-transform: uppercase;
          color: var(--charcoal); margin-bottom: 7px;
        }
        .input-wrap { position: relative; }
        .input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: #C0B9B0; pointer-events: none; transition: color 0.2s; display: flex;
        }
        .input-wrap:focus-within .input-icon { color: var(--gold); }

        .field-input {
          width: 100%; padding: 13px 16px 13px 46px;
          border: 1.5px solid var(--border); border-radius: 10px; background: #fff;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 400;
          color: var(--charcoal); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none;
        }
        .field-input::placeholder { color: #C8C1B8; }
        .field-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.13); }
        .field-input.has-error { border-color: var(--error); box-shadow: 0 0 0 3px rgba(192,57,43,0.08); }
        .field-input.is-valid { border-color: var(--success); }

        .toggle-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #C0B9B0; padding: 4px; display: flex; transition: color 0.2s;
        }
        .toggle-btn:hover { color: var(--charcoal); }

        .error-msg { margin-top: 5px; font-size: 12px; color: var(--error); display: flex; align-items: center; gap: 5px; }
        .valid-msg { margin-top: 5px; font-size: 12px; color: var(--success); display: flex; align-items: center; gap: 5px; }

        .divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .divider-line { flex: 1; height: 1px; background: var(--border); }
        .divider-text { font-size: 11px; color: #C0B9B0; font-weight: 500; letter-spacing: 0.06em; }

        .submit-btn {
          width: 100%; padding: 14px; border: none; border-radius: 10px;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase;
          cursor: pointer; position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.25s, background 0.3s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-btn.active { background: var(--charcoal); color: #fff; box-shadow: 0 4px 20px rgba(26,26,26,0.2); }
        .submit-btn.active:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,26,26,0.28); }
        .submit-btn.active:active { transform: translateY(0); }
        .submit-btn.inactive { background: #EDE8E1; color: #B5AEA5; cursor: not-allowed; }
        .submit-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          transform: translateX(-100%); transition: transform 0.55s;
        }
        .submit-btn.active:hover::after { transform: translateX(100%); }

        .form-footer { margin-top: 18px; text-align: center; font-size: 12px; color: #B0A9A0; }
        .form-footer a { color: var(--gold); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .form-footer a:hover { color: var(--charcoal); }

        .security-note {
          margin-top: 20px; padding: 12px 14px;
          background: rgba(201,168,76,0.05); border: 1px solid rgba(201,168,76,0.15);
          border-radius: 10px; display: flex; align-items: flex-start; gap: 10px;
        }
        .security-note svg { flex-shrink: 0; margin-top: 1px; color: var(--gold); }
        .security-note p { font-size: 11.5px; color: var(--slate); line-height: 1.65; font-weight: 300; }
        .security-note p strong { font-weight: 600; color: var(--charcoal); }

        .debug-hint {
          margin-top: 14px; padding: 10px 14px;
          background: rgba(46,125,82,0.06); border: 1px solid rgba(46,125,82,0.2);
          border-radius: 10px; font-size: 11.5px; color: #2E7D52; line-height: 1.6;
        }
        .debug-hint strong { font-weight: 600; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }

        @media (max-width: 899px) { .login-root { flex-direction: column; min-height: 100vh; } }
      `}</style>

      {/* MOBILE HEADER */}
      <div className="mobile-header">
        <div className="lp-bg-pattern" />
        <div className="lp-grid" />
        <div className="mobile-header-inner">
          <div className="mobile-header-logo">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l19-9-9 19-2-8-8-2z"/>
              </svg>
            </div>
            <span className="lp-logo-text">MRS <span>Caterings</span></span>
          </div>
          <h2 className="mobile-header-headline">
            MRS கேட்டரிங்ஸ்<br /><em>Tradition &amp; Taste</em>
          </h2>
          <p className="mobile-header-desc">
            <strong>கோபி, ஈரோடு – 638456</strong><br />
            📞 99655 55317 &nbsp;/&nbsp; 98427 55317
          </p>
        </div>
      </div>

      <div className="login-root">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="lp-bg-pattern" />
          <div className="lp-grid" />
          <div className="lp-blob1" />
          <div className="lp-blob2" />
          <div className="lp-inner">
            <div className="lp-logo">
              <div className="lp-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
              </div>
              <span className="lp-logo-text">MRS <span>Caterings</span></span>
            </div>
            <div className="lp-body">
              <p className="lp-eyebrow">Premium Wedding Catering</p>
              <h2 className="lp-headline">MRS கேட்டரிங்ஸ்<br /><em>Tradition &amp; Taste</em></h2>
              <p className="lp-desc">
                <strong>கோபி, ஈரோடு – 638456</strong><br />
                📞 99655 55317 &nbsp;/&nbsp; 98427 55317<br /><br />
                Premium Wedding · Traditional Events · Outdoor Catering<br />
                Authentic taste with professional service for every celebration.
              </p>
              <div className="lp-stats">
                <div className="lp-stat"><span className="lp-stat-num">0+</span><span className="lp-stat-label">Events Served</span></div>
                <div className="lp-stat"><span className="lp-stat-num">0%</span><span className="lp-stat-label">Happy Clients</span></div>
                <div className="lp-stat"><span className="lp-stat-num">0+</span><span className="lp-stat-label">Menu Items</span></div>
              </div>
            </div>
            <div className="lp-footer"><div className="lp-badge">Since 1989</div></div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className={`form-container ${mounted ? "visible" : ""}`}>

            <div className="form-header">
              <p className="form-eyebrow">Secure Access</p>
              <h1 className="form-title">Welcome Back</h1>
              <p className="form-subtitle">Sign in with your event phone number &amp; password</p>
            </div>

            {/* Phone */}
            <div className="field">
              <label className="field-label">Phone Number</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.19 2.2 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </span>
                <input
                  type="tel" name="phone" value={form.phone}
                  onChange={handleChange} onBlur={() => handleBlur("phone")}
                  placeholder="Enter your phone number" maxLength={10}
                  className={`field-input${touched.phone && errors.phone ? " has-error" : ""}${touched.phone && !errors.phone && form.phone ? " is-valid" : ""}`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {errors.phone}
                </p>
              )}
              {touched.phone && !errors.phone && form.phone && (
                <p className="valid-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Looks good
                </p>
              )}
            </div>

            {/* Password */}
            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={form.password}
                  onChange={handleChange} onBlur={() => handleBlur("password")}
                  placeholder="Enter your password"
                  className={`field-input${touched.password && errors.password ? " has-error" : ""}${touched.password && !errors.password && form.password ? " is-valid" : ""}`}
                  style={{ paddingRight: 48 }}
                />
                <button type="button" className="toggle-btn" onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="error-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {errors.password}
                </p>
              )}
              {touched.password && !errors.password && form.password && (
                <p className="valid-msg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                  Looks good
                </p>
              )}
            </div>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">Secure Login</span>
              <div className="divider-line" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isFormValid || isLoading}
              className={`submit-btn ${isFormValid && !isLoading ? "active" : "inactive"}`}
            >
              {isLoading ? (
                <><div className="spinner" />Authenticating...</>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>

            <p className="form-footer">
              Need access? <a href="#">Contact your administrator</a>
            </p>

            <div className="debug-hint">
              <strong>💡 How to login:</strong><br />
              Use the <strong>Phone Number</strong> and <strong>Password</strong> that were set when creating the Mahal event in the admin dashboard.
            </div>

            <div className="security-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p><strong>Secure session.</strong> Your connection is encrypted and all login attempts are monitored for security.</p>
            </div>

          </div>
        </div>
      </div>

      {/* MOBILE FOOTER */}
      <div className="mobile-footer">
        <div className="lp-bg-pattern" />
        <div className="lp-grid" />
        <div className="mobile-footer-inner">
          <p className="mobile-footer-desc">
            Premium Wedding · Traditional Events · Outdoor Catering<br />
            Authentic taste with professional service for every celebration.
          </p>
          <div className="mobile-footer-stats lp-stats">
            <div className="lp-stat"><span className="lp-stat-num">0</span><span className="lp-stat-label">Events</span></div>
            <div className="lp-stat"><span className="lp-stat-num">0%</span><span className="lp-stat-label">Happy Clients</span></div>
            <div className="lp-stat"><span className="lp-stat-num">0+</span><span className="lp-stat-label">Menu Items</span></div>
          </div>
          <div className="mobile-footer-badge">Since 1989</div>
        </div>
      </div>
    </>
  );
};

export default UserLogin;
