import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export default function LandingPage() {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [pulse, setPulse] = useState(false);
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";

  const API = import.meta.env.VITE_API_URL || (isLocal ? "http://localhost:5000/api" : "https://easyread-nxdy.onrender.com/api");

  const userObj = (() => { try { return JSON.parse(localStorage.getItem("easyread_user") || "null"); } catch { return null; } })();
  const userId = (userObj && userObj.userId) ? userObj.userId : "guest";
  const hasUser = !!(userObj && userObj.userId);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [cover, setCover] = useState(null);
  const [coverTempUrl, setCoverTempUrl] = useState("");
  const [panelImageDataUrl, setPanelImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!hasUser) return;
    let active = true;
    (async () => {
      try {
        const r = await axios.get(`${API}/settings`, { params: { userId } });
        const s = r.data?.item || null;
        if (!active || !s) return;
        setPanelImageDataUrl(String(s.panelImageDataUrl || ""));
      } catch {}
    })();
    return () => { active = false; };
  }, [hasUser, userId]);
  const onSubmit = async e => {
    e.preventDefault();
    if (!hasUser) { navigate("/signin"); return; }
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
      setLoading(false);
      setTitle(""); setCategory("Uncategorized"); setFile(null); setCover(null); setCoverTempUrl("");
      navigate("/upload");
    } catch (err) {
      const msg = String(err?.response?.data?.error || err?.message || "upload_failed");
      setError(msg);
      setLoading(false);
    }
  };
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 2200);
    return () => clearInterval(id);
  }, []);
  const heroImg = "/images/download (2).jpeg";
  const aboutImg = "/images/graduation-cap.jpeg";
  const libraryImg = "/images/books.jpeg";
  const bg = {
    background: "radial-gradient(1200px 600px at 20% 20%, rgba(168,85,247,0.08), transparent), radial-gradient(1000px 500px at 80% 40%, rgba(14,165,233,0.06), transparent), radial-gradient(600px 300px at 50% 90%, rgba(244,63,94,0.08), transparent)",
  };
  const glow = pulse ? "shadow-[0_0_40px_10px_rgba(255,255,255,0.05)]" : "shadow-[0_0_30px_6px_rgba(255,255,255,0.04)]";
  return (
    <div className="min-h-[calc(100vh-56px)] bg-black text-neutral-200 relative overflow-hidden" style={bg}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(0deg,transparent 24%,rgba(255,255,255,0.08) 25%,rgba(255,255,255,0.08) 26%,transparent 27%), linear-gradient(90deg,transparent 24%,rgba(255,255,255,0.08) 25%,rgba(255,255,255,0.08) 26%,transparent 27%)", backgroundSize: "50px 50px" }} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          {hasUser && (
            <div className="text-sm text-neutral-300 mb-2">Welcome, <span className="text-white font-semibold">{userObj?.name || userObj?.email || "Reader"}</span></div>
          )}
          <div className={`inline-block rounded-xl border border-neutral-800 bg-neutral-900/70 px-5 py-2 mb-4 ${glow}`}>Retro Reading, Modern Speed</div>
          <div className="mb-2"><Logo size={40} label="EasyRead" /></div>
          <p className="mt-3 text-neutral-300 text-lg">A fast, minimal reader with a retro vibe and powerful features.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => {
              try {
                const u = JSON.parse(localStorage.getItem('easyread_user') || 'null');
                if (u) navigate('/upload'); else navigate('/signin');
              } catch { navigate('/signin'); }
            }} className="px-5 py-2 rounded-md bg-white text-black font-semibold hover:translate-y-[-2px] transition">Get Started</button>
            <Link to="/signin" className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-900/70 text-white hover:bg-neutral-800 transition">Sign In</Link>
            <Link to="/register" className="px-4 py-2 rounded-md border border-neutral-700 bg-neutral-900/70 text-white hover:bg-neutral-800 transition">Register</Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-white font-semibold">Retro UI</div>
              <div className="text-sm text-neutral-400">Neon accents, grain overlays, soft glow.</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-white font-semibold">Fast Reader</div>
              <div className="text-sm text-neutral-400">Paging, scroll mode, vocab lookup.</div>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="text-white font-semibold">Your Library</div>
              <div className="text-sm text-neutral-400">Upload PDFs, covers, pin favorites.</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-8 -left-6 w-40 h-40 rounded-full blur-2xl" style={{ background: "conic-gradient(from 0deg, #6b21a8, #1e3a8a, #7f1d1d, #6b21a8)" }} />
          <div className="relative">
            {panelImageDataUrl && (
              <>
                <img src={panelImageDataUrl} alt="Template" className="absolute inset-0 w-full h-full rounded-xl border border-neutral-700" style={{ objectFit: "cover", objectPosition: "center", filter: "saturate(1.05) contrast(1.05)" }} />
                <div className="absolute inset-0 rounded-xl" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.65))" }} />
              </>
            )}
            <img onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} src={heroImg} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200&auto=format&fit=crop"; }} alt="open book" className={hover ? "rounded-xl border border-neutral-800 shadow-lg transform transition hover:rotate-[-2deg]" : "rounded-xl border border-neutral-800 shadow-lg"} />
          </div>
        </div>
      </div>
      <section id="about" className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6">
            <div className="text-2xl font-bold text-white mb-2">About</div>
            <p className="text-neutral-300">EasyRead focuses on distraction-free reading with retro aesthetics and fast performance. Upload PDFs, customize your reading theme, and save vocabulary.</p>
          </div>
          <div>
            <img src={aboutImg} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1519681393784-3cef4a3f729b?q=80&w=1200&auto=format&fit=crop"; }} alt="graduation cap" className="rounded-xl border border-neutral-800 shadow-lg w-2/3 md:w-1/2 mx-auto" style={{ mixBlendMode: "multiply" }} />
          </div>
        </div>
      </section>
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="text-3xl font-extrabold text-white mb-6">Features</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6">
            <div className="text-white font-semibold mb-2">Upload & Organize</div>
            <p className="text-neutral-400 text-sm">Add PDFs and covers, categorize, pin favorites.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6">
            <div className="text-white font-semibold mb-2">Reader Modes</div>
            <p className="text-neutral-400 text-sm">Switch between pages and scroll. Adjust font and background.</p>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-6">
            <div className="text-white font-semibold mb-2">Vocabulary</div>
            <p className="text-neutral-400 text-sm">Save words while reading and review them later.</p>
          </div>
        </div>
        <div className="mt-8">
          <img src={libraryImg} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200&auto=format&fit=crop"; }} alt="stacked books" className="rounded-xl border border-neutral-800 shadow-lg w-3/4 md:w-2/3 mx-auto" style={{ mixBlendMode: "multiply" }} />
        </div>
      </section>
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-6 relative rounded-xl overflow-hidden border border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.35)]" style={{ minHeight: panelImageDataUrl ? 160 : 220 }}>
          {panelImageDataUrl && (
            <img src={panelImageDataUrl} alt="Template" className="absolute inset-0 w-full h-full" style={{ objectFit: "cover", objectPosition: "center", filter: "saturate(1.05) contrast(1.05)" }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200&auto=format&fit=crop"; }} />
          )}
          <div className={panelImageDataUrl ? "absolute inset-0" : "hidden"} style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.65))" }} />
          <div className={panelImageDataUrl ? "relative z-10 p-4 bg-neutral-900/80 rounded-xl" : "relative z-10 p-6 bg-neutral-900/80 rounded-xl"}>
          <div className="text-xl font-bold text-white mb-3">Quick Upload</div>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <div className="mb-1 text-neutral-400 text-sm">Title</div>
              <input className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="My book" />
            </div>
            <div>
              <div className="mb-1 text-neutral-400 text-sm">Category</div>
              <input className="w-full border border-neutral-700 bg-neutral-800 text-neutral-200 rounded-md px-3 py-2" value={category} onChange={e => setCategory(e.target.value)} placeholder="Uncategorized" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-800/60 p-2">
                <label htmlFor="homePdfInput" className="block cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-neutral-300">PDF</span>
                      <span className="text-[13px] text-neutral-200">{file ? file.name : "Choose"}</span>
                    </div>
                    <div className="text-neutral-400 text-[13px]">Browse</div>
                  </div>
                </label>
                <input id="homePdfInput" className="hidden" type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-800/60 p-2">
                <label htmlFor="homeCoverInput" className="block cursor-pointer">
                  <div className="flex items-center gap-2">
                    {coverTempUrl ? <img src={coverTempUrl} alt="Cover" className="w-12 h-9 object-cover rounded border border-neutral-700" /> : null}
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-neutral-300">Cover</span>
                      <span className="text-[13px] text-neutral-200">{cover ? cover.name : "Choose"}</span>
                    </div>
                  </div>
                </label>
                <input id="homeCoverInput" className="hidden" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0] || null; setCover(f); try { setCoverTempUrl(f ? URL.createObjectURL(f) : ""); } catch {} }} />
              </div>
              {error && <div className="text-red-500 text-[12px]">{error}</div>}
              <button className="w-full px-3 py-2 bg-white text-black rounded-md text-[13px] font-semibold" disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
            </div>
          </form>
          </div>
        </div>
      </section>
      <footer className="px-6 py-10 border-t border-neutral-800 bg-black relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-neutral-500 text-sm">© {new Date().getFullYear()} EasyRead</div>
          <a href="https://www.linkedin.com/in/rahul-singh-aa0b292b5/" target="_blank" rel="noreferrer" className="text-white hover:text-neutral-300 text-sm">made by Rahul Singh</a>
        </div>
      </footer>
    </div>
  );
}
