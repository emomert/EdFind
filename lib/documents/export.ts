/**
 * Client-side export helpers for the document studio (PDF via print dialog).
 *
 * PDF strategy: open a print window with the document rendered as clean HTML
 * and let the browser's "Save as PDF" do the layout — zero dependencies, and
 * the output respects A4 margins. The markdown renderer below intentionally
 * supports only what our drafting prompts emit (headings, bold/italic,
 * bullet lists, hr, paragraphs); it is not a general-purpose parser.
 */

/** Matches bracketed placeholders the AI inserts for missing facts. */
const PLACEHOLDER_RE = /\[([^\[\]\n]{1,60}?)\]/g;

/** Unique placeholder tokens (inner text, without brackets), in order. */
export function extractPlaceholders(content: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of content.matchAll(PLACEHOLDER_RE)) {
    const token = match[1].trim();
    if (token && !seen.has(token)) {
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

/** Replace `[token]` occurrences with filled values; empty values keep the placeholder. */
export function applyPlaceholders(
  content: string,
  values: Readonly<Record<string, string>>,
): string {
  return content.replace(PLACEHOLDER_RE, (whole, token: string) => {
    const v = values[token.trim()]?.trim();
    return v ? v : whole;
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline markdown: bold, italic. Input must already be HTML-escaped. */
function renderInline(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

/** Render the constrained markdown our prompts emit into print-ready HTML. */
export function markdownToPrintHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let listOpen = false;
  let paragraph: string[] = [];

  const closeList = () => {
    if (listOpen) {
      out.push("</ul>");
      listOpen = false;
    }
  };
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${renderInline(paragraph.join("<br />"))}</p>`);
      paragraph = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    const escaped = escapeHtml(trimmed);

    if (trimmed === "") {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(escapeHtml(heading[2]))}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      closeList();
      out.push("<hr />");
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!listOpen) {
        out.push("<ul>");
        listOpen = true;
      }
      out.push(`<li>${renderInline(escapeHtml(bullet[1]))}</li>`);
      continue;
    }
    // HTML comments from the prompt's "regenerate" hint — drop in print.
    if (/^<!--.*-->$/.test(trimmed)) continue;
    paragraph.push(escaped);
  }
  flushParagraph();
  closeList();
  return out.join("\n");
}

/**
 * Open a print window with the document and trigger the print dialog (the
 * user picks "Save as PDF" there). Returns false when the popup is blocked.
 */
export function printDocumentAsPdf(title: string, markdown: string): boolean {
  const w = window.open("", "_blank", "noopener,width=900,height=1100");
  if (!w) return false;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    color: #1f2937;
    font-size: 11.5pt;
    line-height: 1.55;
    max-width: 175mm;
    margin: 0 auto;
    padding: 24px;
  }
  h1 { font-size: 19pt; margin: 0 0 2pt; letter-spacing: 0.2px; }
  h2 {
    font-size: 12.5pt; text-transform: uppercase; letter-spacing: 1px;
    border-bottom: 1.2px solid #9ca3af; padding-bottom: 2pt;
    margin: 14pt 0 6pt;
  }
  h3 { font-size: 11.5pt; margin: 10pt 0 3pt; }
  h4 { font-size: 11pt; margin: 8pt 0 2pt; }
  p { margin: 0 0 7pt; }
  ul { margin: 0 0 8pt; padding-left: 16pt; }
  li { margin-bottom: 3pt; }
  hr { border: none; border-top: 1px solid #d1d5db; margin: 10pt 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
${markdownToPrintHtml(markdown)}
<script>
  window.addEventListener("load", function () {
    setTimeout(function () { window.print(); }, 150);
  });
</script>
</body>
</html>`;

  w.document.write(html);
  w.document.close();
  return true;
}
