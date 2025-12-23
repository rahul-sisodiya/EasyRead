import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UserBadge() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [booksCount, setBooksCount] = useState(null);
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("easyread_user") || "null"); } catch { return null; }
  }, []);
  const userId = (user && user.userId) ? user.userId : "guest";
  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
    const API = import.meta.env.VITE_API_URL || (isLocal ? "https://easyread-nxdy.onrender.com/api" : "/api");
    let active = true;
    (async () => {
      try {
        const r = await fetch(`${API}/books?userId=${encodeURIComponent(userId)}`);
        const j = await r.json();
        if (!active) return;
        setBooksCount(Array.isArray(j.items) ? j.items.length : 0);
      } catch { setBooksCount(null); }
    })();
    return () => { active = false; };
  }, [userId]);

  const avatar = useMemo(() => {
    const seed = encodeURIComponent(String(user?.name || user?.email || "Guest"));
    return user?.photoUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${seed}`;
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="User menu" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700">
        <img src={avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-neutral-700" />
        <span className="text-sm text-neutral-200">{user.name || user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border border-neutral-800 bg-neutral-900/90 shadow-lg p-3 z-50">
          <div className="flex items-center gap-3 mb-3">
            <img src={avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-neutral-700" />
            <div>
              <div className="text-white font-semibold text-sm">{user.name || "Unnamed"}</div>
              <div className="text-xs text-neutral-400">{user.email || "no-email"}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Books</span>
              <span className="text-neutral-200">{booksCount == null ? "—" : booksCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Password</span>
              <span className="text-neutral-200">••••••••</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={() => { setOpen(false); navigate("/upload"); }} className="px-3 py-1.5 rounded-md bg-white text-black text-sm font-semibold">Library</button>
            <button onClick={() => { setOpen(false); navigate("/settings"); }} className="px-3 py-1.5 rounded-md border border-neutral-700 bg-neutral-900 text-white text-sm">Settings</button>
            <button onClick={() => { try { localStorage.removeItem("easyread_user"); } catch {}; setOpen(false); navigate("/"); }} className="px-3 py-1.5 rounded-md border border-red-500 text-red-500 hover:bg-red-500 hover:text-white text-sm">Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}
