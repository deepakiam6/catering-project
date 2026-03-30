import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../components/Navbar";

type MahalType = {
  id: string;
  nameEnglish: string;
  fromDate: string;
  toDate?: string;
  location: string;
  image?: string;
  userId?: string;
  password?: string;
};

const tamilMonths: Record<string, string> = {
  "01": "தை",
  "02": "மாசி",
  "03": "பங்குனி",
  "04": "சித்திரை",
  "05": "வைகாசி",
  "06": "ஆனி",
  "07": "ஆடி",
  "08": "ஆவணி",
  "09": "புரட்டாசி",
  "10": "ஐப்பசி",
  "11": "கார்த்திகை",
  "12": "மார்கழி",
};

const englishMonths: Record<string, string> = {
  "01": "January",
  "02": "February",
  "03": "March",
  "04": "April",
  "05": "May",
  "06": "June",
  "07": "July",
  "08": "August",
  "09": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const defaultImages = Array.from(
  { length: 10 },
  (_, i) => `/images/mahal${i + 1}.jpg`
);

const inputCls =
  "w-full rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-900 outline-none transition placeholder:text-green-300 focus:border-green-600 focus:ring-4 focus:ring-green-600/10";

const sectionTitleCls =
  "mb-4 mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-green-600";

const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.43 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export default function CreateMahal() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPreviewPassword, setShowPreviewPassword] = useState(false);

  const [mahal, setMahal] = useState<MahalType>({
    id: "",
    nameEnglish: "",
    fromDate: "",
    toDate: "",
    location: "",
    image: "",
    userId: "",
    password: "",
  });

  useEffect(() => {
    if (!id) return;
    const stored: MahalType[] = JSON.parse(localStorage.getItem("events") || "[]");
    const found = stored.find((e) => e.id === id);
    if (found) {
      setMahal(found);
      setUserId(found.userId || "");
      setPassword(found.password || "");
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMahal({ ...mahal, [e.target.name]: e.target.value });
    setError("");
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setMahal({ ...mahal, image: reader.result as string });
    reader.readAsDataURL(file);
  };

  const formatDate = (date?: string) => {
    if (!date) return "";
    const [y, m, d] = date.split("-");
    return `${d}-${m}-${y}`;
  };

  const monthLabel = () => {
    if (!mahal.fromDate) return "";
    const fm = mahal.fromDate.split("-")[1];
    const tm = mahal.toDate?.split("-")[1];

    if (!mahal.toDate || fm === tm) {
      return `${tamilMonths[fm]} · ${englishMonths[fm]}`;
    }

    return `${tamilMonths[fm]} · ${englishMonths[fm]} → ${tamilMonths[tm!]} · ${englishMonths[tm!]}`;
  };

  const submit = () => {
    if (!mahal.nameEnglish) return setError("Mahal name is required");
    if (!mahal.fromDate) return setError("From date is required");

    if (mahal.toDate) {
      if (mahal.fromDate === mahal.toDate) {
        return setError("From and To dates cannot be same");
      }
      if (new Date(mahal.fromDate) > new Date(mahal.toDate)) {
        return setError("To date must be after From date");
      }
    }

    const stored: MahalType[] = JSON.parse(localStorage.getItem("events") || "[]");

    const fullMahal: MahalType = {
      ...mahal,
      userId: userId.trim(),
      password: password.trim(),
    };

    let currentId = id;

    if (id) {
      const updated = stored.map((e) => (e.id === id ? { ...fullMahal, id } : e));
      localStorage.setItem("events", JSON.stringify(updated));
    } else {
      const nextId = (stored.length + 1).toString().padStart(2, "0");
      const newMahal: MahalType = { ...fullMahal, id: nextId };
      stored.push(newMahal);
      localStorage.setItem("events", JSON.stringify(stored));
      currentId = nextId;
    }

    setSuccess(true);

    setTimeout(() => {
      if (id) navigate("/admin/dashboard");
      else navigate(`/book-food/${currentId}`);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#f0fdf4_0%,#ecfdf5_60%,#d1fae5_100%)] text-green-950">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-2xl text-white shadow-[0_4px_14px_rgba(22,163,74,0.3)]">
            🏛
          </div>

          <div>
            <h1 className="text-3xl font-extrabold leading-tight text-green-950">
              {id ? "Edit" : "Create"} <span className="text-green-600">Mahal</span> Event
            </h1>
            <p className="mt-1 text-sm font-medium text-green-700/70">
              Fill in the details to register your event
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-300 bg-green-100 px-4 py-3 text-sm font-semibold text-green-700">
            ✔ Saved successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            ⚠ {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[22px] border border-emerald-100 bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className={sectionTitleCls}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                1
              </span>
              <span>Event Details</span>
              <span className="h-px flex-1 bg-green-200" />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                Mahal Name
              </label>
              <input
                name="nameEnglish"
                value={mahal.nameEnglish}
                onChange={handleChange}
                placeholder="e.g. GRANT LOTUS"
                className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-950 outline-none transition placeholder:text-green-300 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                Location
              </label>
              <input
                name="location"
                value={mahal.location}
                onChange={handleChange}
                placeholder="e.g. GOBI, Tamil Nadu"
                className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-950 outline-none transition placeholder:text-green-300 focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
              />
            </div>

            <div className={sectionTitleCls}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                2
              </span>
              <span>Event Dates</span>
              <span className="h-px flex-1 bg-green-200" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="mb-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                  From Date
                </label>
                <input
                  type="date"
                  name="fromDate"
                  value={mahal.fromDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-950 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                />
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                  To Date <span className="normal-case tracking-normal opacity-60">(optional)</span>
                </label>
                <input
                  type="date"
                  name="toDate"
                  value={mahal.toDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-950 outline-none transition focus:border-green-600 focus:bg-white focus:ring-4 focus:ring-green-600/10"
                />
              </div>
            </div>

            <div className={sectionTitleCls}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                3
              </span>
              <span>Credentials</span>
              <span className="h-px flex-1 bg-green-200" />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                User Phone Number
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-gray-500">
                  <PhoneIcon />
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter user phone number"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
                Password
              </label>
              <div className="relative flex items-center">
                <span className="pointer-events-none absolute left-3 text-gray-500">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  className={`${inputCls} pl-9 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 rounded-md p-1 text-gray-500 transition hover:text-green-600"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            <div className={sectionTitleCls}>
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] text-white">
                4
              </span>
              <span>Cover Image</span>
              <span className="h-px flex-1 bg-green-200" />
            </div>

            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-dashed border-green-400 bg-green-50 px-4 py-3 text-green-600 transition hover:bg-green-100">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-200 to-green-300 text-sm">
                📷
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {mahal.image?.startsWith("data:")
                    ? "Image selected ✓"
                    : "Upload from device"}
                </div>
                <div className="text-[11px] font-normal text-green-700/60">
                  JPG, PNG, WEBP
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="hidden"
              />
            </label>

            <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-green-700/70">
              Quick Pick
            </p>

            <div className="grid grid-cols-5 gap-2">
              {defaultImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setMahal({ ...mahal, image: img })}
                  className={`h-12 w-full cursor-pointer rounded-lg object-cover transition hover:scale-105 hover:shadow-md ${
                    mahal.image === img
                      ? "scale-105 border-2 border-green-600 ring-4 ring-green-600/20"
                      : "border-2 border-transparent"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={submit}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-3 text-sm font-bold tracking-wide text-white shadow-[0_4px_16px_rgba(22,163,74,0.35)] transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_7px_22px_rgba(22,163,74,0.4)]"
            >
              {id ? "Update Event →" : "Create Event →"}
            </button>
          </div>

          <div className="rounded-[22px] border border-emerald-100 bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-green-600">
              <span>{id ? "EDIT EVENT" : "CREATE EVENT"}</span>
              <span className="h-px flex-1 bg-green-200" />
            </div>

            <div className="relative h-[185px] overflow-hidden rounded-2xl">
              <img
                src={mahal.image || "/images/mahal1.jpg"}
                alt="Preview"
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-green-950/60 to-transparent" />
            </div>

            <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 text-white">
              <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute bottom-[-30px] right-5 h-16 w-16 rounded-full bg-white/10" />

              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
                {monthLabel() || "Tamil Month · English Month"}
              </p>
              <p className="text-2xl font-extrabold leading-tight">
                {mahal.fromDate ? formatDate(mahal.fromDate) : "DD-MM-YYYY"}
                {mahal.toDate ? ` - ${formatDate(mahal.toDate)}` : ""}
              </p>
            </div>

            <div className="mt-4">
              <p
                className={`text-lg font-extrabold ${
                  !mahal.nameEnglish
                    ? "italic font-normal text-green-300"
                    : "text-green-950"
                }`}
              >
                {mahal.nameEnglish || "Mahal Name"}
              </p>

              <div className="my-3 h-px bg-gradient-to-r from-green-200 to-transparent" />

              <p
                className={`flex items-center gap-2 text-sm font-medium ${
                  !mahal.location ? "italic text-green-300" : "text-green-700/80"
                }`}
              >
                <span>📍</span>
                <span>{mahal.location || "Location not set"}</span>
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-green-700/80">
                <span className="text-gray-500">
                  <PhoneIcon />
                </span>
                <span>
                  {userId || <span className="opacity-40">Phone not set</span>}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-green-700/80">
                <span className="text-gray-500">
                  <LockIcon />
                </span>

                <span className="flex-1">
                  {password ? (
                    showPreviewPassword ? (
                      password
                    ) : (
                      "•".repeat(password.length)
                    )
                  ) : (
                    <span className="opacity-40">Password not set</span>
                  )}
                </span>

                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPreviewPassword((p) => !p)}
                    title={showPreviewPassword ? "Hide" : "Show"}
                    className="rounded-md p-1 text-gray-400 transition hover:text-green-600"
                  >
                    {showPreviewPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
