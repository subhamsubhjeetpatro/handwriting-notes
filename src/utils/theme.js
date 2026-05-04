/** Shared design tokens for all sidebar sub-components */
export const token = {
  lbl: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "1.2px",
    color: "#4a6080",
    textTransform: "uppercase",
    marginBottom: 7,
    display: "block",
  },
  section: { marginBottom: 18 },
  colorRow: { display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" },
};

export const pill = (active) => ({
  padding: "6px 4px",
  borderRadius: 6,
  fontSize: 10,
  textAlign: "center",
  cursor: "pointer",
  border: `1px solid ${active ? "rgba(74,126,255,0.55)" : "rgba(255,255,255,0.08)"}`,
  background: active ? "rgba(74,126,255,0.12)" : "rgba(255,255,255,0.03)",
  color: active ? "#8ab4ff" : "#8a9aaa",
});

export const roundSwatch = (bg, active) => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: bg,
  border: `2.5px solid ${active ? "#4a7eff" : "transparent"}`,
  outline: active ? "2px solid rgba(74,126,255,0.3)" : "none",
  cursor: "pointer",
  boxSizing: "border-box",
});

export const squareSwatch = (bg, active) => ({
  width: 26,
  height: 26,
  borderRadius: 5,
  background: bg,
  border: `2px solid ${active ? "#4a7eff" : "rgba(255,255,255,0.2)"}`,
  cursor: "pointer",
  boxSizing: "border-box",
});

export const hlSwatch = (bg, active) => ({
  width: 26,
  height: 26,
  borderRadius: 4,
  background: bg,
  border: `2.5px solid ${active ? "#4a7eff" : "transparent"}`,
  outline: active ? "2px solid rgba(74,126,255,0.3)" : "none",
  cursor: "pointer",
  boxSizing: "border-box",
});
