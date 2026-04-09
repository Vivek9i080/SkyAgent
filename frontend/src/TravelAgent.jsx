import { useState, useEffect } from "react";
import {
  auth,
  loginWithGoogle,
  logout,
  registerWithEmail,
  loginWithEmail,
} from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
const API_BASE = "https://skyagent.up.railway.app";
const PlaneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="18"
    height="18"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    width="22"
    height="22"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const LoaderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
    style={{ animation: "spin 1s linear infinite" }}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const fieldMeta = [
  { key: "passenger", label: "Passenger", icon: "👤" },
  { key: "age", label: "Age", icon: "🎂" },
  { key: "origin", label: "From", icon: "🛫", format: (v) => v?.toUpperCase() },
  {
    key: "destination",
    label: "To",
    icon: "🛬",
    format: (v) => v?.toUpperCase(),
  },
  { key: "travel_date", label: "Arrival Date", icon: "📅" },

  { key: "flight_number", label: "Flight", icon: "🔢", src: "flight" },
  { key: "pnr", label: "PNR", icon: "📋" },
  { key: "booking_time", label: "Booked At", icon: "🕐" },
  {
    key: "amount",
    label: "Amount Paid",
    icon: "💳",
    src: "payment",
    format: (v) => `₹${v}`,
  },
  {
    key: "transaction_id",
    label: "Transaction ID",
    icon: "🔑",
    src: "payment",
  },
];

export default function TravelAgent() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [animIn, setAnimIn] = useState(false);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengerName, setPassengerName] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "error",
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const [passengerAge, setPassengerAge] = useState("");

  useEffect(() => {
    logout().then(() => {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setAuthLoading(false);
        setLoggingIn(false);
      });
      return () => unsubscribe();
    });
  }, []);

  function showToast(message, type = "error") {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "error" }),
      3000,
    );
  }

  const toastStyle = {
    position: "fixed",
    top: "24px",
    left: "50%",
    transform: "translateX(-50%)",
    background:
      toast.type === "error" ? "rgba(239,68,68,0.95)" : "rgba(34,197,94,0.95)",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    zIndex: 999,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    animation: "slideDown 0.3s ease",
    maxWidth: "400px",
    textAlign: "center",
  };

  async function handleBook() {
    if (!query.trim()) return;
    setStatus("loading");
    setFlights([]);
    setSelectedFlight(null);
    setResult(null);
    setAnimIn(false);

    try {
      const res = await fetch(`${API_BASE}/ai-book-flight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: query,
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (data.booking) {
        setResult(data);
        setStatus("age");
        return;
      }

      if (data.flights && data.flights.length > 0) {
        setFlights(data.flights);
        setStatus("flights");
        return;
      }

      setStatus("unavailable");
    } catch (e) {
      setErrorMsg(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  async function handleSelect() {
    setStatus("confirming");
    try {
      const res = await fetch(`${API_BASE}/book-flight/${selectedIndex}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passenger: passengerName, age: passengerAge }),
      });
      const data = await res.json();
      console.log("Book response:", data);

      if (data.booking) {
        setResult(data);
        setTimeout(() => {
          setStatus("success");
          setPassengerName("");
          setTimeout(() => setAnimIn(true), 50);
        }, 1500);
        return;
      }
      setStatus("unavailable");
    } catch (e) {
      setErrorMsg(e.message || "Something went wrong.");
      setStatus("error");
    }
  }

  async function handleAuth() {
    setLoggingIn(true);
    try {
      if (authMode === "register") {
        await registerWithEmail(
          authForm.name,
          authForm.email,
          authForm.password,
        );
      } else {
        await loginWithEmail(authForm.email, authForm.password);
      }
    } catch (e) {
      setLoggingIn(false);
      showToast(e.message);
      setAuthForm({ name: "", email: "", password: "" });
      if (
        e.message ===
        "These credentials are not registered. Please register first."
      ) {
        setTimeout(() => setAuthMode("register"), 3000);
      }
    }
  }

  function getValue(meta, data) {
    if (meta.key === "flight_number") {
      const airline =
        (data.selected_flight ?? data.selected_flights)?.airline || "";
      const flight =
        (data.selected_flight ?? data.selected_flights)?.flight_number || "";
      return `${airline} ${flight}`.trim() || "—";
    }
    if (meta.key === "passenger") {
      const name =
        data.booking?.passenger ||
        user?.displayName?.split(" ")[0] ||
        user?.email?.split("@")[0] ||
        "—";
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    if (meta.key === "age") {
      return data.booking?.age || passengerAge || "—";
    }
    const raw =
      meta.src === "flight"
        ? data.selected_flights?.[meta.key]
        : meta.src === "payment"
          ? data.payment?.[meta.key]
          : data.booking?.[meta.key];
    return meta.format ? meta.format(raw) : raw;
  }

  function handleAgeConfirm() {
    if (result) {
      setStatus("confirming");
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => setAnimIn(true), 50);
      }, 1500);
    } else {
      setStatus("flights");
    }
  }

  /* ── Shared background elements ── */
  const Background = () => (
    <>
      <div className="stars" />
      <div className="aurora-1" />
      <div className="aurora-2" />
      <div className="plane plane-1">✈</div>
      <div className="plane plane-2">✈</div>
      <div className="plane plane-3">✈</div>
      <div style={styles.blob1} />
      <div style={styles.blob2} />
      <div style={styles.blob3} />
    </>
  );

  if (authLoading) {
    return (
      <div style={styles.root}>
        <style>{css}</style>
        {toast.show && (
          <div style={{ ...toastStyle }}>
            {toast.type === "error" ? "⚠️" : "✅"} &nbsp;{toast.message}
          </div>
        )}
        <Background />
        <div style={{ color: "#f0f4ff", fontSize: "18px" }}>Loading...</div>
      </div>
    );
  }

  if (loggingOut) {
    return (
      <div style={styles.root}>
        <style>{css}</style>
        {toast.show && (
          <div style={{ ...toastStyle }}>
            {toast.type === "error" ? "⚠️" : "✅"} &nbsp;{toast.message}
          </div>
        )}
        <Background />
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>👋</div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "700",
                color: "#f0f4ff",
                marginBottom: "8px",
              }}
            >
              Goodbye,{" "}
              {user?.displayName?.split(" ")[0]?.charAt(0).toUpperCase() +
                user?.displayName?.split(" ")[0]?.slice(1).toLowerCase()}
              !
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)" }}>
              Logging you out...
            </div>
            <div style={{ ...styles.dotsRow, marginTop: "20px" }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loggingIn) {
    return (
      <div style={styles.root}>
        <style>{css}</style>
        {toast.show && (
          <div style={{ ...toastStyle }}>
            {toast.type === "error" ? "⚠️" : "✅"} &nbsp;{toast.message}
          </div>
        )}
        <Background />
        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={styles.bookingPlane}>✈️</div>
            <div style={styles.bookingTitle}>
              {authMode === "register"
                ? "Creating your account..."
                : "Logging you in..."}
            </div>
            <div style={styles.bookingSubtitle}>
              {authMode === "register"
                ? "Setting up your SkyAgent account"
                : "Welcome back to SkyAgent"}
            </div>
            <div style={{ ...styles.dotsRow, marginTop: "20px" }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.root}>
        <style>{css}</style>
        {toast.show && (
          <div style={{ ...toastStyle }}>
            {toast.type === "error" ? "⚠️" : "✅"} &nbsp;{toast.message}
          </div>
        )}
        <Background />

        <div style={styles.card}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            {/* Logo */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #3878ff 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(56,120,255,0.4)",
              }}
            >
              <PlaneIcon />
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "#f0f4ff",
                marginBottom: "6px",
                letterSpacing: "-0.5px",
              }}
            >
              Welcome to SkyAgent ✈️
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "28px",
              }}
            >
              {authMode === "login"
                ? "Sign in to your account"
                : "Create your account"}
            </div>

            {/* Toggle */}
            <div style={styles.authToggle}>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(authMode === "login" ? styles.toggleActive : {}),
                }}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                style={{
                  ...styles.toggleBtn,
                  ...(authMode === "register" ? styles.toggleActive : {}),
                }}
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {authMode === "register" && (
                <input
                  style={{ ...styles.input, paddingLeft: "16px" }}
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, name: e.target.value })
                  }
                />
              )}

              <input
                style={{ ...styles.input, paddingLeft: "16px" }}
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({ ...authForm, email: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />

              <input
                style={{ ...styles.input, paddingLeft: "16px" }}
                placeholder="Password"
                type="password"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({ ...authForm, password: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              />
            </div>

            {/* Submit button */}
            <button
              style={{ ...styles.btn, width: "100%", marginTop: "16px" }}
              onClick={handleAuth}
            >
              {authMode === "login" ? "Login" : "Create Account"}
            </button>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: "20px 0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
              <span
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}
              >
                OR
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            </div>

            {/* Google button */}
            <button
              onClick={async () => {
                setLoggingIn(true);
                try {
                  await loginWithGoogle();
                } catch (e) {
                  setLoggingIn(false);
                  showToast(e.message);
                }
              }}
              style={styles.googleBtn}
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                width="20"
                height="20"
              />
              &nbsp;&nbsp;Continue with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <style>{css}</style>
      {toast.show && (
        <div style={{ ...toastStyle }}>
          {toast.type === "error" ? "⚠️" : "✅"} &nbsp;{toast.message}
        </div>
      )}

      <Background />

      <div
        style={{
          ...styles.card,
          ...(status === "success" && { overflowY: "hidden" }),
        }}
        className="card"
      >
        {/* Header */}
        {status !== "success" &&
          status !== "unavailable" &&
          status !== "flights" &&
          status !== "passenger" &&
          status !== "booking" &&
          status !== "confirming" &&
          status !== "age" && (
            <>
              <div style={styles.header}>
                <div style={styles.logoRow}>
                  <div style={styles.logoIcon}>
                    <PlaneIcon />
                  </div>
                  <div>
                    <div style={styles.logoTitle}>
                      Welcome,{" "}
                      {user?.displayName?.split(" ")[0] ||
                        user?.email?.split("@")[0]}{" "}
                      to SkyAgent ✈️
                    </div>
                    <div style={styles.logoSub}>AI-Powered Flight Booking</div>
                  </div>
                </div>
              </div>
              <div style={styles.divider} />
            </>
          )}

        {/* Input area */}
        {status !== "success" &&
          status !== "unavailable" &&
          status !== "passenger" &&
          status !== "booking" &&
          status !== "confirming" &&
          status !== "age" && (
            <div style={styles.inputSection}>
              <label style={styles.label}>Where would you like to go? ✈️</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <SearchIcon />
                </span>
                <input
                  style={styles.input}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBook()}
                  placeholder="Book a flight…"
                />
              </div>
              {status !== "flights" && (
                <button
                  style={{
                    ...styles.btn,
                    ...(status === "loading" ? styles.btnLoading : {}),
                    ...(!query.trim() ? styles.btnDisabled : {}),
                  }}
                  onClick={handleBook}
                  disabled={status === "loading" || !query.trim()}
                >
                  {status === "loading" ? (
                    <>
                      <LoaderIcon /> &nbsp;Searching Flights…
                    </>
                  ) : (
                    <>
                      <PlaneIcon /> &nbsp;Book My Flight
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        {/* Error */}
        {status === "error" && (
          <div style={styles.errorBox}>⚠️ &nbsp;{errorMsg}</div>
        )}

        {/* Available Flights */}
        {status === "flights" && (
          <div style={styles.flightsPanel}>
            <div style={styles.flightsTitle}>✈️ Available Flights</div>
            {flights.map((f, i) => (
              <div
                key={i}
                style={styles.flightCard}
                className="flight-card-hover"
                onClick={() => {
                  setSelectedIndex(i);
                  setPassengerName("");
                  setPassengerAge("");
                  setStatus("passenger");
                }}
              >
                <div style={styles.flightLeft}>
                  <div style={styles.flightName}>
                    {i + 1}. {f.airline} ({f.flight_number})
                  </div>
                  <div style={styles.flightTime}>
                    🕐 {f.departure} → {f.arrival}
                  </div>
                </div>
                <div style={styles.flightPrice}>₹{f.price}</div>
              </div>
            ))}
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus("idle");
                setFlights([]);
                setQuery("");
              }}
            >
              ↩ Search Again
            </button>
          </div>
        )}

        {/* Age Step */}
        {status === "age" && (
          <div style={styles.passengerPanel}>
            <div style={styles.flightsTitle}>🎂 Enter Your Age</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age</label>
              <div style={styles.inputWrap}>
                <input
                  style={{ ...styles.input, paddingLeft: "16px" }}
                  placeholder="Enter your age..."
                  type="number"
                  min="1"
                  max="120"
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    passengerAge.trim() &&
                    handleAgeConfirm()
                  }
                />
              </div>
            </div>
            <button
              style={{
                ...styles.btn,
                marginTop: "6px",
                ...(!passengerAge.trim() ? styles.btnDisabled : {}),
              }}
              onClick={handleAgeConfirm}
              disabled={!passengerAge.trim()}
            >
              <PlaneIcon /> &nbsp;Continue
            </button>
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus("idle");
                setPassengerAge("");
                setResult(null);
                setFlights([]);
              }}
            >
              ↩ Search Again
            </button>
          </div>
        )}

        {/* Passenger Name */}
        {status === "passenger" && (
          <div style={styles.passengerPanel}>
            <div style={styles.flightsTitle}>👤 Enter Your Name</div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrap}>
                <input
                  style={{ ...styles.input, paddingLeft: "16px" }}
                  placeholder="Please Enter your Name..."
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && passengerName.trim() && handleSelect()
                  }
                />
              </div>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age</label>
              <div style={styles.inputWrap}>
                <input
                  style={{ ...styles.input, paddingLeft: "16px" }}
                  placeholder="Enter your age..."
                  type="number"
                  min="1"
                  max="120"
                  value={passengerAge}
                  onChange={(e) => setPassengerAge(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && passengerAge.trim() && handleSelect()
                  }
                />
              </div>
            </div>
            <button
              style={{
                ...styles.btn,
                marginTop: "6px",
                ...(!passengerName.trim() || !passengerAge.trim()
                  ? styles.btnDisabled
                  : {}),
              }}
              onClick={handleSelect}
              disabled={!passengerName.trim() || !passengerAge.trim()}
            >
              <PlaneIcon /> &nbsp;Confirm Booking
            </button>
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus("flights");
                setPassengerName("");
                setPassengerAge("");
              }}
            >
              ↩ Back to Flights
            </button>
          </div>
        )}

        {/* Booking in progress */}
        {status === "booking" && (
          <div style={styles.bookingWaitBox}>
            <div style={styles.bookingPlane}>✈️</div>
            <div style={styles.bookingTitle}>Booking Your Flight...</div>
            <div style={styles.bookingSubtitle}>
              Please wait a moment while we confirm your seat
            </div>
            <div style={styles.dotsRow}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        {/* Unavailable */}
        {status === "unavailable" && (
          <div style={styles.unavailableBox}>
            <div style={styles.unavailableIcon}>✈️</div>
            <div style={styles.unavailableTitle}>No Flights Available</div>
            <div style={styles.unavailableSub}>
              We couldn't find any flights for your request. Please try
              different dates or destinations.
            </div>
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus("idle");
                setResult(null);
                setQuery("");
              }}
            >
              ↩ Try Again
            </button>
          </div>
        )}

        {/* Confirming booking */}
        {status === "confirming" && (
          <div style={styles.bookingWaitBox}>
            <div style={styles.bookingPlane}>🎫</div>
            <div style={styles.bookingTitle}>Confirming Your Booking...</div>
            <div style={styles.bookingSubtitle}>
              Almost there! We are securing your seat.
            </div>
            <div style={{ ...styles.dotsRow, marginTop: "20px" }}>
              <span style={styles.dot} />
              <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
              <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
            </div>
          </div>
        )}

        {/* Success result */}
        {status === "success" && result && (
          <div
            style={{
              ...styles.resultPanel,
              ...(animIn ? styles.resultIn : styles.resultOut),
            }}
          >
            {console.log("Booking data:", result.booking)}
            <div style={styles.successHeader}>
              <div style={styles.successCheck}>
                <CheckIcon />
              </div>
              <div>
                <div style={styles.successTitle}>
                  Flight Successfully Booked!
                </div>
                <div style={styles.successSub}>
                  Your booking is confirmed. Safe travels ✈️
                </div>
              </div>
            </div>

            {/* Route banner */}
            <div style={styles.routeBanner}>
              <div style={styles.routeCity}>
                <div style={styles.routeCode}>{result.booking?.origin}</div>
                <div style={styles.routeLabel}>Origin</div>
              </div>
              <div style={styles.routeArrow}>
                <div style={styles.routeLine} />
                <div style={styles.routePlane}>✈</div>
                <div style={styles.routeLine} />
              </div>
              <div style={styles.routeCity}>
                <div style={styles.routeCode}>
                  {result.booking?.destination}
                </div>
                <div style={styles.routeLabel}>Destination</div>
              </div>
            </div>

            {/* Details grid */}
            <div style={styles.grid}>
              {fieldMeta.map((meta) => (
                <div key={meta.key} style={styles.cell}>
                  <div style={styles.cellIcon}>{meta.icon}</div>
                  <div>
                    <div style={styles.cellLabel}>{meta.label}</div>
                    <div style={styles.cellValue}>
                      {getValue(meta, result) ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              style={styles.resetBtn}
              onClick={() => {
                setStatus("idle");
                setResult(null);
                setQuery("");
                setAnimIn(false);
                setPassengerAge("");
              }}
            >
              ↩ Book Another Flight
            </button>
          </div>
        )}

        {/* Idle hint */}
        {status === "idle" && (
          <div style={styles.hint}>
            💡 Try:{" "}
            <em>
              "Book a business class flight from London to Tokyo next Monday"
            </em>
          </div>
        )}

        {status !== "confirming" && (
          <div
            className="logout-badge"
            onClick={async () => {
              setLoggingOut(true);
              await new Promise((resolve) => setTimeout(resolve, 1500));
              await logout();
              setStatus("idle");
              setQuery("");
              setUser(null);
              setLoggingOut(false);
              setAuthForm({ name: "", email: "", password: "" });
              setAuthMode("login");
            }}
            style={{
              position: "absolute",
              top: "18px",
              right: "20px",
              zIndex: 10,
              margin: "0 !important",
            }}
          >
            🚪 Logout
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = {
  root: {
    height: "100vh",
    width: "100vw",
    position: "fixed",
    top: 0,
    left: 0,
    background:
      "linear-gradient(160deg, #020510 0%, #060d24 30%, #0b1535 60%, #07112a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "24px 16px",
    overflow: "hidden",
  },
  blob1: {
    position: "fixed",
    top: "-180px",
    left: "-120px",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 40% 40%, rgba(56,120,255,0.38) 0%, rgba(56,120,255,0.14) 40%, transparent 70%)",
    pointerEvents: "none",
    filter: "blur(8px)",
    animation: "blobPulse 9s ease-in-out infinite",
  },
  blob2: {
    position: "fixed",
    bottom: "-140px",
    right: "-100px",
    width: "620px",
    height: "620px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 60% 60%, rgba(124,58,237,0.38) 0%, rgba(124,58,237,0.12) 40%, transparent 70%)",
    pointerEvents: "none",
    filter: "blur(8px)",
    animation: "blobPulse 11s ease-in-out infinite reverse",
  },
  blob3: {
    position: "fixed",
    top: "30%",
    left: "50%",
    width: "460px",
    height: "460px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 50% 50%, rgba(6,182,212,0.22) 0%, rgba(6,182,212,0.07) 45%, transparent 70%)",
    pointerEvents: "none",
    filter: "blur(6px)",
    animation: "blobPulse 13s ease-in-out infinite 2s",
  },
  card: {
    maxHeight: "90vh",
    overflowY: "auto",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderTop: "1px solid rgba(255,255,255,0.22)",
    borderLeft: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "28px",
    backdropFilter: "blur(40px) saturate(160%)",
    WebkitBackdropFilter: "blur(40px) saturate(160%)",
    padding: "36px 40px",
    width: "100%",
    maxWidth: "620px",
    boxShadow:
      "0 40px 100px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "14px" },
  logoIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #3878ff 0%, #7c3aed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow:
      "0 4px 20px rgba(56,120,255,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
  },
  logoTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f0f4ff",
    letterSpacing: "-0.4px",
  },
  logoSub: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.4)",
    marginTop: "1px",
  },
  badge: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#22c55e",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.3)",
    borderRadius: "20px",
    padding: "4px 10px",
    backdropFilter: "blur(8px)",
  },
  divider: {
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
    margin: "24px 0",
  },
  inputSection: { display: "flex", flexDirection: "column", gap: "14px" },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: "0.3px",
  },
  inputWrap: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: "16px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "rgba(255,255,255,0.35)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "15px 16px 15px 46px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderTop: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "16px",
    color: "#f0f4ff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.25s, background 0.25s, box-shadow 0.25s",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "15px 24px",
    background:
      "linear-gradient(135deg, rgba(56,120,255,0.9) 0%, rgba(124,58,237,0.9) 100%)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.15)",
    borderTop: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow:
      "0 4px 24px rgba(56,120,255,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  btnLoading: { opacity: 0.75, cursor: "not-allowed" },
  btnDisabled: { opacity: 0.35, cursor: "not-allowed" },
  errorBox: {
    marginTop: "16px",
    padding: "14px 18px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: "14px",
    color: "#fca5a5",
    fontSize: "14px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 0 rgba(239,68,68,0.1)",
  },
  resultPanel: {
    marginTop: "24px",
    transition: "opacity 0.5s ease, transform 0.5s ease",
    overflowY: "hidden",
  },
  resultOut: { opacity: 0, transform: "translateY(12px)" },
  resultIn: { opacity: 1, transform: "translateY(0)" },
  successHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
    padding: "16px 18px",
    background: "rgba(34,197,94,0.06)",
    border: "1px solid rgba(34,197,94,0.18)",
    borderTop: "1px solid rgba(34,197,94,0.28)",
    borderRadius: "16px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "inset 0 1px 0 rgba(34,197,94,0.12)",
  },
  successCheck: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "rgba(34,197,94,0.15)",
    border: "1.5px solid rgba(34,197,94,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#22c55e",
    flexShrink: 0,
    boxShadow:
      "0 0 16px rgba(34,197,94,0.2), inset 0 1px 0 rgba(34,197,94,0.2)",
  },
  successTitle: { fontSize: "18px", fontWeight: "700", color: "#f0f4ff" },
  successSub: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.45)",
    marginTop: "2px",
  },
  routeBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background:
      "linear-gradient(135deg, rgba(56,120,255,0.1) 0%, rgba(124,58,237,0.1) 100%)",
    border: "1px solid rgba(56,120,255,0.2)",
    borderTop: "1px solid rgba(56,120,255,0.3)",
    borderRadius: "18px",
    padding: "20px 24px",
    marginBottom: "20px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(56,120,255,0.1)",
  },
  routeCity: { textAlign: "center" },
  routeCode: {
    fontSize: "19px",
    fontWeight: "800",
    color: "#f0f4ff",
    letterSpacing: "0.8px",
    textTransform: "uppercase",
    textShadow: "0 0 20px rgba(56,120,255,0.4)",
  },
  routeLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    marginTop: "2px",
    letterSpacing: "0.5px",
  },
  routeArrow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flex: 1,
    padding: "0 16px",
  },
  routeLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.15)",
    borderTop: "1px dashed rgba(255,255,255,0.2)",
  },
  routePlane: { fontSize: "20px", color: "#5b9fff" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  cell: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderTop: "1px solid rgba(255,255,255,0.14)",
    borderRadius: "14px",
    padding: "14px",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.15)",
    transition: "background 0.2s, border-color 0.2s",
  },
  cellIcon: { fontSize: "18px", marginTop: "1px", flexShrink: 0 },
  cellLabel: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    letterSpacing: "0.4px",
    marginBottom: "3px",
  },
  cellValue: {
    fontSize: "14px",
    color: "#e8eeff",
    fontWeight: "600",
    wordBreak: "break-all",
  },
  hint: {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "13px",
    color: "rgba(255,255,255,0.3)",
    lineHeight: "1.6",
    padding: "14px 18px",
  },
  resetBtn: {
    marginTop: "16px",
    width: "100%",
    padding: "13px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderTop: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "14px",
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  unavailableBox: {
    marginTop: "24px",
    textAlign: "center",
    padding: "32px 24px",
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.18)",
    borderTop: "1px solid rgba(239,68,68,0.28)",
    borderRadius: "20px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "inset 0 1px 0 rgba(239,68,68,0.1)",
  },
  unavailableIcon: {
    fontSize: "48px",
    marginBottom: "16px",
    filter: "grayscale(1)",
  },
  unavailableTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#f0f4ff",
    marginBottom: "8px",
  },
  unavailableSub: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.4)",
    lineHeight: "1.6",
    marginBottom: "20px",
  },
  flightsPanel: {
    marginTop: "24px",
  },
  flightsTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f0f4ff",
    marginBottom: "14px",
  },
  flightCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderTop: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "16px",
    marginBottom: "10px",
    cursor: "pointer",
    transition: "all 0.25s",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.15)",
  },
  flightLeft: { display: "flex", flexDirection: "column", gap: "4px" },
  flightName: { fontSize: "15px", fontWeight: "600", color: "#f0f4ff" },
  flightTime: { fontSize: "13px", color: "rgba(255,255,255,0.45)" },
  flightPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#5b9fff",
    textShadow: "0 0 12px rgba(91,159,255,0.4)",
  },
  passengerPanel: {
    marginTop: "24px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "14px",
  },
  bookingWaitBox: {
    marginTop: "24px",
    textAlign: "center",
    padding: "48px 24px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.07)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },
  bookingPlane: {
    fontSize: "52px",
    marginBottom: "20px",
    display: "block",
    animation: "float 2s ease-in-out infinite",
    filter: "drop-shadow(0 0 16px rgba(56,120,255,0.5))",
  },
  bookingTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#f0f4ff",
    marginBottom: "10px",
  },
  bookingSubtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.4)",
    marginBottom: "28px",
  },
  dotsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "rgba(56,120,255,0.9)",
    display: "inline-block",
    animation: "bounce 0.8s ease-in-out infinite",
    boxShadow: "0 0 8px rgba(56,120,255,0.6)",
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 24px",
    background: "rgba(255,255,255,0.92)",
    color: "#1a1a2e",
    border: "1px solid rgba(255,255,255,0.3)",
    borderTop: "1px solid rgba(255,255,255,0.6)",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    boxShadow:
      "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  authToggle: {
    display: "flex",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "4px",
    gap: "4px",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.15)",
  },
  toggleBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    borderRadius: "10px",
    background: "transparent",
    color: "rgba(255,255,255,0.4)",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  toggleActive: {
    background: "rgba(255,255,255,0.1)",
    color: "#f0f4ff",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  html, body { margin: 0; overflow: hidden; height: 100%; }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(-8px); opacity: 1; }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(3deg); }
    66% { transform: translateY(-6px) rotate(-2deg); }
  }

  @keyframes blobPulse {
    0%, 100% { transform: scale(1) translate(0, 0); opacity: 1; }
    33% { transform: scale(1.12) translate(14px, -18px); opacity: 0.88; }
    66% { transform: scale(0.93) translate(-10px, 12px); opacity: 0.96; }
  }

  @keyframes auroraMove {
    0%, 100% { transform: translateX(-12%) skewX(-8deg) scaleY(1) scaleX(1.05); opacity: 0.6; }
    40% { transform: translateX(10%) skewX(6deg) scaleY(1.2) scaleX(0.98); opacity: 0.8; }
    70% { transform: translateX(-5%) skewX(-3deg) scaleY(0.9) scaleX(1.02); opacity: 0.65; }
  }

  @keyframes auroraMove2 {
    0%, 100% { transform: translateX(10%) skewX(7deg) scaleY(1) scaleX(1.04); opacity: 0.5; }
    45% { transform: translateX(-10%) skewX(-6deg) scaleY(1.15) scaleX(0.97); opacity: 0.7; }
    75% { transform: translateX(4%) skewX(3deg) scaleY(0.92) scaleX(1.01); opacity: 0.55; }
  }

  @keyframes starTwinkle {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.8); }
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* ── Plane fly-across animations ── */
  @keyframes flyPlane1 {
    0%   { transform: translateX(-140px) translateY(0px); opacity: 0; }
    4%   { opacity: 1; }
    96%  { opacity: 1; }
    100% { transform: translateX(110vw) translateY(-70px); opacity: 0; }
  }
  @keyframes flyPlane2 {
    0%   { transform: translateX(-140px) translateY(0px); opacity: 0; }
    4%   { opacity: 0.85; }
    96%  { opacity: 0.85; }
    100% { transform: translateX(110vw) translateY(50px); opacity: 0; }
  }
  @keyframes flyPlane3 {
    0%   { transform: scaleX(-1) translateX(-140px) translateY(0px); opacity: 0; }
    4%   { opacity: 0.7; }
    96%  { opacity: 0.7; }
    100% { transform: scaleX(-1) translateX(110vw) translateY(-40px); opacity: 0; }
  }

  .plane {
    position: fixed;
    pointer-events: none;
    z-index: 0;
    font-size: 24px;
    line-height: 1;
    filter: drop-shadow(0 0 10px rgba(100,160,255,0.7)) drop-shadow(0 0 4px rgba(180,210,255,0.5));
    opacity: 0;
  }
  .plane-1 {
    top: 12%;
    left: 0;
    animation: flyPlane1 24s linear infinite 2s;
  }
  .plane-2 {
    top: 62%;
    left: 0;
    animation: flyPlane2 32s linear infinite 13s;
  }
  .plane-3 {
    top: 38%;
    right: 0;
    animation: flyPlane3 28s linear infinite 7s;
  }

  /* Aurora layers */
  .aurora-1 {
    position: fixed; pointer-events: none;
    top: -10%; left: -5%; width: 110%; height: 42%;
    background: linear-gradient(180deg,
      rgba(56,120,255,0.0) 0%,
      rgba(56,120,255,0.13) 35%,
      rgba(100,60,240,0.18) 60%,
      rgba(6,182,212,0.10) 80%,
      transparent 100%);
    filter: blur(28px);
    animation: auroraMove 15s ease-in-out infinite;
    z-index: 0;
  }

  .aurora-2 {
    position: fixed; pointer-events: none;
    bottom: -8%; right: -5%; width: 100%; height: 38%;
    background: linear-gradient(0deg,
      rgba(124,58,237,0.0) 0%,
      rgba(124,58,237,0.14) 40%,
      rgba(56,120,255,0.10) 65%,
      transparent 100%);
    filter: blur(30px);
    animation: auroraMove2 18s ease-in-out infinite 2s;
    z-index: 0;
  }

  /* Star field — larger, more visible stars */
  .stars {
    position: fixed; pointer-events: none;
    inset: 0; z-index: 0;
    background-image:
      radial-gradient(2px 2px at 12% 18%, rgba(255,255,255,0.95) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 28% 7%, rgba(255,255,255,0.8) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 43% 32%, rgba(180,210,255,1) 0%, transparent 100%),
      radial-gradient(2px 2px at 57% 14%, rgba(255,255,255,0.9) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 71% 28%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 85% 9%, rgba(200,180,255,1) 0%, transparent 100%),
      radial-gradient(2px 2px at 92% 41%, rgba(255,255,255,0.8) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 6% 55%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 19% 68%, rgba(180,220,255,0.95) 0%, transparent 100%),
      radial-gradient(2px 2px at 34% 79%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 50% 62%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 65% 85%, rgba(210,190,255,0.9) 0%, transparent 100%),
      radial-gradient(2px 2px at 78% 71%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 88% 58%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(2px 2px at 96% 88%, rgba(255,255,255,0.8) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 23% 91%, rgba(255,255,255,0.65) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 40% 96%, rgba(180,210,255,0.85) 0%, transparent 100%),
      radial-gradient(2px 2px at 60% 48%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(2px 2px at 75% 93%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(3px 3px at 5% 35%, rgba(200,220,255,0.9) 0%, transparent 100%),
      radial-gradient(2px 2px at 47% 52%, rgba(255,255,255,0.55) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 82% 44%, rgba(210,190,255,0.8) 0%, transparent 100%),
      radial-gradient(3px 3px at 30% 22%, rgba(180,210,255,0.85) 0%, transparent 100%),
      radial-gradient(2px 2px at 64% 6%, rgba(255,255,255,0.75) 0%, transparent 100%);
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  /* Twinkling stars — larger and more dramatic pulse */
  .stars::after {
    content: '';
    position: absolute; inset: 0;
    background-image:
      radial-gradient(3px 3px at 15% 25%, rgba(255,255,255,1) 0%, transparent 100%),
      radial-gradient(3px 3px at 55% 40%, rgba(180,210,255,1) 0%, transparent 100%),
      radial-gradient(3px 3px at 80% 15%, rgba(210,180,255,1) 0%, transparent 100%),
      radial-gradient(3px 3px at 35% 75%, rgba(255,255,255,1) 0%, transparent 100%),
      radial-gradient(3px 3px at 90% 65%, rgba(180,220,255,1) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 68% 55%, rgba(255,255,255,0.9) 0%, transparent 100%),
      radial-gradient(2.5px 2.5px at 22% 48%, rgba(200,180,255,0.9) 0%, transparent 100%);
    background-size: 100% 100%;
    background-repeat: no-repeat;
    animation: starTwinkle 3.5s ease-in-out infinite;
  }

  input::placeholder { color: rgba(255,255,255,0.22); }

  input:focus {
    border-color: rgba(56,120,255,0.55) !important;
    border-top-color: rgba(56,120,255,0.7) !important;
    background: rgba(255,255,255,0.09) !important;
    box-shadow: 0 0 0 3px rgba(56,120,255,0.14), inset 0 2px 8px rgba(0,0,0,0.12) !important;
  }

  button:not(:disabled):hover {
    opacity: 0.88;
    transform: translateY(-1.5px);
    box-shadow: 0 8px 32px rgba(56,120,255,0.45) !important;
  }

  .card::-webkit-scrollbar { display: none; }
  .card { -ms-overflow-style: none; scrollbar-width: none; }

  .reset-btn:hover {
    background: rgba(255,255,255,0.09) !important;
    color: #fff !important;
    border-color: rgba(255,255,255,0.2) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.1) !important;
  }

  .flight-card-hover:hover {
    background: rgba(56,120,255,0.1) !important;
    border-color: rgba(56,120,255,0.3) !important;
    box-shadow: 0 4px 24px rgba(56,120,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1) !important;
    transform: translateY(-1px);
  }

  .logout-badge {
    font-size: 10px !important;
    font-weight: 700 !important;
    letter-spacing: 1px !important;
    color: rgba(239,68,68,0.8) !important;
    background: rgba(239,68,68,0.07) !important;
    border: 1px solid rgba(239,68,68,0.2) !important;
    border-radius: 20px !important;
    padding: 4px 14px !important;
    cursor: pointer !important;
    width: fit-content !important;
    text-align: center !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    box-shadow: inset 0 1px 0 rgba(239,68,68,0.1) !important;
    transition: all 0.2s !important;
  }
  .logout-badge:hover {
    background: rgba(239,68,68,0.14) !important;
    border-color: rgba(239,68,68,0.35) !important;
    color: #ef4444 !important;
    box-shadow: 0 4px 16px rgba(239,68,68,0.15), inset 0 1px 0 rgba(239,68,68,0.15) !important;
  }
`;