import { INK_COLORS, HIGHLIGHT_COLORS } from "../constants";
import { token, roundSwatch, hlSwatch } from "../utils/theme";

export default function ColorSettings({
  inkColor,
  setInkColor,
  hlColor,
  setHlColor,
}) {
  return (
    <>
      <div style={token.section}>
        <span style={token.lbl}>Ink Color</span>
        <div style={token.colorRow}>
          {INK_COLORS.map((ic) => (
            <div
              key={ic.color}
              title={ic.label}
              style={roundSwatch(ic.color, inkColor === ic.color)}
              onClick={() => setInkColor(ic.color)}
            />
          ))}
        </div>
      </div>

      <div style={token.section}>
        <span style={token.lbl}>Heading Highlight</span>
        <div style={token.colorRow}>
          {HIGHLIGHT_COLORS.map((hc) => (
            <div
              key={hc.color}
              title={hc.label}
              style={hlSwatch(hc.solid, hlColor === hc.color)}
              onClick={() => setHlColor(hc.color)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
