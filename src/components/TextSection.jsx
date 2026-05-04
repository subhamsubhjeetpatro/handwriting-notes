import { token } from "../utils/theme";

const S = {
  textarea: {
    width: "100%",
    minHeight: 300,
    maxHeight: 600,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    color: "#d0ccc4",
    fontSize: 13,
    lineHeight: 1.7,
    resize: "vertical",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: 10,
    color: "#4a6080",
    marginTop: 6,
    lineHeight: 1.6,
  },
  code: { color: "#8ab4ff" },
};

export default function TextSection({ text, setText }) {
  return (
    <div style={token.section}>
      <span style={token.lbl}>Your Text</span>
      <textarea
        style={S.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={15}
      />
      <p style={S.hint}>
        💡 Use <code style={S.code}>### **Section**</code> for main headings
        (GREEN) · <code style={S.code}>## **Sub**</code> for sub-headings (DARK
        ORANGE) · <code style={S.code}>**bold**</code> for emphasis · Use{" "}
        <code style={S.code}>Term: description</code> for definitions.
      </p>
    </div>
  );
}
