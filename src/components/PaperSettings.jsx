import { PAPER_STYLES, PAPER_COLORS } from "../constants";
import { token, pill, squareSwatch } from "../utils/theme";

const S = {
  grid:        { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 },
  presetRow:   { display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" },
  sliderRow:   { display: "flex", alignItems: "center", gap: 10 },
  sliderInput: {
    flex: 1, appearance: "none", height: 4, borderRadius: 2,
    background: "rgba(255,255,255,0.12)", outline: "none", cursor: "pointer",
  },
  sliderVal:   { fontSize: 12, color: "#5a7090", minWidth: 48, textAlign: "right" },
};

const PAGE_PRESETS = [
  { label: "A5",     h: 620  },
  { label: "A4",     h: 878  },
  { label: "Letter", h: 950  },
  { label: "Legal",  h: 1140 },
];

export default function PaperSettings({
  paperStyle, setPaperStyle,
  paperColor, setPaperColor,
  pageHeight, setPageHeight,
}) {
  return (
    <>
      <div style={token.section}>
        <span style={token.lbl}>Paper Style</span>
        <div style={S.grid}>
          {PAPER_STYLES.map((p) => (
            <button
              key={p.id}
              style={pill(paperStyle === p.id)}
              onClick={() => setPaperStyle(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={token.section}>
        <span style={token.lbl}>Paper Color</span>
        <div style={token.colorRow}>
          {PAPER_COLORS.map((pc) => (
            <div
              key={pc.id}
              title={pc.label}
              style={squareSwatch(pc.bg, paperColor.id === pc.id)}
              onClick={() => setPaperColor(pc)}
            />
          ))}
        </div>
      </div>

      <div style={token.section}>
        <span style={token.lbl}>Page Size</span>
        <div style={S.presetRow}>
          {PAGE_PRESETS.map((p) => (
            <button
              key={p.label}
              style={pill(pageHeight === p.h)}
              onClick={() => setPageHeight(p.h)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={S.sliderRow}>
          <input
            type="range"
            min={500}
            max={1600}
            step={50}
            value={pageHeight}
            style={S.sliderInput}
            onChange={(e) => setPageHeight(Number(e.target.value))}
          />
          <span style={S.sliderVal}>{pageHeight}px</span>
        </div>
      </div>
    </>
  );
}
