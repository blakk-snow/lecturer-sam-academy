/**
 * Markdown.jsx — shared AI-response renderer (react-markdown + GFM + KaTeX)
 *
 * Replaces the hand-rolled regex renderers in AIAssistant.jsx and the
 * Curriculum AI drawer with a single, standards-based component.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const componentClassNames = {
  p: 'text-sm leading-relaxed',
  ul: 'list-disc pl-4 space-y-1 text-sm',
  ol: 'list-decimal pl-4 space-y-1 text-sm',
  li: 'leading-relaxed',
  h1: 'text-base font-bold mt-2',
  h2: 'text-sm font-bold mt-2',
  h3: 'text-sm font-semibold mt-2',
  h4: 'text-sm font-semibold mt-1.5',
  strong: 'font-semibold',
  a: 'text-accent underline break-all',
  code: 'font-mono text-xs bg-paper px-1 py-0.5 rounded',
  pre: 'bg-paper rounded-lg p-3 text-xs overflow-x-auto my-2',
  table: 'text-xs border-collapse my-2',
  th: 'border border-line px-2 py-1 text-left font-semibold',
  td: 'border border-line px-2 py-1',
  blockquote: 'border-l-2 border-line pl-3 text-ink-soft my-2',
};

function withClassName(Component, className) {
  return function Tagged({ node, ...props }) {
    return <Component className={className} {...props} />;
  };
}

const components = Object.fromEntries(
  Object.entries(componentClassNames).map(([tag, className]) => [tag, withClassName(tag, className)]),
);

export function Markdown({ text }) {
  if (!text) return null;
  return (
    <div className="markdown-body space-y-2 text-ink">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
