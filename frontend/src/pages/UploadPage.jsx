import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as pdfjs from "pdfjs-dist/build/pdf";
try { pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.js", import.meta.url).toString(); } catch {}

const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const RAW = import.meta.env.VITE_API_URL;
const API = RAW ? ((RAW.startsWith("http") || RAW.startsWith("/")) ? RAW : `/${RAW}`) : (isLocal ? "http://localhost:5000/api" : "https://easyread-nxdy.onrender.com/api/api");

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [cover, setCover] = useState(null);
  const [coverTempUrl, setCoverTempUrl] = useState("");
  const [panelImageDataUrl, setPanelImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
  const hasUser = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return !!(u && u.userId); } catch { return false; } })();

  useEffect(() => {
    if (!hasUser) {
      navigate("/signin");
      return;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      let list = [];
      try {
        const r = await axios.get(`${API}/books`, { params: { userId } });
        list = Array.isArray(r.data?.items) ? r.data.items : [];
      } catch (e) {
        list = [];
      }
      if (!active) return;
      setBooks(prev => {
        const byId = new Map(prev.map(p => [String(p._id), { ...p }]));
        list.forEach(it => {
          const id = String(it._id);
          if (!byId.has(id)) byId.set(id, it);
          else {
            const cur = byId.get(id);
            byId.set(id, { ...cur, ...it, coverUrl: it.coverUrl || cur.coverUrl || "" });
          }
        });
        const merged = Array.from(byId.values());
        merged.sort((a,b)=>{
          const at = Number(new Date(a.createdAt || 0).getTime());
          const bt = Number(new Date(b.createdAt || 0).getTime());
          return bt - at;
        });
        return merged;
      });
      try {
        const sr = await axios.get(`${API}/settings`, { params: { userId } });
        const s = sr.data?.item || null;
        if (s && active) setPanelImageDataUrl(String(s.panelImageDataUrl || ""));
      } catch {}
    };
    run();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    let active = true;
    const gen = async (book) => {
      try {
        if (book.coverUrl) return null;
        if (!book.fileUrl) return null;
        const rr = await axios.get(`${API}/books/${book._id}/file`, { responseType: "arraybuffer" });
        const buf = rr.data;
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxW = 320, maxH = 240;
        const scaleW = maxW / viewport.width;
        const scaleH = maxH / viewport.height;
        const scale = Math.min(scaleW, scaleH);
        const vp = page.getViewport({ scale });
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        return dataUrl;
      } catch {
        return null;
      }
    };
    (async () => {
      const ids = new Set();
      for (const b of books) {
        if (!b.coverUrl && !b.coverTempUrl && !ids.has(b._id)) {
          ids.add(b._id);
          const du = await gen(b);
          if (!active) return;
          if (du) {
            try {
              await axios.patch(`${API}/books/${b._id}`, { userId, coverDataUrl: du });
              setBooks(prev => prev.map(x => x._id === b._id ? { ...x, coverUrl: `/api/books/${b._id}/cover`, coverTempUrl: "" } : x));
            } catch {
              setBooks(prev => prev.map(x => x._id === b._id ? { ...x, coverTempUrl: du } : x));
            }
          }
        }
      }
    })();
    return () => { active = false; };
  }, [books, API]);

  

  const onSubmit = async e => {
    e.preventDefault();
    if (!hasUser) return;
    if (!file) return;
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("pdf", file);
    if (title) fd.append("title", title);
    if (category) fd.append("category", category);
    fd.append("userId", userId);
    if (cover) {
      try {
        fd.append("cover", cover);
        const toDataUrl = f => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); });
        const dataUrl = await toDataUrl(cover);
        fd.append("coverDataUrl", dataUrl);
      } catch {}
    }
    try {
      const r = await axios.post(`${API}/upload`, fd);
      const id = r.data.bookId;
      if (!id) {
        const msg = String(r.data?.error || "upload_failed");
        setError(msg);
        setLoading(false);
        return;
      }
      let entry = null;
      try {
        const br = await axios.get(`${API}/books/${id}`, { params: { userId } });
        entry = br.data?.item || null;
      } catch {}
      if (entry) {
        setBooks(prev => [entry, ...prev]);
      }
    try {
      const rr = await axios.get(`${API}/books`, { params: { userId } });
      const items = Array.isArray(rr.data?.items) ? rr.data.items : [];
      setBooks(prev => {
        const byId = new Map(items.map(it => [String(it._id), { ...it }]));
        prev.forEach(p => {
          const id = String(p._id);
          if (!byId.has(id)) byId.set(id, p);
          else {
            const cur = byId.get(id);
              byId.set(id, { ...cur, coverUrl: cur.coverUrl || p.coverUrl || "" });
          }
        });
        const merged = Array.from(byId.values());
        merged.sort((a,b)=>{
          const at = Number(new Date(a.createdAt || 0).getTime());
          const bt = Number(new Date(b.createdAt || 0).getTime());
          return bt - at;
        });
        return merged;
      });
    } catch {}
      if (r.data.bookId && category) {
        try { await axios.patch(`${API}/books/${r.data.bookId}`, { userId, category }); } catch {}
      }
      setLoading(false);
      setTitle(""); setCategory("Uncategorized"); setFile(null); setCover(null); setCoverTempUrl("");
    } catch (err) {
      const msg = String(err?.response?.data?.error || err?.message || "upload_failed");
      setError(msg);
      setLoading(false);
    }
  };

  const shown = (filter === "All") ? books : books.filter(b => (b.category || "Uncategorized") === filter);
  const cats = Array.from(new Set(["All", ...books.map(b => b.category || "Uncategorized")]));
  const sortBooks = list => [...list].sort((a,b)=>{
    const ap = a.pinned ? 1 : 0; const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap; // pinned first
    const at = a.createdAt || 0; const bt = b.createdAt || 0;
    return bt - at;
  });
  const shownSorted = sortBooks(shown);
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
          <div style={{ marginTop: 16, color: accent, fontWeight: 600 }}>Uploading…</div>
          <style>{`
            @keyframes bookLeft { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(-40deg) translateZ(0); } }
            @keyframes bookRight { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(40deg) translateZ(0); } }
          `}</style>
        </div>
      </div>
    );
  };

  const updateLocalBooks = (next) => {
    setBooks(next);
  };

  const togglePin = async (book) => {
    const pinned = !book.pinned;
    const next = books.map(b => b._id === book._id ? { ...b, pinned } : b);
    updateLocalBooks(next);
    if (!String(book._id).startsWith("local_")) {
      try { await axios.patch(`${API}/books/${book._id}`, { userId, pinned }); } catch {}
    }
  };

  const deleteBook = async (book) => {
    const next = books.filter(b => b._id !== book._id);
    updateLocalBooks(next);
    
    if (!String(book._id).startsWith("local_")) {
      try { await axios.delete(`${API}/books/${book._id}`, { params: { userId } }); } catch {}
      try {
        const rr = await axios.get(`${API}/books`, { params: { userId } });
        setBooks(Array.isArray(rr.data?.items) ? rr.data.items : []);
      } catch {}
    }
  };
  const openBook = async (book) => {
    try {
      const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
      let payload = { html: "", text: "" };
      try {
        const r = await axios.get(`${API}/books/${book._id}/content`, { params: { userId } });
        payload.html = String(r.data?.html || "");
        payload.text = String(r.data?.text || "");
      } catch {}
      navigate(`/reader/${book._id}`, { state: payload });
    } catch {
      navigate(`/reader/${book._id}`);
    }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {loading && <BookLoader />}
      <div className="mb-6 relative rounded-xl overflow-hidden border border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.35)]" style={{ minHeight: panelImageDataUrl ? 160 : 220 }}>
        {panelImageDataUrl && (
          <img src={panelImageDataUrl} alt="Dashboard" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "center", filter: "saturate(1.1) contrast(1.05)", transform: "translateZ(0)" }} />
        )}
        <div className={panelImageDataUrl ? "absolute inset-0" : "hidden"} style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.65))" }} />
        <div className={panelImageDataUrl ? "relative z-10 p-4 bg-neutral-900/80" : "relative z-10 p-6 bg-neutral-900/80"}>
          <h2 className="text-lg font-semibold mb-4 text-white">Dashboard</h2>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Title</label>
            <input className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" value={title} onChange={e => setTitle(e.target.value)} placeholder="My book" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-neutral-400">Category</label>
            <input className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/20 transition" value={category} onChange={e => setCategory(e.target.value)} placeholder="Uncategorized" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-800/60 hover:border-white/50 hover:bg-neutral-800 transition p-2">
              <label htmlFor="pdfInput" className="block cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-neutral-300">PDF</span>
                    <span className="text-[13px] text-neutral-200">{file ? file.name : "Choose"}</span>
                  </div>
                  <div className="text-neutral-400 text-[13px]">Browse</div>
                </div>
              </label>
              <input id="pdfInput" className="hidden" type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-800/60 hover:border-white/50 hover:bg-neutral-800 transition p-2">
              <label htmlFor="coverInput" className="block cursor-pointer">
                <div className="flex items-center gap-2">
                  {coverTempUrl ? <img src={coverTempUrl} alt="Cover" className="w-12 h-9 object-cover rounded border border-neutral-700" /> : null}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-neutral-300">Cover</span>
                    <span className="text-[13px] text-neutral-200">{cover ? cover.name : "Choose"}</span>
                  </div>
                </div>
              </label>
              <input id="coverInput" className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0] || null; setCover(f); try { setCoverTempUrl(f ? URL.createObjectURL(f) : ""); } catch {} }} />
            </div>
            
            {error && <div className="text-red-500 text-[12px]">{error}</div>}
            <button className="w-full px-3 py-2 bg-white text-black rounded-md text-[13px] font-semibold btn-animated" disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
          </div>
          </form>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-400">Library</div>
        <div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-neutral-700 bg-neutral-900 text-neutral-200 rounded px-2 py-1 text-sm">
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="text-neutral-500 text-sm">No books yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shownSorted.map(b => {
            const titleText = b.title || "Untitled";
            const palettes = [
              { bg: "linear-gradient(135deg,#1f2937,#111827)", fg: "#e5e7eb" },
              { bg: "linear-gradient(135deg,#0ea5e9,#1e40af)", fg: "#f0f9ff" },
              { bg: "linear-gradient(135deg,#22c55e,#166534)", fg: "#ecfdf5" },
              { bg: "linear-gradient(135deg,#f97316,#7c2d12)", fg: "#fff7ed" },
              { bg: "linear-gradient(135deg,#a855f7,#4c1d95)", fg: "#f5f3ff" },
            ];
            const createdMs = (() => { try { return Number(new Date(b.createdAt || Date.now()).getTime()); } catch { return Date.now(); } })();
            const pal = palettes[Math.abs(createdMs) % palettes.length];
            return (
              <div key={b._id} className="relative border border-neutral-800 rounded bg-neutral-900/80 hover:bg-neutral-900 transition shadow hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:translate-y-[-2px] card" onClick={() => openBook(b)} style={{ cursor: "pointer" }}>
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button aria-label="Pin" className={b.pinned ? "rounded-full bg-yellow-400 text-black p-2 btn-animated" : "rounded-full bg-white text-black p-2 btn-animated"} onClick={(e)=>{ e.stopPropagation(); togglePin(b); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3l7 7-2 2-3-3-3 3 3 3-2 2-7-7 2-2 3 3 3-3-3-3 2-2z"/></svg>
                  </button>
                  <button aria-label="Delete" className="rounded-full border border-red-500 text-red-500 p-2 hover:bg-red-500 hover:text-white btn-animated" onClick={(e)=>{ e.stopPropagation(); deleteBook(b); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9z"/></svg>
                  </button>
                </div>
                <div style={{ height: 140, borderTopLeftRadius: 6, borderTopRightRadius: 6, background: (b.coverUrl || b.coverTempUrl) ? undefined : pal.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(b.coverUrl || b.coverTempUrl) ? (
                    (() => {
                      const raw = b.coverUrl || b.coverTempUrl;
                      const apiBase = String(API || "/api");
                      const base = apiBase.endsWith("/api") ? apiBase.slice(0, -4) : apiBase;
                      const src = (raw && raw.startsWith("/api/")) ? (base + raw) : raw;
                      return <img src={src} alt={titleText} style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 6, borderTopRightRadius: 6 }} onError={(e) => { try { setBooks(prev => prev.map(x => x._id === b._id ? { ...x, coverUrl: "", coverTempUrl: "" } : x)); } catch {} }} />;
                    })()
                  ) : (
                    <div style={{ color: pal.fg, fontWeight: 700, fontSize: 18, padding: "0 12px", textAlign: "center" }}>{titleText}</div>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-white font-semibold mb-1">{titleText}</div>
                  <div className="text-xs text-neutral-400 mb-2">{b.category || "Uncategorized"}</div>
                  {(() => {
                    const tp = Number(b.totalPages || 0);
                    const lp = Number(b.lastPage || 0) + 1;
                    const pct = tp > 0 ? Math.min(100, Math.round((lp / tp) * 100)) : 0;
                    return (
                      <>
                        <div className="w-full h-2 bg-neutral-800 rounded-md overflow-hidden mb-2">
                          <div style={{ width: `${pct}%`, height: 8, background: "#ffffff", transition: "width 300ms ease" }} />
                        </div>
                        <div className="text-[11px] text-neutral-500">{b.pinned ? "Pinned • " : ""}{tp > 0 ? `${lp} / ${tp} • ${pct}%` : `Last page: ${lp}`}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
