'use client';

import React, { useEffect, useRef, useState } from 'react';

import { useEditorStore } from '@/store/use-editor-store';

import { Loader2 } from 'lucide-react';
import mermaid from 'mermaid';

export default function MermaidDiagram({ chart }: MermaidProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const instanceId = useRef(`mermaid-${Math.random().toString(36).substring(2, 11)}`);
  const { reportMermaidError, resolveMermaidError } = useEditorStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevChart, setPrevChart] = useState(chart);

  if (chart !== prevChart) {
    setPrevChart(chart);
    setIsLoaded(false);
    setError(null);
  }

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      logLevel: 5, // Silence mermaid's internal logging (5 = Fatal/Off)
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
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return;
      const id = instanceId.current;

      try {
        // Pre-validate syntax to avoid internal mermaid logging during render
        // suppressErrors: true ensures mermaid doesn't log the parse error to console
        const isValid = await mermaid.parse(chart, { suppressErrors: true });
        
        if (!isValid) {
          throw new Error('Invalid Mermaid syntax');
        }

        // Clear previous content before success render
        ref.current.innerHTML = '';
        
        const { svg } = await mermaid.render(id, chart);
        
        ref.current.innerHTML = svg;
        setIsLoaded(true);

        // Post-process SVG for better appearance
        const svgElement = ref.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.maxHeight = '400px';
          svgElement.style.height = 'auto';
          svgElement.style.objectFit = 'contain';
          svgElement.style.filter = 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))';
        }

        resolveMermaidError(id);
      } catch {
        // We catch errors silently to avoid console clutter
        // The error is already being reported to the global store to disable print preview
        setError('Failed to render diagram');
        setIsLoaded(true);
        reportMermaidError(id);
      }
    };

    void renderDiagram();
  }, [chart, reportMermaidError, resolveMermaidError]);

  // Cleanup on unmount
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
