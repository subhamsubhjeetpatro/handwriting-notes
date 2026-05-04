import { token } from "../utils/theme";

const S = {
  row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  input: (disabled) => ({
    flex: 1,
    padding: "7px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6,
    color: disabled ? "#5a7090" : "#d0ccc4",
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
  }),
  toggle: (on) => ({
    width: 34,
    height: 19,
    borderRadius: 9,
    background: on ? "#4a7eff" : "rgba(255,255,255,0.12)",
    border: "none",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
  }),
  dot: (on) => ({
    position: "absolute",
    top: 2.5,
    left: on ? 17.5 : 2.5,
    width: 14,
    height: 14,
    borderRadius: 7,
    background: "#fff",
    transition: "left 0.18s",
  }),
};

export default function TitleSection({
  title,
  setTitle,
  showTitle,
  setShowTitle,
}) {
  return (
    <div style={token.section}>
      <span style={token.lbl}>Page Title</span>
      <div style={S.row}>
        <input
          style={S.input(!showTitle)}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!showTitle}
          placeholder="e.g. Study Notes"
        />
        <button
          style={S.toggle(showTitle)}
          onClick={() => setShowTitle((v) => !v)}
        >
          <div style={S.dot(showTitle)} />
        </button>
      </div>
    </div>
  );
  a;
}
