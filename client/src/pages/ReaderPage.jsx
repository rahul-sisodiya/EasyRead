import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const RAW = import.meta.env.VITE_API_URL;
const API = RAW ? ((RAW.startsWith("http") || RAW.startsWith("/")) ? RAW : `/${RAW}`) : (isLocal ? "http://localhost:5000/api" : "/api");
import Reader from "../components/Reader.jsx";
import * as pdfjs from "pdfjs-dist/build/pdf";
try { pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.js", import.meta.url).toString(); } catch {}

export default function ReaderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState(() => {
    try { return String(location.state?.html || ""); } catch { return ""; }
  });
  const [text, setText] = useState(() => {
    try { return String(location.state?.text || ""); } catch { return ""; }
  });
  const [initialPage, setInitialPage] = useState(0);
  const [initialScroll, setInitialScroll] = useState(0);
  const [initialMode, setInitialMode] = useState("page");
  const [hasBooks, setHasBooks] = useState(true);
  useEffect(() => {
    setLoading(true);
  }, []);
  useEffect(() => {
    const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
    if (!id) {
      (async () => {
        try {
          const r = await axios.get(`${API}/books`, { params: { userId } });
          const items = Array.isArray(r.data?.items) ? r.data.items : [];
          setHasBooks(items.length > 0);
        } catch { setHasBooks(false); }
      })();
    }
    if (id && !String(id).startsWith("local_") && !html) {
      (async () => {
        try {
          setLoading(true);
          const r = await axios.get(`${API}/books/${id}/content`, { params: { userId } });
          const hh = r.data?.html || "";
          const tt = r.data?.text || "";
          setText(tt);
          const fallback = `<p>No extractable text in this PDF.</p>`;
          const isEmptyHtml = !String(hh || "").replace(/<[^>]+>/g, "").trim();
          if ((!isEmptyHtml && hh) || (toHtml(tt))) {
            setHtml((!isEmptyHtml && hh) ? hh : toHtml(tt));
          } else {
            try {
              const fr = await axios.get(`${API}/books/${id}/file`, { responseType: "arraybuffer" });
              const buf = fr.data;
              const doc = await pdfjs.getDocument({ data: buf }).promise;
              let out = "";
              const total = doc.numPages || 0;
              for (let p = 1; p <= total; p++) {
                const page = await doc.getPage(p);
                const tc = await page.getTextContent();
                const strs = (tc.items || []).map(it => it.str).filter(Boolean);
                out += (strs.join(" ") + "\n\n");
              }
              const htmlFromBrowser = toHtml(out);
              setText(out);
              setHtml(htmlFromBrowser || fallback);
            } catch {
              setHtml(fallback);
            }
          }
        } catch {
          setHtml(`<p>Unable to load content. Please try again.</p>`);
        }
      })();
    }
    if (id && !String(id).startsWith("local_")) {
      (async () => {
        try {
          const br = await axios.get(`${API}/books/${id}`, { params: { userId } });
          const lp = Number(br.data?.item?.lastPage ?? 0);
          if (Number.isFinite(lp)) {
            setInitialPage(lp);
          }
          const ls = Number(br.data?.item?.lastScroll ?? 0);
          if (Number.isFinite(ls)) {
            setInitialScroll(Math.max(0, Math.min(100, ls)));
          }
          const lm = String(br.data?.item?.lastMode || "").toLowerCase();
          if (lm === "page" || lm === "scroll") setInitialMode(lm);
        } catch {}
      })();
    }
  }, [id]);
  const onPageChange = (p) => {
    if (id && !String(id).startsWith("local_")) {
      try { axios.patch(`${API}/books/${id}`, { userId: (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })(), lastPage: p }); } catch {}
    }
  };
  
  if (!id && !hasBooks) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="rounded border border-neutral-800 bg-neutral-900/80 p-6">
          <div className="text-white font-semibold mb-2">No books yet</div>
          <div className="text-sm text-neutral-400">Go to Upload to add a PDF to your library.</div>
        </div>
      </div>
    );
  }
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
          <div style={{ marginTop: 16, color: accent, fontWeight: 600 }}>Opening book…</div>
          <style>{`
            @keyframes bookLeft { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(-40deg) translateZ(0); } }
            @keyframes bookRight { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(40deg) translateZ(0); } }
          `}</style>
        </div>
      </div>
    );
  };
  return (
    <div className="max-w-none">
      {loading && <BookLoader />}
      <Reader html={html} initialPage={initialPage} bookId={id || null} onPageChange={onPageChange} onBack={() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); if (u) navigate("/upload"); else navigate("/"); } catch { navigate("/"); } }} initialScroll={initialScroll} initialMode={initialMode} onFirstLayoutDone={() => setTimeout(() => setLoading(false), 150)} />
    </div>
  );
}
  function toHtml(t) {
    const s = String(t || "").trim();
    if (!s) return "";
    const lines = s.replace(/\r/g, "\n").split(/\n+/).map(l => l.trim()).filter(Boolean);
    return `<p>` + lines.join(`</p><p>`) + `</p>`;
  }
