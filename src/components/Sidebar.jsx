import TitleSection from "./TitleSection";
import TextSection from "./TextSection";
import FontSelector from "./FontSelector";
import PaperSettings from "./PaperSettings";
import ColorSettings from "./ColorSettings";
import SizeSlider from "./SizeSlider";
import DownloadBar from "./DownloadBar";
import { useState, useEffect } from "react";

const S = {
  mobileTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 18px",
    background: "#1a2236",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
  },

  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 21,
    fontWeight: 500,
    color: "#f0ead8",
    margin: 0,
  },

  menuBtn: {
    background: "transparent",
    border: "none",
    color: "#f0ead8",
    fontSize: 26,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  aside: (mobileOpen, isMobile) => ({
    width: isMobile ? "100%" : 420,
    maxWidth: 420,
    minWidth: 0,
    background: "#1a2236",
    position: isMobile ? "fixed" : "relative",
    top: isMobile ? 56 : 0,
    left: isMobile ? (mobileOpen ? 0 : "-100%") : 0,
    height: isMobile ? "calc(100dvh - 56px)" : "100vh", // use dvh for mobile browsers
    zIndex: 1050,
    transition: "left 0.35s ease-in-out",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRight: "1px solid rgba(255,255,255,0.07)",
  }),

  scroll: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 18px",
    paddingBottom: "20px", // remove huge bottom push
  },

  footer: {
    padding: "12px 18px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "#1a2236",
    flexShrink: 0, // prevents footer from moving off-screen
    marginTop: "auto", // pushes footer to bottom
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 1040,
  },

  genBtn: (rendering) => ({
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: rendering
      ? "#2a3a5a"
      : "linear-gradient(135deg, #4a7eff, #2a5adc)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: rendering ? "default" : "pointer",
  }),

  downloadWrap: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
};

export default function Sidebar({
  title,
  setTitle,
  showTitle,
  setShowTitle,
  text,
  setText,
  font,
  setFont,
  paperStyle,
  setPaperStyle,
  paperColor,
  setPaperColor,
  pageHeight,
  setPageHeight,
  inkColor,
  setInkColor,
  hlColor,
  setHlColor,
  fontSize,
  setFontSize,
  ready,
  status,
  onGenerate,
  onPNG,
  onPDF,
  onWord,
}) {
  const [mobileOpen, setMobileOpen] = useState(window.innerWidth > 900);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);

      if (!mobile) {
        setMobileOpen(true);
      } else {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleGenerate = () => {
    onGenerate();
    // keep sidebar accessible so download buttons remain visible
  };

  return (
    <>
      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={S.mobileTopBar}>
          <h1 style={S.logo}>✒ HandNotes</h1>

          <button
            style={S.menuBtn}
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      )}

      {/* Overlay */}
      {isMobile && mobileOpen && (
        <div style={S.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside style={S.aside(mobileOpen, isMobile)}>
        <div style={S.scroll}>
          <TitleSection
            title={title}
            setTitle={setTitle}
            showTitle={showTitle}
            setShowTitle={setShowTitle}
          />

          <TextSection text={text} setText={setText} />

          <FontSelector font={font} setFont={setFont} />

          <PaperSettings
            paperStyle={paperStyle}
            setPaperStyle={setPaperStyle}
            paperColor={paperColor}
            setPaperColor={setPaperColor}
            pageHeight={pageHeight}
            setPageHeight={setPageHeight}
          />

          <ColorSettings
            inkColor={inkColor}
            setInkColor={setInkColor}
            hlColor={hlColor}
            setHlColor={setHlColor}
          />

          <SizeSlider fontSize={fontSize} setFontSize={setFontSize} />
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button
            style={S.genBtn(status === "rendering")}
            onClick={handleGenerate}
            disabled={!ready || status === "rendering"}
          >
            {status === "rendering"
              ? "Rendering…"
              : !ready
                ? "Loading fonts…"
                : "✦ Generate"}
          </button>

          <div style={S.downloadWrap}>
            <DownloadBar
              visible={status === "done"}
              onPNG={onPNG}
              onPDF={onPDF}
              onWord={onWord}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
