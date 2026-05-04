import TitleSection from "./TitleSection";
import TextSection from "./TextSection";
import FontSelector from "./FontSelector";
import PaperSettings from "./PaperSettings";
import ColorSettings from "./ColorSettings";
import SizeSlider from "./SizeSlider";
import DownloadBar from "./DownloadBar";

const S = {
  aside: {
    width: 420,
    minWidth: 380,
    background: "#1a2236",
    borderRight: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "18px 22px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 21,
    fontWeight: 500,
    color: "#f0ead8",
    margin: 0,
  },
  tagline: {
    fontSize: 10,
    color: "#5a7090",
    marginTop: 2,
    letterSpacing: "0.8px",
  },
  scroll: { flex: 1, overflowY: "auto", padding: "16px 22px" },
  footer: {
    padding: "12px 22px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 7,
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
};

export default function Sidebar({
  // state
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
  // actions
  ready,
  status,
  onGenerate,
  onPNG,
  onPDF,
  onWord,
}) {
  return (
    <aside style={S.aside}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.logo}>✒ HandNotes</h1>
        <p style={S.tagline}>TEXT TO HANDWRITING CONVERTER</p>
      </div>

      {/* Scrollable controls */}
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

      {/* Footer: generate + downloads */}
      <div style={S.footer}>
        <button
          style={S.genBtn(status === "rendering")}
          onClick={onGenerate}
          disabled={!ready || status === "rendering"}
        >
          {status === "rendering"
            ? "Rendering…"
            : !ready
              ? "Loading fonts…"
              : "✦ Generate"}
        </button>
        <DownloadBar
          visible={status === "done"}
          onPNG={onPNG}
          onPDF={onPDF}
          onWord={onWord}
        />
      </div>
    </aside>
  );
}
