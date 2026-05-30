import type { ReactNode } from "react";

function escapeMarkdownLinkLabel(value: string) {
  return value.replace(/([\\[\]])/g, "\\$1");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatAIMarkdown(value: string) {
  return value
    .replace(/\+\+([^+\n]+?)\+\+/g, (_, content: string) => `[${escapeMarkdownLinkLabel(content)}](#sobi-underline)`)
    .replace(/==([^=\n]+?)==/g, (_, content: string) => `[${escapeMarkdownLinkLabel(content)}](#sobi-highlight)`);
}

function normalizeMarkdownLine(line: string) {
  return line
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
    .replace(/\{([^{}]+)\}/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/!\[(.*?)\]\((.+?)\)/g, "$1")
    .replace(/\+\+(.+?)\+\+/g, "$1")
    .replace(/==(.+?)==/g, "$1")
    .replace(/\s+$/g, "");
}

export function formatAIMarkdownToPlainText(value: string) {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .replace(/^\s*#{1,6}\s+(.+)$/gm, "$1")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*(\d+)\.\s+/gm, "$1. ")
    .split("\n")
    .map(normalizeMarkdownLine)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return normalized.trim();
}

export function renderAIMarkdownLink(href: string | undefined, children: ReactNode) {
  if (href === "#sobi-underline") {
    return <span className="underline decoration-2 underline-offset-4">{children}</span>;
  }

  if (href === "#sobi-highlight") {
    return <mark className="rounded-lg bg-secondary/30 px-1 text-neutral-900">{children}</mark>;
  }

  return <span>{children}</span>;
}
