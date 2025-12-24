import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import WordPopup from "./WordPopup.jsx";

export default function Reader({ html, initialPage = null, bookId = null, onPageChange, onBack, initialScroll = 0, initialMode = "page", onFirstLayoutDone }) {
  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(initialPage != null ? Number(initialPage) : 0);
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  const RAW = import.meta.env.VITE_API_URL;
  const API = RAW ? ((RAW.startsWith("http") || RAW.startsWith("/")) ? RAW : `/${RAW}`) : (isLocal ? "http://localhost:5000/api" : "/api");
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState("dark");
  const [lineHeight, setLineHeight] = useState(1.6);
  const [mode, setMode] = useState(initialMode || "page");
  const [fontFamily, setFontFamily] = useState("serif");
  const [palette, setPalette] = useState("black");
  const [eyeComfort, setEyeComfort] = useState(false);
  const [warmth, setWarmth] = useState(0.35);
  const [brightness, setBrightness] = useState(0.9);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uniformPages, setUniformPages] = useState(false);
  const measureRef = useRef(null);
  const toolbarRef = useRef(null);
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dims, setDims] = useState({ width: 700, height: 700 });
  const [toolbarH, setToolbarH] = useState(56);
  const vPad = Math.max(12, Math.round(fontSize * 0.5));
  const [selection, setSelection] = useState(null);
  const [anim, setAnim] = useState({ active: false, dir: "next", next: 0, stage: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollSaveTimerRef = useRef(0);
  const lastScrollValRef = useRef(0);
  const splitCacheRef = useRef(new Map());
  const [reflowing, setReflowing] = useState(false);
  const [precomputing, setPrecomputing] = useState(false);
  const getCacheKey = () => {
    const bw = Math.round(dims.width / 16) * 16;
    const bh = Math.round(dims.height / 16) * 16;
    return `${String(bookId || "local")}|${fontSize}|${lineHeight}|${fontFamily}|${bw}|${bh}|${isFullscreen ? 1 : 0}|${uniformPages ? 1 : 0}`;
  };
  const persistSettings = (patch) => {
    try {
      const u = JSON.parse(localStorage.getItem("easyread_user") || "null");
      const userId = (u && u.userId) ? u.userId : null;
      if (!userId) return;
      axios.patch(`${API}/settings`, { userId, ...patch }).catch(()=>{});
    } catch {}
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("easyread_user") || "null");
      const userId = (u && u.userId) ? u.userId : null;
      if (!userId) return;
      (async () => {
        try {
          const r = await axios.get(`${API}/settings`, { params: { userId } });
          const s = r.data?.item || null;
          if (!s) return;
          setFontSize(Number(s.font ?? fontSize));
          setTheme(String(s.theme ?? theme));
          setLineHeight(Number(s.lineHeight ?? lineHeight));
          setFontFamily(String(s.fontFamily ?? fontFamily));
          setPalette(String(s.palette ?? palette));
        } catch {}
      })();
    } catch {}
  }, []);
  const lastPageRef = useRef(0);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isAndroid = /Android/i.test(ua);
  const simpleAnim = false;
  const ANIM_MS = 320;
  const [highlights, setHighlights] = useState([]);

  

  useEffect(() => {
    const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
    (async () => {
      try {
        const r = await axios.get(`${API}/settings`, { params: { userId } });
        const s = r.data?.item || null;
        if (!s) return;
        setFontSize(Number(s.font ?? fontSize));
        setTheme(String(s.theme ?? theme));
        setLineHeight(Number(s.lineHeight ?? lineHeight));
        setFontFamily(String(s.fontFamily ?? fontFamily));
        setPalette(String(s.palette ?? palette));
      } catch {}
    })();
  }, []);
  const persistMode = (m) => {
    try {
      const idStr = String(bookId || "");
      if (idStr && !idStr.startsWith("local_")) {
        const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
        axios.patch(`${API}/books/${idStr}`, { userId, lastMode: m }).catch(()=>{});
      }
    } catch {}
  };
  const saveScroll = (val) => {
    lastScrollValRef.current = val;
    if (scrollSaveTimerRef.current) window.clearTimeout(scrollSaveTimerRef.current);
    scrollSaveTimerRef.current = window.setTimeout(() => {
      try {
        const idStr = String(bookId || "");
        if (idStr && !idStr.startsWith("local_")) {
          const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
          const pct = Math.max(0, Math.min(100, Math.round(lastScrollValRef.current * 100)));
          axios.patch(`${API}/books/${idStr}`, { userId, lastScroll: pct }).catch(()=>{});
        }
      } catch {}
    }, 800);
  };

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const calcDims = () => {
      const w = (window.visualViewport?.width || window.innerWidth);
      const vh = (window.visualViewport?.height || window.innerHeight);
      const th = (toolbarRef.current?.getBoundingClientRect?.().height || toolbarRef.current?.clientHeight || 56);
      setToolbarH(Math.max(40, Math.floor(th)));
      const h = Math.max(400, vh - Math.max(40, Math.floor(th)));
      setDims({ width: Math.max(320, w), height: h });
    };
    const schedule = () => {
      const now = Date.now();
      if (now - last < 120) return;
      last = now;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calcDims);
    };
    schedule();
    const onResize = () => schedule();
    const onFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
      schedule();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFs);
      cancelAnimationFrame(raf);
    };
  }, [isFullscreen]);

  useEffect(() => {
    const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && (u.userId || u.email || u.name)) ? (u.userId || u.email || u.name) : "guest"; } catch { return "guest"; } })();
    const reload = async () => {
      if (!bookId) return;
      try {
        const r = await axios.get(`${API}/highlights`, { params: { userId, bookId } });
        setHighlights(Array.isArray(r.data?.items) ? r.data.items : []);
      } catch {}
    };
    reload();
    const handler = () => reload();
    window.addEventListener("easyread_highlights_changed", handler);
    return () => window.removeEventListener("easyread_highlights_changed", handler);
  }, [bookId]);

  useEffect(() => {
    const el = containerRef.current;
    let last = 0;
    const onWheel = e => {
      if (!el) return;
      e.preventDefault();
      const now = Date.now();
      if (now - last < 100) return;
      if (e.deltaY > 0) {
        goToPage(Math.min((pages.length || 1) - 1, page + 1));
      } else if (e.deltaY < 0) {
        goToPage(Math.max(0, page - 1));
      }
      last = now;
    };
    const onKey = e => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        goToPage(Math.min((pages.length || 1) - 1, page + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        goToPage(Math.max(0, page - 1));
      }
    };
    if (mode === "page") {
      el?.addEventListener("wheel", onWheel, { passive: false });
      document.addEventListener("keydown", onKey);
    }
    return () => {
      el?.removeEventListener("wheel", onWheel);
      document.removeEventListener("keydown", onKey);
    };
  }, [pages.length, mode, page]);

  useEffect(() => {
    const el = containerRef.current;
    let sx = 0, sy = 0, dx = 0, dy = 0, active = false;
    const onStart = e => {
      if (mode !== "page") return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      sx = t.clientX; sy = t.clientY; dx = 0; dy = 0; active = true;
    };
    const onMove = e => {
      if (!active || mode !== "page") return;
      const t = e.touches && e.touches[0];
      if (!t) return;
      dx = t.clientX - sx; dy = t.clientY - sy;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) e.preventDefault();
    };
    const onEnd = () => {
      if (!active || mode !== "page") return;
      const threshold = Math.max(40, Math.floor(dims.width * 0.08));
      if (Math.abs(dx) > threshold && Math.abs(dy) < threshold * 0.8) {
        if (dx < 0) {
          goToPage(Math.min((pages.length || 1) - 1, page + 1));
        } else {
          goToPage(Math.max(0, page - 1));
        }
      }
      active = false;
    };
    if (mode === "page") {
      el?.addEventListener("touchstart", onStart, { passive: true });
      el?.addEventListener("touchmove", onMove, { passive: false });
      el?.addEventListener("touchend", onEnd, { passive: true });
    }
    return () => {
      el?.removeEventListener("touchstart", onStart);
      el?.removeEventListener("touchmove", onMove);
      el?.removeEventListener("touchend", onEnd);
    };
  }, [mode, pages.length, page, dims.width]);

  useEffect(() => {
    if (!html) return;
    const anchorPlain = (() => {
      try {
        const curHtml = pages[page] || "";
        const plain = String(curHtml || "").replace(/<[^>]+>/g, "").trim();
        return plain.slice(0, 64);
      } catch { return ""; }
    })();
    const plain = String(html || "").replace(/<[^>]+>/g, "").trim();
    if (!plain) {
      setPages(["<p>No extractable text in this PDF.</p>"]);
      return;
    }
    if (mode !== "page") {
      setPages([html]);
      return;
    }
    const htmlHash = plain.length;
    const key = getCacheKey();
    const cached = splitCacheRef.current.get(key);
    if (cached && cached.htmlHash === htmlHash) {
      const pagesOut = cached.pages;
      setPages(pagesOut);
      let target = page;
      if (anchorPlain) {
        try {
          const pagesPlain = pagesOut.map(p => String(p || "").replace(/<[^>]+>/g, ""));
          let found = -1;
          for (let i = 0; i < pagesPlain.length; i++) {
            if (pagesPlain[i].includes(anchorPlain)) { found = i; break; }
          }
          if (found >= 0) target = found;
          else {
            const progress = pages.length ? (page / Math.max(1, pages.length - 1)) : 0;
            target = Math.max(0, Math.min(Math.max(0, pagesOut.length - 1), Math.round(progress * Math.max(0, pagesOut.length - 1))));
          }
        } catch {}
      }
      setPage(target);
      lastPageRef.current = target;
      try {
        const idStr = String(bookId || "");
        if (idStr && !idStr.startsWith("local_")) {
          const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
          axios.patch(`${API}/books/${idStr}`, { userId, totalPages: pagesOut.length }).catch(()=>{});
        }
      } catch {}
      try { onFirstLayoutDone && onFirstLayoutDone(); } catch {}
      return;
    }
    setReflowing(true);
    const run = () => {
    const measureDiv = document.createElement("div");
    measureDiv.style.visibility = "hidden";
    measureDiv.style.position = "fixed";
    measureDiv.style.left = "-9999px";
    measureDiv.style.top = "-9999px";
    measureDiv.style.width = `${dims.width}px`;
    const lineHeightUsed = isFullscreen ? Math.max(1.2, lineHeight * 0.88) : lineHeight;
    measureDiv.style.lineHeight = String(lineHeightUsed);
    measureDiv.style.fontSize = `${fontSize}px`;
    measureDiv.style.fontFamily = famMap[fontFamily];
    document.body.appendChild(measureDiv);
    const paddingY = isFullscreen ? 0 : (Math.max(16, vPad) + 4) * 2;
    const pageHeight = Math.max(200, dims.height - paddingY);
    const src = document.createElement("div");
    src.innerHTML = html;
    const nodes = Array.from(src.childNodes);
    const measure = (content) => {
      measureDiv.innerHTML = content;
      return Math.ceil(measureDiv.getBoundingClientRect().height);
    };
    const totalHeight = measure(html);
    let pagesOut = [];
    let used = 0;
    let cur = [];
    nodes.forEach(n => {
      const outer = n.outerHTML || (n.textContent ? `<p>${n.textContent}</p>` : "");
      if (!outer) return;
      const h = measure(outer);
      if (h <= pageHeight) {
        if (used + h <= pageHeight) {
          cur.push(outer);
          used += h;
        } else {
          pagesOut.push(cur.join(""));
          cur = [outer];
          used = h;
        }
        return;
      }
      const text = String(n.textContent || "");
      const words = text.split(/\s+/).filter(Boolean);
      let start = 0;
      while (start < words.length) {
        let low = 1, high = words.length - start, fit = 0, fitH = 0;
        while (low <= high) {
          const mid = (low + high) >> 1;
          const chunkHtml = `<p>${words.slice(start, start + mid).join(" ")}</p>`;
          const ch = measure(chunkHtml);
          if (used + ch <= pageHeight) {
            fit = mid; fitH = ch; low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        if (fit === 0) {
          pagesOut.push(cur.join(""));
          cur = [];
          used = 0;
          continue;
        }
        const chunkHtml = `<p>${words.slice(start, start + fit).join(" ")}</p>`;
        cur.push(chunkHtml);
        used += fitH;
        start += fit;
        if (start < words.length) {
          pagesOut.push(cur.join(""));
          cur = [];
          used = 0;
        }
      }
    });
    if (cur.length) pagesOut.push(cur.join(""));
    if (uniformPages && !isFullscreen) {
      const estCount = Math.max(1, Math.ceil(totalHeight / pageHeight));
      const plain = src.textContent || "";
      const words = plain.split(/\s+/).filter(Boolean);
      const per = Math.max(1, Math.ceil(words.length / estCount));
      let uniform = [];
      for (let i = 0; i < words.length; i += per) {
        uniform.push(`<p>${words.slice(i, i + per).join(" ")}</p>`);
      }
      pagesOut = uniform.length ? uniform : pagesOut;
    }
    if (!pagesOut.length && html) pagesOut = [html];
    setPages(pagesOut);
    splitCacheRef.current.set(key, { pages: pagesOut, htmlHash });
    let target = page;
    if (anchorPlain) {
      try {
        const pagesPlain = pagesOut.map(p => String(p || "").replace(/<[^>]+>/g, ""));
        let found = -1;
        for (let i = 0; i < pagesPlain.length; i++) {
          if (pagesPlain[i].includes(anchorPlain)) { found = i; break; }
        }
        if (found >= 0) target = found;
        else {
          const progress = pages.length ? (page / Math.max(1, pages.length - 1)) : 0;
          target = Math.max(0, Math.min(Math.max(0, pagesOut.length - 1), Math.round(progress * Math.max(0, pagesOut.length - 1))));
        }
      } catch {}
    }
    setPage(target);
    lastPageRef.current = target;
    try {
      const idStr = String(bookId || "");
      if (idStr && !idStr.startsWith("local_")) {
        const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
        axios.patch(`${API}/books/${idStr}`, { userId, totalPages: pagesOut.length }).catch(()=>{});
      }
    } catch {}
    document.body.removeChild(measureDiv);
    setReflowing(false);
    try { onFirstLayoutDone && onFirstLayoutDone(); } catch {}
    };
    let rafId = window.requestAnimationFrame(run);
    return () => window.cancelAnimationFrame(rafId);
  }, [html, fontSize, lineHeight, dims.width, dims.height, fontFamily, mode, isFullscreen, vPad]);

  useEffect(() => {
    if (!html || mode !== "page" || reflowing) return;
    const schedule = (fn) => {
      const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
      ric(fn);
    };
    let canceled = false;
    const sizes = [Math.max(14, fontSize - 2), fontSize, Math.min(28, fontSize + 2)];
    const lines = [Math.max(1.2, lineHeight - 0.1), lineHeight, Math.min(2.0, lineHeight + 0.1)];
    let si = 0, li = 0;
    setPrecomputing(true);
    const step = () => {
      if (canceled) return;
      const fs = sizes[si];
      const lh = lines[li];
          const bw = Math.round(dims.width / 16) * 16;
          const bh = Math.round(dims.height / 16) * 16;
          const key = `${String(bookId || "local")}|${fs}|${lh}|${fontFamily}|${bw}|${bh}|${isFullscreen ? 1 : 0}|${uniformPages ? 1 : 0}`;
          if (splitCacheRef.current.has(key)) {
            li++;
            if (li >= lines.length) { li = 0; si++; }
            if (si < sizes.length) schedule(step); else setPrecomputing(false);
            return;
          }
          const measureDiv = document.createElement("div");
          measureDiv.style.visibility = "hidden";
          measureDiv.style.position = "fixed";
          measureDiv.style.left = "-9999px";
          measureDiv.style.top = "-9999px";
          measureDiv.style.width = `${dims.width}px`;
          const lhUsed = isFullscreen ? Math.max(1.2, lh * 0.88) : lh;
          measureDiv.style.lineHeight = String(lhUsed);
          measureDiv.style.fontSize = `${fs}px`;
          measureDiv.style.fontFamily = famMap[fontFamily];
          document.body.appendChild(measureDiv);
          const paddingY = isFullscreen ? 0 : (Math.max(16, Math.round(fs * 0.5)) + 4) * 2;
          const pageHeight = Math.max(200, dims.height - paddingY);
          const src = document.createElement("div");
          src.innerHTML = html;
          const nodes = Array.from(src.childNodes);
          const measure = (content) => {
            measureDiv.innerHTML = content;
            return Math.ceil(measureDiv.getBoundingClientRect().height);
          };
          const totalHeight = measure(html);
          let pagesOut = [];
          let used = 0;
          let cur = [];
          nodes.forEach(n => {
            const outer = n.outerHTML || (n.textContent ? `<p>${n.textContent}</p>` : "");
            if (!outer) return;
            const h = measure(outer);
            if (h <= pageHeight) {
              if (used + h <= pageHeight) {
                cur.push(outer);
                used += h;
              } else {
                pagesOut.push(cur.join(""));
                cur = [outer];
                used = h;
              }
              return;
            }
            const text = String(n.textContent || "");
            const words = text.split(/\s+/).filter(Boolean);
            let start = 0;
            while (start < words.length) {
              let low = 1, high = words.length - start, fit = 0, fitH = 0;
              while (low <= high) {
                const mid = (low + high) >> 1;
                const chunkHtml = `<p>${words.slice(start, start + mid).join(" ")}</p>`;
                const ch = measure(chunkHtml);
                if (used + ch <= pageHeight) {
                  fit = mid; fitH = ch; low = mid + 1;
                } else {
                  high = mid - 1;
                }
              }
              if (fit === 0) {
                pagesOut.push(cur.join(""));
                cur = [];
                used = 0;
                continue;
              }
              const chunkHtml = `<p>${words.slice(start, start + fit).join(" ")}</p>`;
              cur.push(chunkHtml);
              used += fitH;
              start += fit;
              if (start < words.length) {
                pagesOut.push(cur.join(""));
                cur = [];
                used = 0;
              }
            }
          });
          if (cur.length) pagesOut.push(cur.join(""));
          if (uniformPages && !isFullscreen) {
            const estCount = Math.max(1, Math.ceil(totalHeight / pageHeight));
            const plain2 = src.textContent || "";
            const words2 = plain2.split(/\s+/).filter(Boolean);
            const per2 = Math.max(1, Math.ceil(words2.length / estCount));
            let uniform2 = [];
            for (let i = 0; i < words2.length; i += per2) {
              uniform2.push(`<p>${words2.slice(i, i + per2).join(" ")}</p>`);
            }
            pagesOut = uniform2.length ? uniform2 : pagesOut;
          }
          if (!pagesOut.length && html) pagesOut = [html];
          const htmlHash2 = String(html || "").replace(/<[^>]+>/g, "").trim().length;
          splitCacheRef.current.set(key, { pages: pagesOut, htmlHash: htmlHash2 });
          document.body.removeChild(measureDiv);
      li++;
      if (li >= lines.length) { li = 0; si++; }
      if (si < sizes.length) schedule(step); else setPrecomputing(false);
    };
    schedule(step);
    return () => { canceled = true; setPrecomputing(false); };
  }, [html, fontSize, lineHeight, dims.width, dims.height, fontFamily, mode, isFullscreen, uniformPages, reflowing]);

  // animation is now driven directly from goToPage for reliability

  const toggleFullscreen = () => {
    const el = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const applyHighlights = (content, pageIdx) => {
    try {
      const items = (highlights || []).filter(h => (pageIdx < 0 || h.page === pageIdx) && h.text);
      if (!items.length) return content;
      let out = content;
      items.forEach(h => {
        const color = h.color || "yellow";
        const styleStr = `style=\"background:${color === "yellow" ? "rgba(255, 229, 100, 0.45)" : (color === "pink" ? "rgba(255, 140, 180, 0.45)" : (color === "green" ? "rgba(140, 255, 175, 0.45)" : color))};color:inherit;border-radius:2px;padding:0 2px;\"`;
        let noteText = "";
        noteText = "";
        if (h.nodeText && Number.isFinite(h.offset)) {
          const paraIdx = out.indexOf(h.nodeText);
          if (paraIdx >= 0) {
            const start = paraIdx + h.offset;
            const before = out.slice(0, start);
            const target = out.slice(start, start + h.text.length);
            const after = out.slice(start + h.text.length);
            const inner = noteText ? `<em>${target}</em>` : target;
            out = `${before}<mark class=\"hl-${color}\" ${styleStr} ${noteText ? `data-note=\"${noteText.replace(/"/g, '&quot;')}\"` : ""}>${inner}</mark>${after}`;
            return;
          }
        }
        const esc = String(h.text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(esc, "i");
        const repl = (m) => noteText ? `<mark class=\"hl-${color}\" ${styleStr} data-note=\"${noteText.replace(/"/g, '&quot;')}\"><em>${m}</em></mark>` : `<mark class=\"hl-${color}\" ${styleStr}>${m}</mark>`;
        out = out.replace(re, repl);
      });
      return out;
    } catch {
      return content;
    }
  };

  const goToPage = next => {
    const total = pages.length || 1;
    if (total < 2 && mode === "page") return;
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (clamped === page) return;
    if (mode === "page") {
      const dir = clamped > page ? "next" : "prev";
      lastPageRef.current = page;
      setAnim({ active: true, dir, next: clamped, stage: 0 });
      requestAnimationFrame(() => {
        setAnim(prev => ({ ...prev, stage: 1 }));
        setTimeout(() => {
          setPage(clamped);
          try { onPageChange && onPageChange(clamped); } catch {}
          lastPageRef.current = clamped;
          setAnim({ active: false, dir: "next", next: 0, stage: 0 });
        }, ANIM_MS);
      });
    } else {
      setMode("page");
      setPage(clamped);
      try { onPageChange && onPageChange(clamped); } catch {}
    }
  };

  const onSelect = e => {
    const sel = window.getSelection();
    const t = sel.toString().trim();
    if (!t) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const r = range.getBoundingClientRect();
    const node = range.startContainer;
    const nodeText = String(node?.textContent || "");
    const offset = range.startOffset || 0;
    setSelection({ word: t, x: r.left, y: r.top, nodeText, offset, page });
  };

  const famMap = {
    serif: "Georgia, 'Times New Roman', Times, serif",
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    georgia: "Georgia, serif",
    times: "'Times New Roman', Times, serif",
    verdana: "Verdana, Geneva, sans-serif"
  };
  const paletteMap = {
    black: { bg: "#000000", fg: "#e5e5e5" },
    dark: { bg: "#111111", fg: "#e5e5e5" },
    sepia: { bg: "#f1e7d0", fg: "#2a2a1f" },
    paper: { bg: "#fdfaf6", fg: "#222222" }
  };
  const bgColor = (paletteMap[palette] || paletteMap.black).bg;
  const fgColor = (paletteMap[palette] || paletteMap.black).fg;
  const pageBg = palette === "paper" ? "#fdfaf6" : (palette === "sepia" ? "#f1e7d0" : "#1a1a1a");
  const effectiveLineHeight = isFullscreen ? Math.max(1.2, lineHeight * 0.88) : lineHeight;
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      root.style.overflow = "auto";
      body.style.overflow = "auto";
    };
  }, [mode]);

  useEffect(() => {
    if (initialPage != null && Number.isFinite(Number(initialPage))) {
      const p = Number(initialPage);
      setPage(p);
      lastPageRef.current = p;
    }
  }, [initialPage]);
  useEffect(() => {
    const applyInitialScroll = () => {
      if (mode !== "scroll") return;
      const el = scrollRef.current;
      if (!el) return;
      const pct = Math.max(0, Math.min(100, Number(initialScroll || 0)));
      const maxY = Math.max(1, el.scrollHeight - el.clientHeight);
      const y = Math.round((pct / 100) * maxY);
      el.scrollTop = y;
      setScrollProgress(Math.max(0, Math.min(1, pct / 100)));
    };
    const id = window.requestAnimationFrame(applyInitialScroll);
    return () => window.cancelAnimationFrame(id);
  }, [initialScroll, mode, dims.height, html]);

  return (
    <div
      ref={containerRef}
      className={theme === "dark" ? "bg-black text-neutral-200" : "bg-white text-black"}
      style={{
        backgroundColor: bgColor,
        color: fgColor,
        height: isFullscreen ? "100dvh" : "100vh",
        overflow: mode === "page" ? "hidden" : undefined,
        position: isFullscreen ? "fixed" : undefined,
        inset: isFullscreen ? 0 : undefined
      }}
    >
      <div
        ref={toolbarRef}
        className={theme === "dark" ? "z-10 bg-neutral-900/85 border-b border-neutral-800" : "z-10 bg-white/80 border-b"}
        style={{ position: isFullscreen ? "fixed" : "sticky", top: 0, left: 0, right: 0 }}
      >
        <div className="w-full flex items-center gap-4 px-4 py-2 flex-wrap overflow-hidden">
          {mode === "page" && (
            <>
              <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={() => { try { onBack && onBack(); } catch {} }}>Back</button>
              <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={() => { goToPage(Math.max(0, page - 1)); }}>Prev</button>
              <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={() => { goToPage(Math.min((pages.length || 1) - 1, page + 1)); }}>Next</button>
              <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>
                {pages.length ? `${page + 1} / ${pages.length}` : "-"}
              </span>
              <div className="flex-1 h-2 bg-neutral-800 rounded-md overflow-hidden mx-3">
                <div style={{ width: `${pages.length ? Math.min(100, Math.round(((page + 1) / pages.length) * 100)) : 0}%`, height: 8, background: theme === "dark" ? "#ffffff" : "#111111", transition: "width 300ms ease" }} />
              </div>
              
            </>
          )}
          {mode === "scroll" && (
            <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={() => { try { onBack && onBack(); } catch {} }}>Back</button>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {precomputing && (
              <div className="flex items-center gap-2">
                <div style={{ width: 80, height: 8, background: theme === "dark" ? "#444444" : "#dddddd", position: "relative", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: theme === "dark" ? "linear-gradient(90deg, transparent, #ffffff, transparent)" : "linear-gradient(90deg, transparent, #111111, transparent)", transform: "translateX(-100%)", animation: "loaderMove 1200ms linear infinite" }} />
                </div>
                <span className={theme === "dark" ? "text-xs text-neutral-300" : "text-xs"}>Optimizing…</span>
                <style>{`@keyframes loaderMove { 0% { transform: translateX(-100%); } 50% { transform: translateX(0%); } 100% { transform: translateX(100%); } }`}</style>
              </div>
            )}
            <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={toggleFullscreen}>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</button>
            <button className={theme === "dark" ? "px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-3 py-1 rounded border bg-white"} onClick={() => setSettingsOpen(true)}>Settings</button>
          </div>
        </div>
      </div>
      {mode === "scroll" && (
        <div className="w-full flex items-center gap-3 px-4 py-2">
          <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>{`${Math.min(100, Math.max(0, Math.round(scrollProgress * 100)))}%`}</span>
          <div className="flex-1 h-2 bg-neutral-800 rounded-md overflow-hidden">
            <div style={{ width: `${Math.min(100, Math.max(0, Math.round(scrollProgress * 100)))}%`, height: 8, background: theme === "dark" ? "#ffffff" : "#111111", transition: "width 200ms ease" }} />
          </div>
        </div>
      )}
      {mode === "page" ? (
        <div onMouseUp={onSelect} className="w-full px-0 py-0" style={{ fontSize, lineHeight: effectiveLineHeight, width: "100%", height: dims.height, overflow: "hidden", touchAction: "pan-y", overscrollBehavior: "contain", backgroundColor: isFullscreen ? pageBg : undefined, marginTop: isFullscreen ? toolbarH : 0 }}>
          {!anim.active && (
            <>
              <div onClick={() => { goToPage(Math.max(0, page - 1)); }} style={{ position: "absolute", inset: "0 auto 0 0", width: "30%", height: "100%", zIndex: 5, background: "transparent" }} />
              <div onClick={() => { goToPage(Math.min((pages.length || 1) - 1, page + 1)); }} style={{ position: "absolute", inset: "0 0 0 auto", width: "30%", height: "100%", zIndex: 5, background: "transparent" }} />
            </>
          )}
          {anim.active ? (
            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", perspective: simpleAnim ? "none" : "1200px", transformStyle: "preserve-3d" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformOrigin: anim.dir === "next" ? "left center" : "right center",
                  transition: `transform ${ANIM_MS}ms cubic-bezier(.22,.61,.36,1), opacity ${ANIM_MS}ms ease, box-shadow ${ANIM_MS}ms ease`,
                  willChange: "transform, opacity",
                  transform: anim.stage ? (anim.dir === "next" ? (simpleAnim ? "translateX(-100.5%)" : "translateX(-100.5%) scale(0.985) rotateY(-8deg) translateZ(0)") : (simpleAnim ? "translateX(100.5%)" : "translateX(100.5%) scale(0.985) rotateY(8deg) translateZ(0)")) : (simpleAnim ? "translateX(0)" : "translateX(0) scale(1) rotateY(0) translateZ(0)"),
                  opacity: anim.stage ? 0.98 : 1,
                  boxShadow: simpleAnim ? "none" : (anim.stage ? "0 28px 56px rgba(0,0,0,0.40)" : "0 10px 28px rgba(0,0,0,0.28)"),
                  zIndex: 2,
                  transformStyle: "preserve-3d",
                  outline: "1px solid transparent",
                  backgroundClip: "padding-box"
                }}
              >
                <div style={{ position: "absolute", inset: 0, padding: `${isFullscreen ? 0 : Math.max(16, vPad) + 4}px 24px`, borderRadius: 0, backgroundColor: pageBg, boxShadow: isFullscreen ? "none" : undefined, filter: eyeComfort ? `sepia(${Math.round(warmth*100)}%) hue-rotate(330deg) brightness(${brightness})` : undefined }}>
                  <div className="max-w-none" style={{ fontFamily: famMap[fontFamily], color: fgColor, margin: 0 }} dangerouslySetInnerHTML={{ __html: (pages[lastPageRef.current] ? applyHighlights(pages[lastPageRef.current], lastPageRef.current) : html) }} />
                </div>
                {!simpleAnim && <div style={{ position: "absolute", top: 0, bottom: 0, left: anim.dir === "next" ? "50%" : "auto", right: anim.dir === "next" ? "auto" : "50%", width: "16%", transform: "translateX(-50%)", pointerEvents: "none", background: anim.dir === "next" ? "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0))" : "linear-gradient(to left, rgba(0,0,0,0.45), rgba(0,0,0,0))", opacity: anim.stage ? 0.4 : 0, transition: "opacity 400ms ease" }} />}
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transformOrigin: anim.dir === "next" ? "right center" : "left center",
                  transition: `transform ${ANIM_MS}ms cubic-bezier(.22,.61,.36,1), opacity ${ANIM_MS}ms ease, box-shadow ${ANIM_MS}ms ease`,
                  willChange: "transform, opacity",
                  transform: anim.stage ? (simpleAnim ? "translateX(0)" : "translateX(0) scale(1) rotateY(0) translateZ(0)") : (anim.dir === "next" ? (simpleAnim ? "translateX(100.2%)" : "translateX(100.2%) scale(0.997) rotateY(0) translateZ(0)") : (simpleAnim ? "translateX(-100.2%)" : "translateX(-100.2%) scale(0.997) rotateY(0) translateZ(0)")),
                  opacity: anim.stage ? 1 : 0.98,
                  boxShadow: simpleAnim ? "none" : (anim.stage ? "0 28px 56px rgba(0,0,0,0.40)" : "0 10px 28px rgba(0,0,0,0.28)"),
                  zIndex: 1,
                  transformStyle: "preserve-3d",
                  outline: "1px solid transparent",
                  backgroundClip: "padding-box"
                }}
              >
                <div style={{ position: "absolute", inset: 0, padding: `${isFullscreen ? 0 : Math.max(16, vPad) + 4}px 24px`, borderRadius: 0, backgroundColor: pageBg, boxShadow: isFullscreen ? "none" : undefined, filter: eyeComfort ? `sepia(${Math.round(warmth*100)}%) hue-rotate(330deg) brightness(${brightness})` : undefined }}>
                  <div className="max-w-none" style={{ fontFamily: famMap[fontFamily], color: fgColor, margin: 0 }} dangerouslySetInnerHTML={{ __html: (pages[anim.next] ? applyHighlights(pages[anim.next], anim.next) : html) }} />
                </div>
                {!simpleAnim && <div style={{ position: "absolute", top: 0, bottom: 0, left: anim.dir === "next" ? "auto" : "50%", right: anim.dir === "next" ? "50%" : "auto", width: "16%", transform: "translateX(50%)", pointerEvents: "none", background: anim.dir === "next" ? "linear-gradient(to left, rgba(0,0,0,0.45), rgba(0,0,0,0))" : "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0))", opacity: anim.stage ? 0.35 : 0, transition: "opacity 400ms ease" }} />}
              </div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ padding: isFullscreen ? "0 24px" : `${Math.max(16, vPad) + 4}px 24px`, borderRadius: 0, backgroundColor: pageBg, boxShadow: (isFullscreen || simpleAnim) ? "none" : "0 8px 24px rgba(0,0,0,0.25)", filter: eyeComfort ? `sepia(${Math.round(warmth*100)}%) hue-rotate(330deg) brightness(${brightness})` : undefined, height: "100%" }}>
                <div className="max-w-none" style={{ fontFamily: famMap[fontFamily], color: fgColor, margin: 0 }} dangerouslySetInnerHTML={{ __html: (pages[page] ? applyHighlights(pages[page], page) : html) }} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div ref={scrollRef} onMouseUp={onSelect} onScroll={e => { try { const t = e.currentTarget; const prog = Math.max(0, Math.min(1, (t.scrollTop / Math.max(1, (t.scrollHeight - t.clientHeight))))); setScrollProgress(prog); saveScroll(prog); } catch {} }} className="w-full px-0 py-0" style={{ fontSize, lineHeight: effectiveLineHeight, width: "100%", height: dims.height, overflowY: "auto", overscrollBehavior: "contain", scrollBehavior: "smooth", fontFamily: famMap[fontFamily], padding: isFullscreen ? "0 24px" : "16px 24px", marginTop: isFullscreen ? toolbarH : 0, position: "relative" }}>
          <div className="prose max-w-none" style={{ filter: eyeComfort ? `sepia(${Math.round(warmth*100)}%) hue-rotate(330deg) brightness(${brightness})` : undefined, color: fgColor, fontFamily: famMap[fontFamily] }} dangerouslySetInnerHTML={{ __html: applyHighlights(html, -1) }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${Math.round(((scrollRef.current?.scrollTop || 0)))}px`, background: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)", pointerEvents: "none" }} />
        </div>
      )}
      {reflowing && mode === "page" && (
        <div style={{ position: "fixed", inset: 0, background: "#000000", display: "grid", placeItems: "center", zIndex: 1000 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ position: "relative", width: 160, height: 120, margin: "0 auto", perspective: 800 }}>
              <div style={{ position: "absolute", top: 0, left: "50%", width: 76, height: 120, background: "#f4f0e6", border: "1px solid #222", transformOrigin: "left center", borderTopLeftRadius: 6, borderBottomLeftRadius: 6, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", animation: "bookLeft 1200ms ease-in-out infinite alternate" }} />
              <div style={{ position: "absolute", top: 0, left: "50%", width: 76, height: 120, background: "#f4f0e6", border: "1px solid #222", transformOrigin: "right center", borderTopRightRadius: 6, borderBottomRightRadius: 6, boxShadow: "0 10px 24px rgba(0,0,0,0.35)", animation: "bookRight 1200ms ease-in-out infinite alternate" }} />
              <div style={{ position: "absolute", top: 8, left: "calc(50% - 1px)", width: 2, height: 104, background: "#ddd" }} />
            </div>
            <div style={{ marginTop: 16, color: "#ffffff", fontWeight: 600 }}>Reordering pages…</div>
            <style>{`
              @keyframes bookLeft { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(-40deg) translateZ(0); } }
              @keyframes bookRight { from { transform: rotateY(0deg) translateZ(0); } to { transform: rotateY(40deg) translateZ(0); } }
            `}</style>
          </div>
        </div>
      )}
      {settingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className={theme === "dark" ? "mx-auto mt-10 mb-10 max-w-xl rounded border border-neutral-700 bg-neutral-900 text-neutral-200" : "mx-auto mt-10 mb-10 max-w-xl rounded border bg-white"}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>Settings</div>
              <button className={theme === "dark" ? "px-2 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200" : "px-2 py-1 rounded border bg-white"} onClick={() => setSettingsOpen(false)}>Close</button>
            </div>
            <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Font Size</span>
                <input type="range" min="14" max="28" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Line Height</span>
                <input type="range" min="1.2" max="2.0" step="0.05" value={lineHeight} onChange={e => setLineHeight(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Family</span>
                <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className={theme === "dark" ? "border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-200" : "border rounded px-2 py-1"}>
                  <option value="serif">Serif</option>
                  <option value="sans">Sans</option>
                  <option value="mono">Mono</option>
                  <option value="georgia">Georgia</option>
                  <option value="times">Times</option>
                  <option value="verdana">Verdana</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Mode</span>
                <select value={mode} onChange={e => { const v = e.target.value; setMode(v); persistSettings({ mode: v }); persistMode(v); }} className={theme === "dark" ? "border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-200" : "border rounded px-2 py-1"}>
                  <option value="page">Pages</option>
                  <option value="scroll">Scroll</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Background</span>
                <select value={palette} onChange={e => { const v = e.target.value; setPalette(v); persistSettings({ palette: v }); }} className={theme === "dark" ? "border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-200" : "border rounded px-2 py-1"}>
                  <option value="black">Black</option>
                  <option value="dark">Dark Gray</option>
                  <option value="sepia">Sepia</option>
                  <option value="paper">Paper</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Eye Comfort</span>
                <input type="checkbox" checked={eyeComfort} onChange={e => { const v = e.target.checked; setEyeComfort(v); persistSettings({ eyeComfort: v }); }} />
              </div>
              {eyeComfort && (
                <>
                  <div className="flex items-center gap-3">
                    <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Warmth</span>
                    <input type="range" min="0" max="1" step="0.05" value={warmth} onChange={e => { const v = Number(e.target.value); setWarmth(v); persistSettings({ warmth: v }); }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Brightness</span>
                    <input type="range" min="0.6" max="1.1" step="0.05" value={brightness} onChange={e => { const v = Number(e.target.value); setBrightness(v); persistSettings({ brightness: v }); }} />
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <span className={theme === "dark" ? "text-xs text-neutral-400" : "text-xs"}>Theme</span>
                <select value={theme} onChange={e => { const v = e.target.value; setTheme(v); persistSettings({ theme: v }); }} className={theme === "dark" ? "border border-neutral-700 rounded px-2 py-1 bg-neutral-800 text-neutral-200" : "border rounded px-2 py-1"}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
      {selection && <WordPopup selection={selection} page={page} bookId={bookId} onClose={() => setSelection(null)} />}
    </div>
  );
}
