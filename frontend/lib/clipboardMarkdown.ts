import { escapeHtml, formatAIMarkdownToPlainText } from "@/lib/aiMarkdown";

function normalizeClipboardMarkdown(value: string) {
  return value
    .replace(/\$\$([^$\n]+?)\$\$/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\\pi/g, "π")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\to/g, "→")
    .replace(/\\div/g, "÷")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\{([^{}]+)\}/g, "$1");
}

function formatInlineMarkdown(value: string) {
  return escapeHtml(normalizeClipboardMarkdown(value))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\+\+(.+?)\+\+/g, "<u>$1</u>")
    .replace(/==(.+?)==/g, "<mark>$1</mark>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
}

export function markdownToClipboardPlainText(markdown: string) {
  return formatAIMarkdownToPlainText(normalizeClipboardMarkdown(markdown));
}

export function markdownToClipboardHtml(markdown: string) {
  const lines = normalizeClipboardMarkdown(markdown).split(/\r?\n/);
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (/^---+$/.test(line)) {
      closeList();
      html.push("<hr />");
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${formatInlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${formatInlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${formatInlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${formatInlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${formatInlineMarkdown(line.replace(/^[-*+]\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${formatInlineMarkdown(line)}</p>`);
  }

  closeList();
  return html.join("");
}

export async function copyMarkdownToClipboard(markdown: string) {
  const plainText = markdownToClipboardPlainText(markdown);
  const html = markdownToClipboardHtml(markdown);

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html || `<p>${escapeHtml(plainText)}</p>`], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      }),
    ]);
    return;
  }

  await navigator.clipboard.writeText(plainText);
}
