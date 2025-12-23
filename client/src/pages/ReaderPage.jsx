import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const API = import.meta.env.VITE_API_URL || (isLocal ? "http://localhost:5000/api" : "/api");
import Reader from "../components/Reader.jsx";
import * as pdfjs from "pdfjs-dist/build/pdf";
try { pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.js", import.meta.url).toString(); } catch {}

export default function ReaderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [html, setHtml] = useState(() => {
    try { return String(location.state?.html || ""); } catch { return ""; }
  });
  const [text, setText] = useState(() => {
    try { return String(location.state?.text || ""); } catch { return ""; }
  });
  const [initialPage, setInitialPage] = useState(0);
  const [hasBooks, setHasBooks] = useState(true);
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
          setHtml("<p>Loading…</p>");
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
  return (
    <div className="max-w-none">
      <Reader html={html} initialPage={initialPage} bookId={id || null} onPageChange={onPageChange} onBack={() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); if (u) navigate("/upload"); else navigate("/"); } catch { navigate("/"); } }} />
    </div>
  );
} 
  function toHtml(t) {
    const s = String(t || "").trim();
    if (!s) return "";
    const lines = s.replace(/\r/g, "\n").split(/\n+/).map(l => l.trim()).filter(Boolean);
    return `<p>` + lines.join(`</p><p>`) + `</p>`;
  }
