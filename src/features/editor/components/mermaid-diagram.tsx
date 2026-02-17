'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useEditorStore } from '@/store/use-editor-store';

import { Loader2 } from 'lucide-react';
import mermaid from 'mermaid';

let isMermaidInitialized = false;
const initializeMermaid = () => {
  if (isMermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    logLevel: 5,
    theme: 'base',
    themeVariables: {
      primaryColor: '#e0f2fe',
      primaryTextColor: '#0369a1',
      primaryBorderColor: '#0ea5e9',
      lineColor: '#0ea5e9',
      secondaryColor: '#f0f9ff',
      tertiaryColor: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      mainBkg: '#f8fafc',
      nodeBorder: '#cbd5e1',
      clusterBkg: '#f1f5f9',
      titleColor: '#0f172a',
      edgeLabelBackground: '#ffffff',
    },
    securityLevel: 'loose',
    fontFamily: 'Inter',
  });
  isMermaidInitialized = true;
};

export default function MermaidDiagram({ chart }: MermaidProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const instanceId = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`);
  const {
    reportMermaidError,
    resolveMermaidError,
    reportMermaidLoading,
    resolveMermaidLoading,
  } = useEditorStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevChart, setPrevChart] = useState(chart);

  if (chart !== prevChart) {
    setPrevChart(chart);
    setIsLoaded(false);
    setError(null);
  }

  useEffect(() => {
    initializeMermaid();
  }, []);

  useEffect(() => {
    const id = instanceId.current;
    const taskId = `task-${Math.random().toString(36).substring(2, 11)}`;
    let isCurrent = true;

    const renderDiagram = async () => {
      if (!ref.current) return;
      
      reportMermaidLoading(taskId);

      try {
        await mermaid.parse(chart, { suppressErrors: true });
        
        if (!isCurrent) return;

        ref.current.innerHTML = '';
        const { svg } = await mermaid.render(id, chart);
        
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (isCurrent) {
          ref.current.innerHTML = svg;
          setIsLoaded(true);
          setError(null);

          const svgElement = ref.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '400px';
            svgElement.style.height = 'auto';
            svgElement.style.objectFit = 'contain';
            svgElement.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))';
          }

          resolveMermaidError(id);
        }
      } catch (err) {
        if (!isCurrent) return;
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram');
        setIsLoaded(true);
        reportMermaidError(id);
      } finally {
        if (isCurrent) {
          resolveMermaidLoading(taskId);
        }
      }
    };

    void renderDiagram();

    return () => {
      isCurrent = false;
      resolveMermaidLoading(taskId);
    };
  }, [chart, reportMermaidError, resolveMermaidError, reportMermaidLoading, resolveMermaidLoading]);

  // Cleanup error state on unmount
  useEffect(() => {
    const id = instanceId.current;
    return () => {
      resolveMermaidError(id);
    };
  }, [resolveMermaidError]);

  return (
    <div className="diagram-wrapper my-3 flex w-full flex-col items-center">
      {!isLoaded && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Rendering diagram...</span>
        </div>
      )}
      {error && <div className="py-4 text-center text-sm font-medium text-red-500">{error}</div>}
      <div
        ref={ref}
        className={`mermaid-container flex w-full justify-center transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

interface MermaidProps {
  chart: string;
}
