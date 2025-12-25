import { useEffect, useState, useRef } from "react";
import axios from "axios";

const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const RAW = import.meta.env.VITE_API_URL;
const API = RAW ? ((RAW.startsWith("http") || RAW.startsWith("/")) ? RAW : `/${RAW}`) : (isLocal ? "http://localhost:5000/api" : "https://easyread-backend.onrender.com/api");

export default function WordPopup({ selection, page = 0, bookId = null, onClose }) {
  const [meaning, setMeaning] = useState(null);
  const [translation, setTranslation] = useState("");
  const [to, setTo] = useState("hi");
  const [defs, setDefs] = useState([]);
  const [loadingTr, setLoadingTr] = useState(false);
  const [voices, setVoices] = useState([]);
  const boxRef = useRef(null);
  const [pos, setPos] = useState({ left: selection.x, top: selection.y + 24 });
  const [boxDims, setBoxDims] = useState({ w: 320, h: 220 });
  const [hlColor, setHlColor] = useState("yellow");

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const m = await axios.get(`${API}/meaning/${encodeURIComponent(selection.word)}`);
        if (!active) return;
        setMeaning(m.data);
        const defsArr = Array.isArray(m.data) ? m.data.flatMap(e => (e.meanings || []).flatMap(mm => (mm.definitions || []).map(d => d.definition))) : [];
        setDefs(defsArr.slice(0, 6));
        setLoadingTr(true);
        let tstr = "";
        try {
          const text = selection.word.trim();
          const tr = await axios.get(`${API}/translate`, { params: { text, to, from: "en" } });
          const tdata = tr.data;
          tstr = typeof tdata === "string" ? tdata : (tdata?.translatedText || tdata?.translation || (Array.isArray(tdata?.translations) ? (tdata.translations[0]?.text || "") : ""));
        } catch (_) {
          try {
            const urls = [
              "https://libretranslate.com/translate",
              "https://libretranslate.de/translate",
              "https://translate.astian.org/translate",
              "https://translate.argosopentech.com/translate"
            ];
            const text = selection.word.trim();
            const body = { q: text, source: "en", target: to, format: "text" };
            const headers = { "Content-Type": "application/json", "Accept": "application/json" };
            const calls = urls.map(u => fetch(u, { method: "POST", headers, body: JSON.stringify(body) }));
            let payload = null;
            try {
              const r = await Promise.any(calls);
              payload = await r.json();
            } catch (e2) {
              payload = null;
            }
            if (payload) {
              tstr = typeof payload === "string" ? payload : (payload.translatedText || payload.translation || (Array.isArray(payload.translations) ? (payload.translations[0]?.text || "") : ""));
            }
          } catch (_) {}
        }
        if (!tstr) {
          try {
            const pair = `en|${String(to || "en").toLowerCase()}`;
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selection.word.trim())}&langpair=${encodeURIComponent(pair)}`;
            const resp = await fetch(url, { headers: { "Accept": "application/json" } });
            const data = await resp.json();
            const cand = data?.responseData?.translatedText || "";
            if (cand) tstr = cand;
          } catch (_) {}
        }
        if (!active) return;
        const toPlain = s => { const el = document.createElement("div"); el.innerHTML = String(s || ""); return el.textContent || el.innerText || ""; };
        const isBad = txt => {
          const t = String(txt || "");
          if (!t.trim()) return true;
          const banned = /(LibreTranslate|API|GitHub|window\.Prism|license|vpn_key|language|content_copy|cloud_download|Argos Translate|Mit ❤ gemacht)/i;
          if (banned.test(t)) return true;
          if (t.length > Math.max(80, selection.word.length * 5)) return true;
          return false;
        };
        let plain = toPlain(tstr);
        if (isBad(plain)) {
          try {
            const pair = `en|${String(to || "en").toLowerCase()}`;
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selection.word.trim())}&langpair=${encodeURIComponent(pair)}`;
            const resp = await fetch(url, { headers: { "Accept": "application/json" } });
            const data = await resp.json();
            const cand = data?.responseData?.translatedText || "";
            const alt = toPlain(cand);
            if (alt && !isBad(alt)) plain = alt;
          } catch {}
        }
        const maxLen = 120;
        if (plain.length > maxLen) plain = plain.slice(0, maxLen).trim();
        setTranslation(plain);
        setLoadingTr(false);
      } catch (_) {
        if (!active) return;
        setMeaning({ error: true });
        setTranslation("");
        setLoadingTr(false);
      }
    };
    run();
    return () => { active = false; };
  }, [selection.word, to]);

  useEffect(() => {
    const margin = 8;
    const w = Math.max(240, window.innerWidth);
    const h = Math.max(240, window.innerHeight);
    const bw = Math.min(320, w - 16);
    const bh = Math.min(360, h - 16);
    setBoxDims({ w: bw, h: bh });
    let left = selection.x;
    let top = selection.y + 24;
    if (left + bw + margin > w) left = w - bw - margin;
    if (left < margin) left = margin;
    if (top + bh + margin > h) top = Math.max(margin, selection.y - bh - 24);
    if (top < margin) top = margin;
    setPos({ left, top });
  }, [selection.x, selection.y, to, translation, meaning]);

  useEffect(() => {
    const onResize = () => {
      const margin = 8;
      const w = Math.max(240, window.innerWidth);
      const h = Math.max(240, window.innerHeight);
      const bw = Math.min(320, w - 16);
      const bh = Math.min(360, h - 16);
      setBoxDims({ w: bw, h: bh });
      let left = pos.left;
      let top = pos.top;
      if (left + bw + margin > w) left = w - bw - margin;
      if (left < margin) left = margin;
      if (top + bh + margin > h) top = Math.max(margin, selection.y - bh - 24);
      if (top < margin) top = margin;
      setPos({ left, top });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos.left, pos.top, selection.y]);

  

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis?.getVoices?.() || [];
      setVoices(v);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  const save = async () => {
    try {
      const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
      await axios.post(`${API}/vocab`, { userId, word: selection.word, meaning, translation: { text: translation, to, from: "en" } });
      onClose();
    } catch (e) {
      onClose();
    }
  };

  const addHighlight = async () => {
    try {
      const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
      await axios.post(`${API}/highlights`, { userId, bookId, page, text: selection.word, color: hlColor, nodeText: selection.nodeText || "", offset: selection.offset || 0 });
      window.dispatchEvent(new Event("easyread_highlights_changed"));
    } catch {}
    onClose();
  };

  

  const speak = () => {
    try {
      const text = translation || selection.word;
      const u = new SpeechSynthesisUtterance(text);
      const prefLangs = [to, "hi-IN", "en-US", "en-GB"];
      const isFemaleName = n => /female|zira|natasha|susan|siri|karen|victoria|heera|hemant/i.test(String(n || ""));
      const pick = () => {
        const byLang = voices.filter(v => prefLangs.some(pl => String(v.lang || "").toLowerCase().startsWith(pl.toLowerCase())));
        const femaleLang = byLang.find(v => isFemaleName(v.name));
        if (femaleLang) return femaleLang;
        const femaleAny = voices.find(v => isFemaleName(v.name));
        if (femaleAny) return femaleAny;
        const msZira = voices.find(v => /zira/i.test(v.name));
        if (msZira) return msZira;
        return byLang[0] || voices[0] || null;
      };
      const voice = pick();
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang || u.lang;
        u.pitch = 1.05;
        u.rate = 0.95;
      }
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const removeHighlight = async () => {
    try {
      const userId = (() => { try { const u = JSON.parse(localStorage.getItem("easyread_user") || "null"); return (u && u.userId) ? u.userId : "guest"; } catch { return "guest"; } })();
      await axios.post(`${API}/highlights/remove`, { userId, bookId, page, text: selection.word, nodeText: selection.nodeText || "", offset: selection.offset || 0 });
      window.dispatchEvent(new Event("easyread_highlights_changed"));
    } catch {}
    onClose();
  };

  return (
    <div ref={boxRef} style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 100000, width: boxDims.w, maxHeight: boxDims.h, overflowY: "auto", pointerEvents: "auto" }} className="rounded-lg border shadow-lg p-3 bg-neutral-900 text-neutral-200 border-neutral-800">
      <div className="font-semibold mb-2 text-white">{selection.word}</div>
      <div className="text-sm mb-1 text-neutral-400">Meaning</div>
      <div className="text-sm max-h-28 overflow-auto mb-3">
        {meaning && !meaning.error && defs.length > 0 ? (
          <ul className="list-disc pl-5 space-y-1">
            {defs.map((d, i) => (
              <li key={i} className="text-neutral-200">{d}</li>
            ))}
          </ul>
        ) : (
          <span className="text-neutral-500">...</span>
        )}
      </div>
      <div className="text-xs mb-1 text-neutral-400">Translator</div>
      <div className="flex items-center gap-2 mb-2">
        <select value={to} onChange={e => setTo(e.target.value)} className="border border-neutral-700 bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-xs">
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ur">Urdu</option>
          <option value="bn">Bengali</option>
        </select>
      </div>
      <div className="text-xs max-h-20 overflow-auto mb-2">
        {translation ? (
          <span className="text-neutral-200">{translation}</span>
        ) : (
          <span className="text-neutral-500">{loadingTr ? "Translating..." : "No translation"}</span>
        )}
      </div>
      <div className="flex items-center justify-between mb-2">
        <button className="px-2 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 text-xs" onClick={speak}>Speak</button>
        <span className="text-[11px] text-neutral-500">Female voice</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] text-neutral-400">Highlight</span>
        <select value={hlColor} onChange={e => setHlColor(e.target.value)} className="border border-neutral-700 bg-neutral-800 text-neutral-200 px-1 py-0.5 rounded text-xs">
          <option value="yellow">Yellow</option>
          <option value="pink">Pink</option>
          <option value="green">Green</option>
        </select>
        <button className="px-2 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 text-xs" onClick={addHighlight}>Add</button>
      </div>
      
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-white text-black text-xs" onClick={save}>Save to Vocab</button>
        <button className="px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 text-xs" onClick={removeHighlight}>Remove Highlight</button>
        <button className="px-3 py-1 rounded border border-neutral-700 bg-neutral-800 text-neutral-200 text-xs" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
