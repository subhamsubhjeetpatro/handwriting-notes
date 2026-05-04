import { CANVAS_W, CANVAS_H } from "../constants";
import { isHeadingLine, parseDefinition } from "./headingDetector";

/**
 * Parse a raw text line with markdown symbol support and proper hierarchy.
 * Priority:
 * 1. Markdown headings (###, ##, #)
 * 2. Definition lists (Term: description) - prevents definitions as headings
 * 3. NLP-detected headings
 * 4. Regular text
 *
 * Returns one of:
 *   { type: "h1",  text }              "###" or "#" (GREEN - main heading)
 *   { type: "h2",  text }              "##" (DARK ORANGE - sub heading)
 *   { type: "def", term, desc }       "Term: description" (bold term only)
 *   { type: "p",   text }              Regular paragraph or **bold** text
 */
export function parseLine(line, prevLine) {
  // 1. Markdown main heading: ### **text** or # text
  if (line.startsWith("### ")) {
    const text = line.slice(4).replace(/\*\*/g, "").trim();
    return { type: "h1", text };
  }
  if (line.startsWith("# ")) {
    return { type: "h1", text: line.slice(2).replace(/\*\*/g, "").trim() };
  }

  // 2. Markdown sub heading: ## **text** or ## text
  if (line.startsWith("## ")) {
    const text = line.slice(3).replace(/\*\*/g, "").trim();
    return { type: "h2", text };
  }

  const trimmed = line.trim();
  if (!trimmed) return { type: "p", text: line };

  // 3. Definition list item FIRST: "Term: description" or "**Term**: description"
  // This prevents definitions from being treated as headings
  const def = parseDefinition(trimmed);
  if (def) {
    const cleanTerm = def.term.replace(/^-\s*/, "").trim();
    return { type: "def", term: cleanTerm, desc: def.desc };
  }

  // 4. NLP-based heading detection (only if not a definition)
  const headingType = isHeadingLine(trimmed, prevLine);
  if (headingType === "main")
    return { type: "h1", text: trimmed.replace(/\*\*/g, "").trim() };
  if (headingType === "sub")
    return { type: "h2", text: trimmed.replace(/\*\*/g, "").trim() };

  return { type: "p", text: line };
}

/** Deterministic PRNG — same seed always produces the same jitter sequence */
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff - 0.5;
  };
}

/**
 * Render one page of content onto canvas starting from startLineIndex.
 * Handles high-DPI displays for sharp, non-blurry text rendering.
 * Returns the index of the next unrendered line (pass to next page).
 */
export function renderCanvas(canvas, opts, startLineIndex = 0) {
  const {
    text,
    title,
    showTitle,
    font,
    fontWeight,
    paperStyle,
    paperBg,
    lineColor,
    inkColor,
    hlColor,
    fontSize,
  } = opts;

  // High-DPI Display Support: Scale canvas by device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  const ctx = canvas.getContext("2d");
  const W = CANVAS_W * dpr;
  const H = (opts.canvasH ?? CANVAS_H) * dpr;

  // Scale drawing context to maintain proper coordinates
  ctx.scale(dpr, dpr);

  // Use logical dimensions for coordinates
  const logicalW = CANVAS_W;
  const logicalH = opts.canvasH ?? CANVAS_H;
  const lh = fontSize * 1.92;
  const mL = 68;
  const mR = 36;
  const isFirstPage = startLineIndex === 0;
  const mTop = isFirstPage && showTitle && title ? lh * 3.1 : lh * 2.2;
  const tX =
    paperStyle === "ruled" || paperStyle === "wide" ? mL + 16 : mL - 10;
  const maxW = logicalW - tX - mR;
  const rand = seededRand(7 + startLineIndex);

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = paperBg;
  ctx.fillRect(0, 0, logicalW, logicalH);

  for (let y = 0; y < logicalH; y += 4) {
    ctx.fillStyle = `rgba(120,100,80,${(0.01 + Math.abs(rand()) * 0.006).toFixed(4)})`;
    ctx.fillRect(0, y, logicalW, 2);
  }

  // ── Paper lines ───────────────────────────────────────────────────────────
  drawPaperLines(ctx, {
    paperStyle,
    lineColor,
    mL,
    mTop,
    W: logicalW,
    H: logicalH,
    lh,
    fontSize,
  });

  // ── Text ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = inkColor;
  ctx.textBaseline = "alphabetic";

  // Title only on first page
  if (isFirstPage && showTitle && title) {
    const fsT = Math.round(fontSize * 1.4);
    ctx.font = `${fontWeight} ${fsT}px "${font}"`;
    const tw = ctx.measureText(title).width;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = hlColor;
    ctx.fillRect(tX - 6, lh * 1.7 - fsT + 1, tw + 12, fsT + 10);
    ctx.restore();
    ctx.fillStyle = inkColor;
    ctx.fillText(title, tX, lh * 1.7 + 4);
  }

  const lines = text.split("\n");
  let curY = mTop - 3;
  let i = startLineIndex;
  const cfg = {
    font,
    fontWeight,
    fontSize,
    inkColor,
    hlColor,
    tX,
    maxW,
    lh,
    H: logicalH,
    rand,
  };

  for (; i < lines.length; i++) {
    if (curY > logicalH - 20) break;
    const raw = lines[i];
    const prev = i > 0 ? lines[i - 1] : undefined;
    const p = parseLine(raw, prev);

    if (p.type === "h1") curY = drawH1(ctx, p.text, curY + lh * 0.45, cfg);
    else if (p.type === "h2") curY = drawH2(ctx, p.text, curY + lh * 0.28, cfg);
    else if (p.type === "def")
      curY = drawDefinition(ctx, p.term, p.desc, curY, cfg);
    else if (!raw.trim()) curY += lh * 0.55;
    else curY = drawParagraph(ctx, p.text, curY, cfg);
  }

  return i;
}

/**
 * Render all pages. Returns an array of HTMLCanvasElement.
 * Automatically scales canvas for high-DPI displays for sharp text rendering.
 */
export function renderAllPages(opts) {
  const lines = opts.text.split("\n");
  const canvasH = opts.canvasH ?? CANVAS_H;
  const dpr = window.devicePixelRatio || 1;
  const canvases = [];
  let startIndex = 0;

  do {
    const canvas = document.createElement("canvas");
    // Set physical size (high-DPI aware)
    canvas.width = CANVAS_W * dpr;
    canvas.height = canvasH * dpr;
    // Set display size (CSS size)
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${canvasH}px`;

    const endIndex = renderCanvas(canvas, opts, startIndex);
    canvases.push(canvas);
    if (endIndex === startIndex) break;
    startIndex = endIndex;
  } while (startIndex < lines.length);

  return canvases;
}

// ── Heading renderers ─────────────────────────────────────────────────────────

/**
 * H1 — large text + left accent bar + solid underline stroke.
 */
function drawH1(ctx, rawText, startY, cfg) {
  const { font, fontWeight, fontSize, inkColor, hlColor, tX, maxW, H } = cfg;
  const fsH = Math.round(fontSize * 1.44);
  ctx.font = `${fontWeight} ${fsH}px "${font}"`;

  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  const flush = (l, yy) => {
    const tw = ctx.measureText(l).width;

    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = hlColor;
    ctx.fillRect(tX - 10, yy - fsH - 2, tw + 20, fsH + 12);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = inkColor;
    ctx.fillRect(tX - 14, yy - fsH - 2, 3, fsH + 12);
    ctx.restore();

    ctx.fillStyle = inkColor;
    ctx.fillText(l, tX, yy + 3);

    ctx.save();
    ctx.globalAlpha = 0.68;
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tX - 10, yy + 8);
    ctx.lineTo(tX + tw + 10, yy + 8);
    ctx.stroke();
    ctx.restore();
  };

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
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

/**
 * H2 — medium text + dashed underline.
 */
const H2_COLOR = "#1a7a3c"; // green for all subheadings

function drawH2(ctx, rawText, startY, cfg) {
  const { font, fontWeight, fontSize, tX, maxW, H } = cfg;
  const fsH = Math.round(fontSize * 1.18);
  const indX = tX + 6;
  const indW = maxW - 6;
  ctx.font = `${fontWeight} ${fsH}px "${font}"`;

  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  const flush = (l, yy) => {
    const tw = ctx.measureText(l).width;
    ctx.fillStyle = H2_COLOR;
    ctx.fillText(l, indX, yy + 3);

    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.strokeStyle = H2_COLOR;
    ctx.lineWidth = 1.3;
    ctx.lineCap = "round";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(indX, yy + 8);
    ctx.lineTo(indX + tw, yy + 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  };

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > indW && line) {
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

/**
 * Definition item — "Term: description" rendered as:
 *   [Term underlined]:  description continues on same line, wraps at left margin
 *
 * Matches "WebSocket: A full-duplex…", "Q: Why use…", "Use Cases: …"
 */
function drawDefinition(ctx, term, desc, startY, cfg) {
  const { font, fontWeight, fontSize, inkColor, tX, maxW, lh, H, rand } = cfg;

  // Measure "Term: " using the bold weight (term is rendered bold-ish)
  ctx.font = `${fontWeight} ${fontSize}px "${font}"`;
  const termLabel = `${term}: `;
  const termW = ctx.measureText(termLabel).width;

  ctx.fillStyle = inkColor;
  ctx.fillText(termLabel, tX, startY + 3);

  // Underline just the term word(s), not the colon-space
  const termOnly = `${term}`;
  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 1.0;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tX, startY + 8);
  ctx.lineTo(tX + ctx.measureText(termOnly).width, startY + 8);
  ctx.stroke();
  ctx.restore();

  // Render description — first portion on same line after the term
  ctx.font = `${fontSize}px "${font}"`;
  const words = desc.split(" ");
  let line = "";
  let y = startY;
  let firstLine = true;

  for (const w of words) {
    if (y > H - 20) break;
    const test = line ? `${line} ${w}` : w;
    const lineMax = firstLine ? maxW - termW : maxW;

    if (ctx.measureText(test).width > lineMax && line) {
      ctx.fillStyle = inkColor;
      ctx.fillText(line, firstLine ? tX + termW : tX, y + rand() * 0.8 + 3);
      firstLine = false;
      line = w;
      y += lh;
    } else {
      line = test;
    }
  }

  if (line && y <= H - 20) {
    ctx.fillStyle = inkColor;
    ctx.fillText(line, firstLine ? tX + termW : tX, y + rand() * 0.8 + 3);
    y += lh;
  }

  return y;
}

// ── Private helpers ───────────────────────────────────────────────────────────

function drawPaperLines(
  ctx,
  { paperStyle, lineColor, mL, mTop, W, H, lh, fontSize }
) {
  if (paperStyle === "ruled" || paperStyle === "wide") {
    const sp = paperStyle === "wide" ? fontSize * 2.3 : lh;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.75;
    for (let y = mTop; y <= H - 20; y += sp) {
      ctx.beginPath();
      ctx.moveTo(26, y);
      ctx.lineTo(W - 18, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(220,140,140,0.65)";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(mL, 26);
    ctx.lineTo(mL, H - 18);
    ctx.stroke();
  } else if (paperStyle === "grid") {
    const gs = Math.max(18, Math.round(fontSize * 0.82));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.45;
    for (let y = 0; y <= H; y += gs) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x <= W; x += gs) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  } else if (paperStyle === "dotted") {
    const ds = Math.max(20, Math.round(fontSize * 0.9));
    ctx.fillStyle = lineColor;
    for (let y = ds; y <= H; y += ds)
      for (let x = ds; x <= W; x += ds) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
  }
}

function drawParagraph(ctx, rawText, startY, cfg) {
  const { font, fontSize, inkColor, tX, maxW, lh, H, rand } = cfg;
  if (!rawText.trim()) return startY + lh * 0.55;

  ctx.font = `${fontSize}px "${font}"`;
  const words = rawText.split(" ");
  let line = "";
  let y = startY;

  for (const w of words) {
    if (y > H - 20) break;
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.font = `${fontSize + rand() * 0.9}px "${font}"`;
      ctx.fillStyle = inkColor;
      ctx.fillText(line, tX, y + rand() * 1.5);
      line = w;
      y += lh;
    } else {
      line = test;
    }
  }
  if (line && y <= H - 20) {
    ctx.font = `${fontSize + rand() * 0.9}px "${font}"`;
    ctx.fillStyle = inkColor;
    ctx.fillText(line, tX, y + rand() * 1.5);
    y += lh;
  }
  return y;
}
