import { useRef, useEffect } from "react";

const S = {
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflow: "auto",
    padding: "28px 36px",
  },
  pagesWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(19,25,43,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  spinner: {
    width: 38,
    height: 38,
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #4a7eff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  status: {
    marginTop: 13,
    fontSize: 11,
    color: "#4a6080",
    letterSpacing: "0.5px",
  },
};

export default function CanvasPreview({
  status,
  fontFamily,
  paperStyle,
  pages,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pages.length) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    pages.forEach((canvas, idx) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 4px 16px rgba(0,0,0,0.4);border-radius:2px";
      wrap.appendChild(canvas);

      if (pages.length > 1) {
        const num = document.createElement("span");
        num.textContent = `${idx + 1} / ${pages.length}`;
        num.style.cssText =
          "position:absolute;bottom:8px;right:12px;font-size:9px;color:rgba(80,100,120,0.6);user-select:none;font-family:sans-serif";
        wrap.appendChild(num);
      }

      container.appendChild(wrap);
    });
  }, [pages]);

  return (
    <main style={S.main}>
      {status === "rendering" && (
        <div style={S.overlay}>
          <div style={S.spinner} />
        </div>
      )}

      <div ref={containerRef} style={S.pagesWrap} />

      {status === "done" && (
        <p style={S.status}>
          {`✓ Rendered · ${pages.length} page${pages.length !== 1 ? "s" : ""} · ${fontFamily} · ${paperStyle}`}
        </p>
      )}
    </main>
  );
}
