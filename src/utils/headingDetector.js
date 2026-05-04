import nlp from "compromise";

/**
 * Color theme:
 * - Main headings (H1): Green
 * - Sub headings (H2): Dark Orange
 */
const HEADING_STYLES = {
  main: "color: #008000; font-weight: 700; font-size: 28px; margin: 18px 0 10px;",
  sub: "color: #FF8C00; font-weight: 700; font-size: 22px; margin: 14px 0 8px;",
};

/**
 * Detects only TRUE headings (lines that are section headers, not definitions).
 *
 * Main Heading Detection (Return "main"): GREEN (#008000)
 *   - Markdown: Starts with "### " (e.g., "### **Summary**")
 *   - NLP: Known sections like "Core Concepts", "Keywords", "FAQ" (after blank line)
 *
 * Sub Heading Detection (Return "sub"): DARK ORANGE (#FF8C00)
 *   - Markdown: Starts with "## " (e.g., "## **Sub Section**")
 *   - NLP: Short phrases (≤ 2 words) after blank line or longer phrases without verbs
 *
 * NOT Headings (handled elsewhere):
 *   - Definition lists: "Term: description" or "**Term**: description"
 *   - Bullet points: "- **Term**: description"
 */
export function isHeadingLine(text, prevLine) {
  if (!text) return false;

  // ### **Main Section** - Markdown H3 with bold for main headings (GREEN)
  if (text.startsWith("### ")) {
    return "main";
  }

  // ## **Sub Section** - Markdown H2 for sub-headings (DARK ORANGE)
  if (text.startsWith("## ")) {
    return "sub";
  }

  // NLP-based heading detection (original logic)
  const prevIsBlank = prevLine === undefined || prevLine.trim() === "";
  if (!prevIsBlank) return false;

  // Lines with colon are definitions, not headings
  if (text.includes(":")) return false;

  // Lines starting with bullet/dash are not headings
  if (text.startsWith("-")) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;
  if (text.length > 55) return false;
  if (!/^[A-Z\d]/.test(text)) return false;
  if (/[.,;!?]$/.test(text)) return false;

  // Known major sections
  const mainHeadings = ["Core Concepts", "Keywords", "FAQ", "Summary"];
  if (mainHeadings.includes(text.trim())) return "main";

  // Short phrases (≤ 2 words): likely sub-heading
  if (words.length <= 2) return "sub";

  // Longer phrases: no verbs
  return nlp(text).verbs().length === 0 ? "sub" : false;
}

/**
 * Detect "Term: description" definition-list lines with bold formatting support.
 * Formats:
 *   - Plain: "WebSocket: A full-duplex communication protocol..."
 *   - Bold: "**WebSocket**: A full-duplex communication protocol..."
 *   - Questions: "Q: Why use WebSocket instead of HTTP polling?"
 */
export function parseDefinition(text) {
  let cleanText = text;

  // Remove bold markers (**text**) for parsing
  const boldMatch = text.match(/^\*\*([^*]+)\*\*:/);
  if (boldMatch) {
    cleanText = text.replace(/\*\*/g, "");
  }

  const colonIdx = cleanText.indexOf(":");
  if (colonIdx < 1 || colonIdx > 42) return null;

  const term = cleanText.slice(0, colonIdx).trim();
  const desc = cleanText.slice(colonIdx + 1).trim();
  if (!desc) return null;

  const termWords = term.split(/\s+/).filter(Boolean);
  if (termWords.length < 1 || termWords.length > 6) return null;
  if (!/^[A-Z\d]/.test(term)) return null;

  return { term, desc };
}

/**
 * Converts plain text into styled HTML with proper hierarchy:
 * 1. Check for Markdown headings (### and ##)
 * 2. Check for definition lists (Term: description) - FIRST to prevent definitions as headings
 * 3. Check for NLP-detected headings
 * 4. Default to paragraph
 *
 * Color Scheme:
 * - Main headings (###, NLP main): GREEN (#008000)
 * - Sub headings (##, NLP sub): DARK ORANGE (#FF8C00)
 * - Definitions: Bold term (not colored) + normal description
 */
export function formatContent(lines) {
  let html = "";

  lines.forEach((line, index) => {
    const prevLine = index > 0 ? lines[index - 1] : "";
    const trimmedLine = line.trim();

    // 1. Markdown main heading: ### **Summary**
    if (trimmedLine.startsWith("### ")) {
      const content = trimmedLine.slice(4).replace(/\*\*/g, "").trim();
      html += `<h1 style="${HEADING_STYLES.main}">${content}</h1>`;
      return;
    }

    // 2. Markdown sub heading: ## **SubSection**
    if (trimmedLine.startsWith("## ")) {
      const content = trimmedLine.slice(3).replace(/\*\*/g, "").trim();
      html += `<h2 style="${HEADING_STYLES.sub}">${content}</h2>`;
      return;
    }

    // 3. Definition Parsing FIRST: "**Term**: description" or "- **Term**: description"
    // This prevents definitions from being treated as headings
    const def = parseDefinition(trimmedLine);
    if (def) {
      // Remove bullet point if present
      const cleanTerm = def.term.replace(/^-\s*/, "").trim();
      html += `
        <div style="margin-bottom: 10px; line-height: 1.6;">
          <strong>${cleanTerm}:</strong> ${def.desc}
        </div>
      `;
      return;
    }

    // 4. NLP-based heading detection (only if not a definition)
    const headingType = isHeadingLine(trimmedLine, prevLine);

    if (headingType === "main") {
      html += `<h1 style="${HEADING_STYLES.main}">${trimmedLine}</h1>`;
      return;
    }

    if (headingType === "sub") {
      const content = trimmedLine.replace(/\*\*/g, "").trim();
      html += `<h2 style="${HEADING_STYLES.sub}">${content}</h2>`;
      return;
    }

    // 5. Default paragraph (remove ** markers)
    const cleanedLine = line.replace(/\*\*/g, "");
    html += `<p style="margin: 8px 0; line-height: 1.6;">${cleanedLine}</p>`;
  });

  return html;
}
