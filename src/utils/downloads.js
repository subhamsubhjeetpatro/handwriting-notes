import { CANVAS_W, CANVAS_H } from "../constants";
import { parseLine } from "./renderCanvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// TTF from Google Fonts GitHub repo via jsDelivr.
// WOFF2 causes corrupted glyph mapping (dots instead of characters) due to Brotli table transforms
// that @pdf-lib/fontkit doesn't fully reverse. TTF is uncompressed and embeds cleanly.
const FONT_URLS = {
  Caveat:
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/caveat/static/Caveat-SemiBold.ttf",
  Kalam:
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/kalam/Kalam-Regular.ttf",
  "Dancing Script":
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dancingscript/static/DancingScript-SemiBold.ttf",
  "Patrick Hand":
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/patrickhand/PatrickHand-Regular.ttf",
  "Architects Daughter":
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/architectsdaughter/ArchitectsDaughter-Regular.ttf",
  "Indie Flower":
    "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/indieflower/IndieFlower-Regular.ttf",
};

const H2_RGB = { r: 0.102, g: 0.478, b: 0.235 }; // #1a7a3c

// Parse "#rrggbb" or "rgba(r,g,b,a)" → { r,g,b,a } all in [0,1]
function parseColor(color) {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  const m = color.match(
    /rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, ]+([0-9.]+))?\)/
  );
  if (m) {
    return {
      r: parseInt(m[1]) / 255,
      g: parseInt(m[2]) / 255,
      b: parseInt(m[3]) / 255,
      a: m[4] != null ? parseFloat(m[4]) : 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

// Convert canvas Y (top-down, 0=top) → pdf-lib Y (bottom-up, 0=bottom)
const pY = (canvasY, H) => H - canvasY;

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function downloadPDF(opts) {
  const {
    text,
    title,
    showTitle,
    font: fontFamily,
    paperStyle,
    paperBg,
    lineColor,
    inkColor,
    hlColor,
    fontSize,
  } = opts;
  const canvasH = opts.canvasH ?? CANVAS_H;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Try to load handwriting font from CDN; fall back to built-in Helvetica
  let pdfFont;
  const fontUrl = FONT_URLS[fontFamily];
  if (fontUrl) {
    try {
      const res = await fetch(fontUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = await res.arrayBuffer();
      pdfFont = await pdfDoc.embedFont(bytes);
    } catch (e) {
      console.warn(`Font "${fontFamily}" failed to load, falling back:`, e);
    }
  }
  if (!pdfFont) pdfFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Layout constants — must mirror renderCanvas.js exactly
  const lh = fontSize * 1.92;
  const mL = 68;
  const mR = 36;
  const tX =
    paperStyle === "ruled" || paperStyle === "wide" ? mL + 16 : mL - 10;
  const maxW = CANVAS_W - tX - mR;

  const ink = parseColor(inkColor);
  const hl = parseColor(hlColor);
  const bg = parseColor(paperBg);
  const lnC = parseColor(lineColor);

  const textLines = text.split("\n");
  let lineIdx = 0;
  let pageIdx = 0;

  do {
    const isFirstPage = pageIdx === 0;
    const mTop = isFirstPage && showTitle && title ? lh * 3.1 : lh * 2.2;
    const H = canvasH;
    const page = pdfDoc.addPage([CANVAS_W, H]);

    // ── Background ────────────────────────────────────────────────────────────
    drawBackground(page, { paperStyle, bg, lnC, mL, mTop, lh, fontSize, H });

    // ── Title (first page only) ───────────────────────────────────────────────
    if (isFirstPage && showTitle && title) {
      const fsT = Math.round(fontSize * 1.4);
      const tw = pdfFont.widthOfTextAtSize(title, fsT);
      // Highlight rect: canvas coords (tX-6, lh*1.7-fsT+1) size (tw+12, fsT+10)
      page.drawRectangle({
        x: tX - 6,
        y: H - (lh * 1.7 - fsT + 1) - (fsT + 10),
        width: tw + 12,
        height: fsT + 10,
        color: rgb(hl.r, hl.g, hl.b),
        opacity: hl.a * 0.9,
      });
      page.drawText(title, {
        x: tX,
        y: pY(lh * 1.7 + 4, H),
        size: fsT,
        font: pdfFont,
        color: rgb(ink.r, ink.g, ink.b),
      });
    }

    // ── Text lines ────────────────────────────────────────────────────────────
    const cfg = { pdfFont, fontSize, ink, hl, tX, maxW, lh, H };
    let curY = mTop - 3;

    for (; lineIdx < textLines.length; lineIdx++) {
      if (curY > H - 20) break;
      const raw = textLines[lineIdx];
      const prev = lineIdx > 0 ? textLines[lineIdx - 1] : undefined;
      const p = parseLine(raw, prev);

      if (p.type === "h1")
        curY = drawH1PDF(page, p.text, curY + lh * 0.45, cfg);
      else if (p.type === "h2")
        curY = drawH2PDF(page, p.text, curY + lh * 0.28, cfg);
      else if (p.type === "def")
        curY = drawDefPDF(page, p.term, p.desc, curY, cfg);
      else if (!raw.trim()) curY += lh * 0.55;
      else curY = drawParaPDF(page, p.text, curY, cfg);
    }

    pageIdx++;
  } while (lineIdx < textLines.length);

  const pdfBytes = await pdfDoc.save();
  triggerDownload(
    new Blob([pdfBytes], { type: "application/pdf" }),
    "handwritten-notes.pdf"
  );
}

// ── Background helpers ────────────────────────────────────────────────────────

function drawBackground(
  page,
  { paperStyle, bg, lnC, mL, mTop, lh, fontSize, H }
) {
  const W = CANVAS_W;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: H,
    color: rgb(bg.r, bg.g, bg.b),
  });

  if (paperStyle === "ruled" || paperStyle === "wide") {
    const sp = paperStyle === "wide" ? fontSize * 2.3 : lh;
    for (let y = mTop; y <= H - 20; y += sp) {
      page.drawLine({
        start: { x: 26, y: pY(y, H) },
        end: { x: W - 18, y: pY(y, H) },
        thickness: 0.75,
        color: rgb(lnC.r, lnC.g, lnC.b),
        opacity: 0.8,
      });
    }
    // Red margin line
    page.drawLine({
      start: { x: mL, y: pY(26, H) },
      end: { x: mL, y: pY(H - 18, H) },
      thickness: 1.1,
      color: rgb(0.863, 0.549, 0.549),
      opacity: 0.65,
    });
  } else if (paperStyle === "grid") {
    const gs = Math.max(18, Math.round(fontSize * 0.82));
    for (let y = 0; y <= H; y += gs)
      page.drawLine({
        start: { x: 0, y: pY(y, H) },
        end: { x: W, y: pY(y, H) },
        thickness: 0.45,
        color: rgb(lnC.r, lnC.g, lnC.b),
      });
    for (let x = 0; x <= W; x += gs)
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: H },
        thickness: 0.45,
        color: rgb(lnC.r, lnC.g, lnC.b),
      });
  } else if (paperStyle === "dotted") {
    const ds = Math.max(20, Math.round(fontSize * 0.9));
    for (let y = ds; y <= H; y += ds)
      for (let x = ds; x <= W; x += ds)
        page.drawCircle({
          x,
          y: pY(y, H),
          size: 0.9,
          color: rgb(lnC.r, lnC.g, lnC.b),
        });
  }
}

// ── Text draw helpers ─────────────────────────────────────────────────────────

function drawH1PDF(page, rawText, startY, cfg) {
  const { pdfFont, fontSize, ink, hl, tX, maxW, H } = cfg;
  const fsH = Math.round(fontSize * 1.44);
  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  const flush = (l, yy) => {
    const tw = pdfFont.widthOfTextAtSize(l, fsH);
    const rectY = yy - fsH - 2; // canvas top of rect
    const rectH = fsH + 12;
    page.drawRectangle({
      x: tX - 10,
      y: H - rectY - rectH,
      width: tw + 20,
      height: rectH,
      color: rgb(hl.r, hl.g, hl.b),
      opacity: 0.14,
    });
    page.drawRectangle({
      x: tX - 14,
      y: H - rectY - rectH,
      width: 3,
      height: rectH,
      color: rgb(ink.r, ink.g, ink.b),
      opacity: 0.72,
    });
    page.drawText(l, {
      x: tX,
      y: pY(yy + 3, H),
      size: fsH,
      font: pdfFont,
      color: rgb(ink.r, ink.g, ink.b),
    });
    page.drawLine({
      start: { x: tX - 10, y: pY(yy + 8, H) },
      end: { x: tX + tw + 10, y: pY(yy + 8, H) },
      thickness: 2.0,
      color: rgb(ink.r, ink.g, ink.b),
      opacity: 0.68,
    });
  };

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (pdfFont.widthOfTextAtSize(test, fsH) > maxW && line) {
      flush(line, y);
      line = w;
      y += fsH * 1.6;
      if (y > H - 20) break;
    } else {
      line = test;
    }
  }
  if (line && y <= H - 20) flush(line, y);
  return y + fsH * 1.8;
}

function drawH2PDF(page, rawText, startY, cfg) {
  const { pdfFont, fontSize, tX, maxW, H } = cfg;
  const fsH = Math.round(fontSize * 1.18);
  const indX = tX + 6;
  const indW = maxW - 6;
  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  const flush = (l, yy) => {
    const tw = pdfFont.widthOfTextAtSize(l, fsH);
    page.drawText(l, {
      x: indX,
      y: pY(yy + 3, H),
      size: fsH,
      font: pdfFont,
      color: rgb(H2_RGB.r, H2_RGB.g, H2_RGB.b),
    });
    page.drawLine({
      start: { x: indX, y: pY(yy + 8, H) },
      end: { x: indX + tw, y: pY(yy + 8, H) },
      thickness: 1.3,
      dashArray: [5, 4],
      color: rgb(H2_RGB.r, H2_RGB.g, H2_RGB.b),
      opacity: 0.52,
    });
  };

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (pdfFont.widthOfTextAtSize(test, fsH) > indW && line) {
      flush(line, y);
      line = w;
      y += fsH * 1.5;
      if (y > H - 20) break;
    } else {
      line = test;
    }
  }
  if (line && y <= H - 20) flush(line, y);
  return y + fsH * 1.6;
}

function drawDefPDF(page, term, desc, startY, cfg) {
  const { pdfFont, fontSize, ink, tX, maxW, lh, H } = cfg;
  const termLabel = `${term}: `;
  const termW = pdfFont.widthOfTextAtSize(termLabel, fontSize);
  const termOnlyW = pdfFont.widthOfTextAtSize(term, fontSize);

  page.drawText(termLabel, {
    x: tX,
    y: pY(startY + 3, H),
    size: fontSize,
    font: pdfFont,
    color: rgb(ink.r, ink.g, ink.b),
  });
  page.drawLine({
    start: { x: tX, y: pY(startY + 8, H) },
    end: { x: tX + termOnlyW, y: pY(startY + 8, H) },
    thickness: 1.0,
    color: rgb(ink.r, ink.g, ink.b),
    opacity: 0.58,
  });

  const words = desc.split(" ");
  let line = "";
  let y = startY;
  let firstLine = true;

  for (const w of words) {
    if (y > H - 20) break;
    const test = line ? `${line} ${w}` : w;
    const lineMax = firstLine ? maxW - termW : maxW;
    if (pdfFont.widthOfTextAtSize(test, fontSize) > lineMax && line) {
      page.drawText(line, {
        x: firstLine ? tX + termW : tX,
        y: pY(y + 3, H),
        size: fontSize,
        font: pdfFont,
        color: rgb(ink.r, ink.g, ink.b),
      });
      firstLine = false;
      line = w;
      y += lh;
    } else {
      line = test;
    }
  }
  if (line && y <= H - 20) {
    page.drawText(line, {
      x: firstLine ? tX + termW : tX,
      y: pY(y + 3, H),
      size: fontSize,
      font: pdfFont,
      color: rgb(ink.r, ink.g, ink.b),
    });
    y += lh;
  }
  return y;
}

function drawParaPDF(page, rawText, startY, cfg) {
  const { pdfFont, fontSize, ink, tX, maxW, lh, H } = cfg;
  if (!rawText.trim()) return startY + lh * 0.55;

  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  for (const w of words) {
    if (y > H - 20) break;
    const test = line ? `${line} ${w}` : w;
    if (pdfFont.widthOfTextAtSize(test, fontSize) > maxW && line) {
      page.drawText(line, {
        x: tX,
        y: pY(y, H),
        size: fontSize,
        font: pdfFont,
        color: rgb(ink.r, ink.g, ink.b),
      });
      line = w;
      y += lh;
    } else {
      line = test;
    }
  }
  if (line && y <= H - 20) {
    page.drawText(line, {
      x: tX,
      y: pY(y, H),
      size: fontSize,
      font: pdfFont,
      color: rgb(ink.r, ink.g, ink.b),
    });
    y += lh;
  }
  return y;
}

// ── PNG ───────────────────────────────────────────────────────────────────────

export function downloadPNG(canvases) {
  if (!canvases.length) return;

  if (canvases.length === 1) {
    canvases[0].toBlob(
      (blob) => triggerDownload(blob, "handwritten-notes.png"),
      "image/png",
      1.0
    );
    return;
  }

  const gap = 24;
  const pageH = canvases[0].height;
  const combined = document.createElement("canvas");
  combined.width = CANVAS_W;
  combined.height = pageH * canvases.length + gap * (canvases.length - 1);
  const ctx = combined.getContext("2d");
  canvases.forEach((canvas, i) => {
    ctx.drawImage(canvas, 0, i * (pageH + gap));
  });
  combined.toBlob(
    (blob) => triggerDownload(blob, "handwritten-notes.png"),
    "image/png",
    1.0
  );
}

// ── Word ─────────────────────────────────────────────────────────────────────

export function downloadWord({
  text,
  title,
  showTitle,
  font,
  inkColor,
  hlColor,
  fontSize,
}) {
  const hlHex = rgbaToHex(hlColor);
  const hlHex2 = rgbaToHex(hlColor, 0.7);
  let body = "";

  if (showTitle && title) {
    body += buildElement("h1", title, {
      font,
      inkColor,
      hlHex,
      fontSize: Math.round(fontSize * 1.4),
    });
    body += "<br>";
  }

  const textLines = text.split("\n");
  for (let i = 0; i < textLines.length; i++) {
    const raw = textLines[i];
    const prev = i > 0 ? textLines[i - 1] : undefined;
    const p = parseLine(raw, prev);
    if (p.type === "h1") {
      body += buildElement("h2", p.text, {
        font,
        inkColor,
        hlHex,
        fontSize: Math.round(fontSize * 1.28),
      });
    } else if (p.type === "h2") {
      body += buildElement("h3", p.text, {
        font,
        inkColor,
        hlHex: hlHex2,
        fontSize: Math.round(fontSize * 1.1),
      });
    } else if (p.type === "def") {
      const termStyle = `font-family:'${font}',cursive;color:${inkColor};font-size:${fontSize}pt;text-decoration:underline;font-weight:bold`;
      const descStyle = `font-family:'${font}',cursive;color:${inkColor};font-size:${fontSize}pt`;
      body += `<p style="line-height:2;margin:0"><span style="${termStyle}">${escapeHtml(p.term)}:</span> <span style="${descStyle}">${escapeHtml(p.desc)}</span></p>\n`;
    } else if (!raw.trim()) {
      body += `<p style="margin:4pt 0">&nbsp;</p>\n`;
    } else {
      body += `<p style="font-family:'${font}',cursive;color:${inkColor};font-size:${fontSize}pt;line-height:2;margin:0">${escapeHtml(raw)}</p>\n`;
    }
  }

  const html = [
    `<html xmlns:o="urn:schemas-microsoft-com:office:office"`,
    `      xmlns:w="urn:schemas-microsoft-com:office:word"`,
    `      xmlns="http://www.w3.org/TR/REC-html40">`,
    `<head>`,
    `  <meta charset="utf-8">`,
    `  <style>`,
    `    body { margin: 2cm; background: #fff; font-size: ${fontSize}pt; }`,
    `    h1,h2,h3 { display: block; }`,
    `  </style>`,
    `</head>`,
    `<body>${body}</body>`,
    `</html>`,
  ].join("\n");

  const blob = new Blob(["﻿", html], {
    type: "application/vnd.ms-word;charset=utf-8",
  });
  triggerDownload(blob, "handwritten-notes.doc");
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function rgbaToHex(rgba) {
  const m = rgba.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);
  if (!m) return "#ffff00";
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => parseInt(n, 10).toString(16).padStart(2, "0"))
      .join("")
  );
}

function buildElement(tag, text, { font, inkColor, hlHex, fontSize }) {
  const style = [
    `font-family:'${font}',cursive`,
    `color:${inkColor}`,
    `font-size:${fontSize}pt`,
    `background:${hlHex}`,
    `padding:2px 6px`,
    `display:inline-block`,
    `line-height:1.5`,
  ].join(";");
  return `<${tag} style="${style}">${escapeHtml(text)}</${tag}>\n`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
