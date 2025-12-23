import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const API = import.meta.env.VITE_API_URL || (isLocal ? "https://easyread-nxdy.onrender.com/api" : "/api");

export default function VocabPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
  useEffect(() => {
    if (!userId || userId === "guest") { navigate("/signin"); return; }
    let active = true;
    const run = async () => {
      setLoading(true);
      let list = [];
      try {
        const r = await axios.get(`${API}/vocab`, { params: { userId } });
        list = Array.isArray(r.data?.items) ? r.data.items : [];
      } catch (e) {
        list = [];
      }
      if (!active) return;
      setItems(list);
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [userId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Vocabulary</h2>
        {loading ? (
          <div className="text-sm text-neutral-400">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-neutral-400">No saved words yet.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((it, idx) => (
              <li key={it._id || idx} className="border border-neutral-800 rounded p-3">
                <div className="font-semibold text-white">{it.word}</div>
                {Array.isArray(it.meaning) ? (
                  <div className="text-xs text-neutral-400 mt-1">{it.meaning[0]?.phonetics?.[0]?.text || ""}</div>
                ) : null}
                {it.translation?.text && (
                  <div className="text-sm text-neutral-200 mt-2">{(() => { const el = document.createElement("div"); el.innerHTML = String(it.translation.text || ""); const t = el.textContent || el.innerText || ""; const banned = /(LibreTranslate|API|GitHub|window\.Prism|license|vpn_key|language|content_copy|cloud_download|Argos Translate|Mit ❤ gemacht)/i; const cleaned = banned.test(t) ? "" : t; const maxLen = 120; return cleaned ? (cleaned.length > maxLen ? cleaned.slice(0, maxLen).trim() : cleaned) : ""; })()}</div>
                )}
                <div className="text-xs text-neutral-500 mt-2">{new Date(it.ts || Date.now()).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
