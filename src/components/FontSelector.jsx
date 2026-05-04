import { FONTS } from "../constants";
import { token } from "../utils/theme";

const S = {
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 },
  btn: (active) => ({
    padding: 8,
    borderRadius: 7,
    textAlign: "center",
    cursor: "pointer",
    border: `1px solid ${active ? "rgba(74,126,255,0.55)" : "rgba(255,255,255,0.08)"}`,
    background: active ? "rgba(74,126,255,0.12)" : "rgba(255,255,255,0.03)",
  }),
  preview: (active, family) => ({
    fontSize: 17,
    fontFamily: `"${family}", cursive`,
    color: active ? "#8ab4ff" : "#b0a898",
    display: "block",
  }),
  name: {
    fontSize: 10,
    color: "#5a7090",
    marginTop: 2,
    display: "block",
  },
};

export default function FontSelector({ font, setFont }) {
  return (
    <div style={token.section}>
      <span style={token.lbl}>Handwriting Font</span>
      <div style={S.grid}>
        {FONTS.map((f) => (
          <button
            key={f.family}
            style={S.btn(font.family === f.family)}
            onClick={() => setFont(f)}
          >
            <span style={S.preview(font.family === f.family, f.family)}>
              Aa
            </span>
            <span style={S.name}>{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
