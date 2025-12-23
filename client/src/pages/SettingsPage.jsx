import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function SettingsPage() {
  const navigate = useNavigate();
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  const API = import.meta.env.VITE_API_URL || (isLocal ? "https://easyread-nxdy.onrender.com/api" : "/api");
  const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
  const [font, setFont] = useState(18);
  const [theme, setTheme] = useState("dark");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [fontFamily, setFontFamily] = useState("serif");
  const [palette, setPalette] = useState("black");
  const [panelImageDataUrl, setPanelImageDataUrl] = useState("");

  useEffect(() => {
    if (!userId || userId === "guest") { navigate("/signin"); return; }
    (async () => {
      try {
        const r = await axios.get(`${API}/settings`, { params: { userId } });
        const s = r.data?.item || null;
        if (!s) return;
        setFont(Number(s.font ?? font));
        setTheme(String(s.theme ?? theme));
        setLineHeight(Number(s.lineHeight ?? lineHeight));
        setFontFamily(String(s.fontFamily ?? fontFamily));
        setPalette(String(s.palette ?? palette));
        setPanelImageDataUrl(String(s.panelImageDataUrl || ""));
      } catch {}
    })();
  }, []);

  const persist = async (patch) => {
    try {
      await axios.patch(`${API}/settings`, { userId, ...patch });
    } catch {}
  };
  useEffect(() => { persist({ font }); }, [font]);
  useEffect(() => { persist({ theme }); }, [theme]);
  useEffect(() => { persist({ lineHeight }); }, [lineHeight]);
  useEffect(() => { persist({ fontFamily }); }, [fontFamily]);
  useEffect(() => { persist({ palette }); }, [palette]);
  const onPanelImageChange = async (f) => {
    if (!f) return;
    const toDataUrl = file => new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
    try {
      const dataUrl = await toDataUrl(f);
      setPanelImageDataUrl(dataUrl);
      persist({ panelImageDataUrl: dataUrl });
    } catch {}
  };
  const clearPanelImage = () => {
    setPanelImageDataUrl("");
    persist({ panelImageDataUrl: "" });
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="space-y-4 bg-neutral-900 border border-neutral-800 rounded p-6">
        <div>
          <div className="mb-1 text-neutral-400">Font size</div>
          <input type="range" min="14" max="28" value={font} onChange={e => setFont(Number(e.target.value))} />
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Font family</div>
          <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="border border-neutral-700 bg-neutral-800 text-neutral-200 rounded px-2 py-1">
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
            <option value="mono">Mono</option>
            <option value="georgia">Georgia</option>
            <option value="times">Times</option>
            <option value="verdana">Verdana</option>
          </select>
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Theme</div>
          <select value={theme} onChange={e => setTheme(e.target.value)} className="border border-neutral-700 bg-neutral-800 text-neutral-200 rounded px-2 py-1">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Background</div>
          <select value={palette} onChange={e => setPalette(e.target.value)} className="border border-neutral-700 bg-neutral-800 text-neutral-200 rounded px-2 py-1">
            <option value="black">Black</option>
            <option value="dark">Dark Gray</option>
            <option value="sepia">Sepia</option>
            <option value="paper">Paper</option>
          </select>
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Homepage panel image</div>
          <div className="rounded-md border border-dashed border-neutral-700 bg-neutral-800/60 hover:border-white/50 hover:bg-neutral-800 transition p-2">
            <label htmlFor="panelInput" className="block cursor-pointer">
              <div className="flex items-center gap-2">
                {panelImageDataUrl ? <img src={panelImageDataUrl} alt="Panel" className="w-12 h-9 object-cover rounded border border-neutral-700" /> : null}
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-neutral-300">Panel</span>
                  <span className="text-[13px] text-neutral-200">{panelImageDataUrl ? "Selected" : "Choose"}</span>
                </div>
              </div>
            </label>
            <input id="panelInput" className="hidden" type="file" accept="image/*" onChange={e => onPanelImageChange(e.target.files?.[0] || null)} />
            {panelImageDataUrl && <button type="button" className="mt-2 p-1 text-[12px] rounded border border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={clearPanelImage} aria-label="Remove panel image">✕</button>}
          </div>
        </div>
        <div>
          <div className="mb-1 text-neutral-400">Line height</div>
          <input type="range" min="1.2" max="2.0" step="0.1" value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))} />
        </div>
        
      </div>
    </div>
  );
}
