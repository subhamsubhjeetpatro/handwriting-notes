import { useState } from "react";

const S = {
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 6,
  },
  btn: (loading) => ({
    padding: "10px 4px",
    borderRadius: 7,
    background: loading ? "rgba(74,126,255,0.08)" : "rgba(255,255,255,0.06)",
    border: `1px solid ${loading ? "rgba(74,126,255,0.3)" : "rgba(255,255,255,0.12)"}`,
    color: loading ? "#6a9aff" : "#c0c8d8",
    fontSize: 11,
    fontWeight: 600,
    cursor: loading ? "default" : "pointer",
    textAlign: "center",
    transition: "all 0.15s",
  }),
};

function DownloadButton({ label, onClick }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onClick();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button style={S.btn(loading)} onClick={handleClick}>
      {loading ? "…" : `↓ ${label}`}
    </button>
  );
}

/**
 * @param {{ onPNG: () => void, onPDF: () => Promise<void>, onWord: () => void, visible: boolean }} props
 */
export default function DownloadBar({ onPNG, onPDF, onWord, visible }) {
  if (!visible) return null;

  return (
    <div style={S.row}>
      <DownloadButton label="PNG" onClick={async () => onPNG()} />
      <DownloadButton label="PDF" onClick={onPDF} />
      <DownloadButton label="Word" onClick={async () => onWord()} />
    </div>
  );
}
