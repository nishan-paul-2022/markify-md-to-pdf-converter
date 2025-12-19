'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidDiagram } from './mermaid-diagram';
import { cn } from '@/lib/utils';

interface MdPreviewProps {
  content: string;
  className?: string;
}

export const MdPreview = ({ content, className }: MdPreviewProps) => {
  return (
    <div className={cn("prose prose-slate max-w-none dark:prose-invert", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-mermaid/.exec(className || '');
            if (!inline && match) {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for headings, etc. to match the style
          h2: ({ children }) => (
            <h2 className="text-3xl font-bold mt-12 mb-6 border-l-8 border-slate-500 pl-4 py-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-semibold mt-8 mb-4 text-slate-700 dark:text-slate-300">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-6 leading-relaxed text-slate-800 dark:text-slate-200 text-justify">
              {children}
            </p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
