import { useState, useEffect, useCallback } from "react";

import {
  FONTS,
  PAPER_COLORS,
  INK_COLORS,
  HIGHLIGHT_COLORS,
  SAMPLE_TEXT,
  GOOGLE_FONTS_URL,
  JSPDF_CDN,
  CANVAS_H,
} from "./constants";

import { renderAllPages } from "./utils/renderCanvas";
import { downloadPDF, downloadWord, downloadPNG } from "./utils/downloads";

import Sidebar from "./components/Sidebar";
import CanvasPreview from "./components/CanvasPreview";

const ROOT_STYLE = {
  display: "flex",
  height: "100vh",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  background: "#13192b",
  color: "#e8e4dc",
  overflow: "hidden",
};

const TAB_BAR = {
  display: "flex",
  background: "#1a2236",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  flexShrink: 0,
};

const tabBtn = (active) => ({
  flex: 1,
  padding: "13px",
  border: "none",
  background: "none",
  color: active ? "#4a7eff" : "#5a7090",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  borderBottom: active ? "2px solid #4a7eff" : "2px solid transparent",
  cursor: "pointer",
});

const GLOBAL_CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  input[type=range]::-webkit-slider-thumb {
    appearance: none; width: 14px; height: 14px;
    border-radius: 50%; background: #4a7eff; cursor: pointer;
  }
  canvas { max-width: 100%; height: auto; }
`;

export default function HandwritingNotes() {
  // ── State ────────────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("settings");
  const [text, setText] = useState(SAMPLE_TEXT);
  const [title, setTitle] = useState("Study Notes");
  const [showTitle, setShowTitle] = useState(true);
  const [font, setFont] = useState(FONTS[0]);
  const [paperStyle, setPaperStyle] = useState("ruled");
  const [paperColor, setPaperColor] = useState(PAPER_COLORS[0]);
  const [inkColor, setInkColor] = useState(INK_COLORS[0].color);
  const [hlColor, setHlColor] = useState(HIGHLIGHT_COLORS[0].color);
  const [fontSize, setFontSize] = useState(24);
  const [pageHeight, setPageHeight] = useState(CANVAS_H);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [pages, setPages] = useState([]);

  // ── Mobile detection ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // ── Load fonts + jsPDF ───────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = GOOGLE_FONTS_URL;
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = JSPDF_CDN;
    document.head.appendChild(script);

    const fallback = setTimeout(() => setReady(true), 2500);
    document.fonts.ready.then(() => {
      clearTimeout(fallback);
      setReady(true);
    });

    return () => {
      try {
        document.head.removeChild(link);
      } catch (_) {}
      try {
        document.head.removeChild(script);
      } catch (_) {}
    };
  }, []);

  // ── Build render options from current state ───────────────────────────────
  const getRenderOpts = useCallback(
    () => ({
      text,
      title,
      showTitle,
      font: font.family,
      fontWeight: font.weight,
      paperStyle,
      paperBg: paperColor.bg,
      lineColor: paperColor.line,
      inkColor,
      hlColor,
      fontSize,
      canvasH: pageHeight,
    }),
    [
      text,
      title,
      showTitle,
      font,
      paperStyle,
      paperColor,
      inkColor,
      hlColor,
      fontSize,
      pageHeight,
    ]
  );

  // ── Generate ─────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    if (!ready) return;
    setStatus("rendering");
    setTimeout(() => {
      const canvases = renderAllPages(getRenderOpts());
      setPages(canvases);
      setStatus("done");
    }, 60);
  }, [ready, getRenderOpts]);

  // Auto-render once fonts are ready
  useEffect(() => {
    if (ready) generate();
  }, [ready]); // eslint-disable-line

  // ── Download handlers ────────────────────────────────────────────────────
  const handlePNG = () => downloadPNG(pages);
  const handlePDF = async () => downloadPDF(getRenderOpts());
  const handleWord = () => downloadWord(getRenderOpts());

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={ROOT_STYLE}>
      <style>{GLOBAL_CSS}</style>

      <Sidebar
        title={title}
        setTitle={setTitle}
        showTitle={showTitle}
        setShowTitle={setShowTitle}
        text={text}
        setText={setText}
        font={font}
        setFont={setFont}
        paperStyle={paperStyle}
        setPaperStyle={setPaperStyle}
        paperColor={paperColor}
        setPaperColor={setPaperColor}
        inkColor={inkColor}
        setInkColor={setInkColor}
        hlColor={hlColor}
        setHlColor={setHlColor}
        fontSize={fontSize}
        setFontSize={setFontSize}
        pageHeight={pageHeight}
        setPageHeight={setPageHeight}
        ready={ready}
        status={status}
        onGenerate={generate}
        onPNG={handlePNG}
        onPDF={handlePDF}
        onWord={handleWord}
      />

      <CanvasPreview
        status={status}
        fontFamily={font.family}
        paperStyle={paperStyle}
        pages={pages}
      />
    </div>
  );
}
