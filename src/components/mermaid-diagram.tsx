'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export const MermaidDiagram = ({ chart }: MermaidProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      fontFamily: 'Inter',
    });
  }, []);

  useEffect(() => {
    if (hasMounted && ref.current) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(err => {
        console.error('Mermaid render error:', err);
      });
    }
  }, [hasMounted, chart]);

  return (
    <div className="diagram-container my-8 flex justify-center">
      <div ref={ref} className="mermaid-render-target" />
    </div>
  );
};

interface MermaidProps {
  chart: string;
}
