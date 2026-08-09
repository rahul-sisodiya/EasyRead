import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";

  const RAW = import.meta.env.VITE_API_URL;
  const API = RAW ? ((RAW.startsWith("http") || RAW.startsWith("/")) ? RAW : `/${RAW}`) : (isLocal ? "http://localhost:5000/api" : "https://easyread-nxdy.onrender.com/api");

  const onSubmit = e => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Fill all fields"); return; }
    (async () => {
      try {
        setLoading(true);
        const r = await axios.post(`${API}/auth/login`, { email, password });
        const u = r.data;
        localStorage.setItem("easyread_user", JSON.stringify({ email: u.email, name: u.name, userId: u.userId }));
        try { await axios.post(`${API}/books/migrate`, { toUserId: u.userId }); } catch {}
        try { await axios.post(`${API}/vocab/migrate`, { toUserId: u.userId }); } catch {}
        try { await axios.post(`${API}/highlights/migrate`, { toUserId: u.userId }); } catch {}
        navigate("/upload");
        setLoading(false);
      } catch (err) {
        try {
          const rr = await axios.post(`${API}/auth/register`, { name: "", email, password });
          const u = rr.data;
          localStorage.setItem("easyread_user", JSON.stringify({ email: u.email, name: u.name, userId: u.userId }));
          try { await axios.post(`${API}/books/migrate`, { toUserId: u.userId }); } catch {}
          try { await axios.post(`${API}/vocab/migrate`, { toUserId: u.userId }); } catch {}
          try { await axios.post(`${API}/highlights/migrate`, { toUserId: u.userId }); } catch {}
          navigate("/upload");
          setLoading(false);
        } catch {
          setError("Invalid credentials");
          setLoading(false);
        }
      }
    })();
  };
  const BookLoader = () => {
    const bg = "#000000";
    const pageColor = "#f4f0e6";
    const accent = "#ffffff";
    return (
      <div style={{ position: "fixed", inset: 0, background: bg, display: "grid", placeItems: "center", zIndex: 1000 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", width: 160, height: 120, margin: "0 auto", perspective: 800 }}>
            <div style={{ position: "absolute", top: 0, left: "50%", width: 76, height: 120, background: pageColor, border: "1px solid #222", transformOrigin: "left center", borderTopLeftRadius: 6, borderBottomLeftRadius: 6, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", animation: "bookLeft 1200ms ease-in-out infinite alternate" }} />
            <div style={{ position: "absolute", top: 0, left: "50%", width: 76, height: 120, background: pageColor, border: "1px solid #222", transformOrigin: "right center", borderTopRightRadius: 6, borderBottomRightRadius: 6, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", animation: "bookRight 1200ms ease-in-out infinite alternate" }} />
            <div style={{ position: "absolute", top: 8, left: "calc(50% - 1px)", width: 2, height: 104, background: "#ddd" }} />
          </div>
          <div style={{ marginTop: 16, color: accent, fontWeight: 600 }}>Signing in…</div>
          <style>{`
            @keyframes bookLeft { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(-40deg) translateZ(0); } }
            @keyframes bookRight { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(40deg) translateZ(0); } }
          `}</style>
        </div>
      </div>
    );
  };
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      {loading && <BookLoader />}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="text-2xl font-bold text-white mb-4">Sign In</div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-neutral-400">Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" placeholder="you@example.com" />
          </div>
          <div>
            <div className="mb-1 text-sm text-neutral-400">Password</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" placeholder="••••••••" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button className="w-full px-4 py-2 bg-white text-black rounded-md font-semibold btn-animated">Sign In</button>
        </form>
        <div className="mt-4 text-sm text-neutral-400">No account? <Link to="/register" className="text-white">Register</Link></div>
      </div>
    </div>
  );
}
