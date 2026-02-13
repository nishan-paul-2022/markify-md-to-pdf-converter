import React from 'react';

import MermaidDiagram from '@/features/editor/components/mermaid-diagram';
import { logger } from '@/lib/logger';
import { cn } from '@/utils/cn';

interface MarkdownComponentsProps {
  basePath?: string;
}

export const createMarkdownComponents = ({ basePath }: MarkdownComponentsProps) => ({
  code({
    inline,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    if (!inline && match && match[1] === 'mermaid') {
      return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
    }
    return (
      <code
        className={cn(
          inline
            ? 'rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] break-words text-[#0c4a6e]'
            : 'border-0 bg-transparent p-0 text-inherit',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre className="relative mt-[0.2cm] mb-[0.8cm] overflow-hidden rounded-lg border border-white/5 bg-[#0f172a] p-[15px] font-mono text-[9pt] leading-[1.45] break-words whitespace-pre-wrap text-[#f8fafc] shadow-sm">
      {children}
    </pre>
  ),
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
    const id = children?.toString().toLowerCase().replace(/\s+/g, '-');
    return (
      <h2
        id={id}
        className="mt-[0.8cm] mb-[0.3cm] rounded-r-lg border-l-[10px] border-[#0ea5e9] bg-[#f8fafc] py-[10px] pl-[20px] font-sans text-[24pt] leading-[1.3] font-bold text-[#0369a1]"
        {...props}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }: React.ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-[0.6cm] mb-[0.2cm] flex items-center font-sans text-[16pt] leading-[1.4] font-bold text-[#0369a1]">
      <span className="mr-[10px] inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-[#0ea5e9]"></span>
      {children}
    </h3>
  ),
  p: ({ children }: React.ComponentPropsWithoutRef<'p'>) => {
    if (React.Children.count(children) === 1) {
      const firstChild = React.Children.toArray(children)[0];
      if (typeof firstChild === 'string' && firstChild.trim() === '\\pagebreak') {
        return <div className="page-break-marker" />;
      }
    }
    return (
      <p className="mb-[0.4cm] text-justify font-serif text-[11pt] leading-[1.6] font-normal text-[#334155]">
        {children}
      </p>
    );
  },
  ul: ({ children }: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="mb-[0.4cm] list-disc pl-[1.5cm] font-serif text-[11pt] leading-[1.6] text-[#334155]">
      {children}
    </ul>
  ),
  ol: ({ children }: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="mb-[0.4cm] list-decimal pl-[1.5cm] font-serif text-[11pt] leading-[1.6] text-[#334155]">
      {children}
    </ol>
  ),
  li: ({ children }: React.ComponentPropsWithoutRef<'li'>) => (
    <li className="mb-[0.2cm] pl-2">{children}</li>
  ),
  table: ({ children }: React.ComponentPropsWithoutRef<'table'>) => (
    <div className="mt-[0.2cm] mb-[0.6cm] w-full overflow-hidden">
      <table className="w-full border-collapse font-sans text-[10pt]">{children}</table>
    </div>
  ),
  th: ({ children }: React.ComponentPropsWithoutRef<'th'>) => (
    <th className="border-b-2 border-[#e2e8f0] bg-[#f8fafc] p-[10px] text-left text-[8.5pt] font-bold tracking-[0.05em] break-words text-[#0369a1] uppercase">
      {children}
    </th>
  ),
  td: ({ children }: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="border-b border-[#f1f5f9] p-[10px] break-words text-[#475569]">{children}</td>
  ),
  img: ({ src, alt }: React.ComponentPropsWithoutRef<'img'>) => {
    let imageSrc = typeof src === 'string' ? src : '';
    const originalSrc = imageSrc;

    if (imageSrc.startsWith('./') && basePath) {
      const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      imageSrc = cleanBasePath + imageSrc.slice(2);
    } else if (imageSrc && !imageSrc.startsWith('/') && !imageSrc.startsWith('http') && basePath) {
      const cleanBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
      imageSrc = cleanBasePath + imageSrc;
    }

    logger.debug('🖼️ Image resolution:', { originalSrc, basePath, resolvedSrc: imageSrc });

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageSrc}
        alt={alt}
        className="mx-auto mt-[0.2cm] mb-[0.8cm] block h-auto max-w-full rounded-lg"
      />
    );
  },
  blockquote: ({ children }: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-4 border-l-4 border-slate-300 pl-4 text-slate-600 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-[0.8cm] border-slate-200" />,
});
