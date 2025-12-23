const fs = require("fs");

// pdfjs-dist is ESM only in recent versions and hard to use in CJS Node environment without polyfills.
// We will rely on pdf-parse (which uses an older PDF.js build) and improve text cleaning.
let pdfParse = null;
try { pdfParse = require("pdf-parse"); } catch {}

function cleanText(text) {
  let s = String(text || "");
  
  // Replace common ligatures and control characters
  // Standard ligatures
  s = s.replace(/\ufb00/g, "ff")
       .replace(/\ufb01/g, "fi")
       .replace(/\ufb02/g, "fl")
       .replace(/\ufb03/g, "ffi")
       .replace(/\ufb04/g, "ffl")
       .replace(/\ufb05/g, "ft")
       .replace(/\ufb06/g, "st")
       // Custom PUA ligatures observed in user PDFs
       .replace(/\ue09d/g, "ft")  //  -> ft
       .replace(/\ue117/g, "ft")  //  -> ft
       .replace(/\ue0bb/g, "Th")  //  -> Th
       .replace(/\ue062/g, "Th"); //  -> Th

  // Remove control characters (keeping newline/tab)
  // \x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Heuristic: "□e" -> "The" if "□" is a non-ascii char (like PUA)
  // We can't know for sure which char it is, but we can look for the pattern.
  // Pattern: [space][non-ascii]e[space] -> " The "
  // Or just [non-ascii]e -> The if it looks like a word start
  
  // Try to fix specific "The" issue if we see it
  // Match a non-ASCII character followed by 'e ' or 'e' at end of word
  // Note: This is aggressive, so we should be careful. 
  // But "□e" -> "The" is very common in broken PDF extractions.
  // We'll replace [Start of word][Non-ASCII]e with "The"
  s = s.replace(/(^|\s)[^\x00-\x7F]e(\s|$|[.,;])/g, "$1The$2");
  
  // Also handle [Start of word][Non-ASCII]he -> The (if box is T)
  s = s.replace(/(^|\s)[^\x00-\x7F]he(\s|$|[.,;])/g, "$1The$2");

  const lines = s.replace(/\r/g, "\n").split(/\n+/);
  const cleaned = lines.filter(l => {
    const trimmed = l.trim();
    if (!trimmed) return false;
    if (/^[-–—]*\s*\d+\s*(of|\/)\s*\d+\s*[-–—]*$/i.test(trimmed)) return false;
    if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(trimmed)) return false;
    if (/^\d+$/.test(trimmed)) return false;
    return true;
  }).join("\n");
  
  if (!cleaned.trim()) return "";
  let t = cleaned.replace(/-\n/g, "");
  t = t.replace(/\n\s*\n/g, "</p><p>");
  t = t.replace(/\s{2,}/g, " ");
  return `<p>${t}</p>`;
}

async function processPdf(filePath, buffer) {
  const raw = buffer || fs.readFileSync(filePath);
  const data = (raw instanceof Uint8Array) ? raw : new Uint8Array(raw);
  let text = "";

  if (pdfParse) {
    try {
      const r = await pdfParse(Buffer.from(data));
      const t = String(r?.text || "").trim();
      if (t) text = t;
    } catch (err) {
      console.error("PDFParse Error:", err);
    }
  }

  const html = cleanText(text || "");
  return { text: text || "", html };
}

module.exports = { processPdf };
