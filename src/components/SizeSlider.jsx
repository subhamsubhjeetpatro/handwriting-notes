import { token } from "../utils/theme";

const S = {
  row: { display: "flex", alignItems: "center", gap: 10 },
  slider: {
    flex: 1,
    appearance: "none",
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.12)",
    outline: "none",
    cursor: "pointer",
  },
  value: { fontSize: 12, color: "#5a7090", minWidth: 30, textAlign: "right" },
};

export default function SizeSlider({ fontSize, setFontSize }) {
  return (
    <div style={token.section}>
      <span style={token.lbl}>Font Size</span>
      <div style={S.row}>
        <input
          type="range"
          min={16}
          max={36}
          step={1}
          value={fontSize}
          style={S.slider}
          onChange={(e) => setFontSize(Number(e.target.value))}
        />
        <span style={S.value}>{fontSize}px</span>
      </div>
    </div>
  );
}
