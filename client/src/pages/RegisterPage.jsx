import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";

  const API = import.meta.env.VITE_API_URL || (isLocal ? "http://localhost:5000/api" : "https://easyread-nxdy.onrender.com/api");

  const onSubmit = e => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) { setError("Fill all fields"); return; }
    (async () => {
      try {
        const r = await axios.post(`${API}/auth/register`, { name, email, password });
        const u = r.data;
        localStorage.setItem("easyread_user", JSON.stringify({ email: u.email, name: u.name, userId: u.userId }));
        const toUserId = u.userId;
        try { await axios.post(`${API}/books/migrate`, { toUserId }); } catch {}
        try { await axios.post(`${API}/vocab/migrate`, { toUserId }); } catch {}
        try { await axios.post(`${API}/highlights/migrate`, { toUserId }); } catch {}
        navigate("/upload");
      } catch (err) {
        setError("Register failed or user exists");
      }
    })();
  };
  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="text-2xl font-bold text-white mb-4">Register</div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-neutral-400">Name</div>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" placeholder="Your name" />
          </div>
          <div>
            <div className="mb-1 text-sm text-neutral-400">Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" placeholder="you@example.com" />
          </div>
          <div>
            <div className="mb-1 text-sm text-neutral-400">Password</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" placeholder="••••••••" />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button className="w-full px-4 py-2 bg-white text-black rounded-md font-semibold btn-animated">Create Account</button>
        </form>
        <div className="mt-4 text-sm text-neutral-400">Already have an account? <Link to="/signin" className="text-white">Sign in</Link></div>
      </div>
    </div>
  );
}
