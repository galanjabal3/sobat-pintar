"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { formatAIMarkdown, renderAIMarkdownLink } from "@/lib/aiMarkdown";

type AIMarkdownProps = {
  children: string;
  className?: string;
  components?: Components;
};

const baseComponents: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-black text-neutral-900">{children}</strong>,
  em: ({ children }) => <em className="italic font-semibold">{children}</em>,
  del: ({ children }) => <del className="text-neutral-500 decoration-2">{children}</del>,
  a: ({ href, children }) => renderAIMarkdownLink(href, children),
  code: ({ children, ...props }) =>
    (props as { inline?: boolean }).inline ? (
      <code className="rounded-lg bg-primary/10 px-1.5 py-0.5 font-black text-primary">{children}</code>
    ) : (
      <code className="block overflow-x-auto rounded-2xl bg-neutral-900 px-4 py-3 font-mono text-sm text-white">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-2xl bg-neutral-900 p-4 text-sm text-white">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 rounded-2xl border-l-4 border-secondary bg-secondary/10 px-4 py-3 italic text-neutral-700">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-left">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-left">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-2xl border border-neutral-200 text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary/5">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-neutral-200 last:border-b-0">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-3 font-black text-neutral-800">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 align-top text-neutral-700">{children}</td>,
};

export function AIMarkdown({ children, className, components }: AIMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          ...baseComponents,
          ...components,
        }}
      >
        {formatAIMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
