import type { ReactNode } from "react";

function escapeMarkdownLinkLabel(value: string) {
  return value.replace(/([\\[\]])/g, "\\$1");
}

export function formatAIMarkdown(value: string) {
  return value
    .replace(/\+\+([^+\n]+?)\+\+/g, (_, content: string) => `[${escapeMarkdownLinkLabel(content)}](#sobi-underline)`)
    .replace(/==([^=\n]+?)==/g, (_, content: string) => `[${escapeMarkdownLinkLabel(content)}](#sobi-highlight)`);
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
