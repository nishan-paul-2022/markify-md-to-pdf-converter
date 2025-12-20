'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, ChevronUp, ChevronDown, Maximize, ArrowLeftRight, ScrollText, Eye, FileDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import mermaid from 'mermaid';
import { getReportContentHtml, getReportComputedStyle } from '@/lib/report-template';

interface MdPreviewProps {
  content: string;
  metadata?: {
    title: string;
    subtitle: string;
    course: string;
    name: string;
    roll: string;
    reg: string;
    batch: string;
    date: string;
  };
  className?: string;
  showToolbar?: boolean;
  onDownload?: () => void;
  isGenerating?: boolean;
}

type ZoomMode = 'fit-page' | 'fit-width' | 'custom';

export const MdPreview = ({ content, metadata, className, showToolbar = true, onDownload, isGenerating = false }: MdPreviewProps) => {
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit-width');
  const [customZoom, setCustomZoom] = useState(100);
  const [zoomInput, setZoomInput] = useState('100%');
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single'); // 'single' here mostly affects scroll behavior or zoom, Paged.js always renders all pages. 
  // Actually, for Paged.js, "Single" usually means horizontal scroll or just traditional vertical. 
  // We'll treat 'single' as 'fit-page' style viewing and 'continuous' as vertical scrolling. 

  const [fitWidthScale, setFitWidthScale] = useState(0.75);
  const [fitPageScale, setFitPageScale] = useState(0.5);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  // Debounced content to avoid heavy rendering on every keystroke
  const [debouncedContent, setDebouncedContent] = useState(content);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedContent(content);
    }, 1000); // 1s debounce for Paged.js
    return () => clearTimeout(handler);
  }, [content]);

  // Initial Mermaid config
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
  }, []);

  // Update logic
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!metadata || !debouncedContent || !previewRef.current) return;
      setIsRendering(true);

      try {
        const pagedModule = await import('@/lib/paged.esm.js');
        const Previewer = pagedModule.Previewer;

        if (!Previewer) {
          throw new Error('Could not find Previewer in pagedjs module. Module keys: ' + Object.keys(pagedModule).join(', '));
        }

        // 1. Generate HTML
        const html = await marked.parse(debouncedContent);
        // We use relative paths for preview
        const images = { logo: '/du-logo.png', background: '/cover-bg.png' };

        const fullHtml = getReportContentHtml(html, metadata, images);
        const css = getReportComputedStyle(images);

        // 2. Prepare rendering
        // Clear previous
        if (previewRef.current) {
          previewRef.current.innerHTML = '';
        }

        // 3. Setup Paged.js
        const paged = new Previewer();

        // 4. Inject CSS into content instead of passing as URL array
        // Paged.js .preview() treats the second argument string as a URL or a list of URLs if it's a string/array.
        // By injecting as a style tag, we avoid 404 fetch errors for each character in the CSS string.
        const contentWithStyle = `<style>${css}</style>${fullHtml}`;

        // We need to handle Mermaid BEFORE Paged.js fragments the content.
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentWithStyle;
        tempDiv.style.width = '210mm';
        document.body.appendChild(tempDiv);

        const mermaidDivs = tempDiv.querySelectorAll('.mermaid');
        if (mermaidDivs.length > 0) {
          await mermaid.run({ nodes: Array.from(mermaidDivs) as HTMLElement[] });
        }

        const processedHtml = tempDiv.innerHTML;
        document.body.removeChild(tempDiv);

        if (isCancelled) return;

        // 5. Run Paged.js
        // Pass empty array for external stylesheets to avoid fetch loops
        await paged.preview(processedHtml, [], previewRef.current);

        // 6. Update page count
        const pages = previewRef.current?.querySelectorAll('.pagedjs_page') || [];
        setTotalPages(pages.length);

      } catch (err: any) {
        console.error('Preview render error detailed:', err);
        if (err?.message?.includes('Layout repeated') && previewRef.current) {
          previewRef.current.innerHTML = `
            <div style="padding: 2rem; color: #f87171; background: #1e293b; border: 1px solid #ef4444; border-radius: 0.5rem; margin: 2rem; text-align: center;">
              <h3 style="margin-bottom: 0.5rem;">Pagination Loop Detected</h3>
              <p style="font-size: 0.875rem; color: #cbd5e1;">A content block (like a code block) is too tall for a single page but is set to avoid breaking. Paged.js cannot continue.</p>
            </div>
          `;
        }
        if (err && typeof err === 'object') {
          console.log('Error message:', err.message);
          console.log('Error stack:', err.stack);
        }
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    render();

    return () => { isCancelled = true; };
  }, [debouncedContent, metadata]);

  // Handle Zoom Logic (re-used from previous implementation)
  const handleZoomChange = useCallback((delta: number) => {
    setZoomMode('custom');
    setCustomZoom(prev => {
      let currentBase = prev;
      if (zoomMode === 'fit-page') currentBase = fitPageScale * 100;
      else if (zoomMode === 'fit-width') currentBase = fitWidthScale * 100;
      const newZoom = Math.round((currentBase + delta) / 5) * 5;
      return Math.max(25, Math.min(400, newZoom));
    });
  }, [zoomMode, fitPageScale, fitWidthScale]);

  // Calculate scales
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 32;
      const containerHeight = container.clientHeight - 32;
      const pageWidth = 794; // 210mm @ 96dpi
      const pageHeight = 1123; // 297mm @ 96dpi

      setFitWidthScale(containerWidth / pageWidth);
      setFitPageScale(Math.min(containerWidth / pageWidth, containerHeight / pageHeight));
    };
    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Sync inputs
  useEffect(() => {
    let scale = 1;
    if (zoomMode === 'fit-page') scale = fitPageScale;
    else if (zoomMode === 'fit-width') scale = fitWidthScale;
    else scale = customZoom / 100;
    setZoomInput(`${Math.round(scale * 100)}%`);
  }, [zoomMode, customZoom, fitPageScale, fitWidthScale]);

  const getScale = () => {
    if (zoomMode === 'fit-page') return fitPageScale;
    if (zoomMode === 'fit-width') return fitWidthScale;
    return customZoom / 100;
  };

  // Scroll tracking for Current Page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const pages = container.querySelectorAll('.pagedjs_page');
      let maxVisibleIndex = 0;
      let maxVisibility = 0;

      pages.forEach((page, index) => {
        const rect = page.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate intersection
        const intersectionHeight = Math.max(0, Math.min(rect.bottom, containerRect.bottom) - Math.max(rect.top, containerRect.top));
        const visibility = intersectionHeight / rect.height;

        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          maxVisibleIndex = index;
        }
      });

      if (maxVisibility > 0.1) {
        setCurrentPage(maxVisibleIndex + 1);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalPages]);

  // Also update page input when currentPage changes
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      // Scroll to page
      const pages = previewRef.current?.querySelectorAll('.pagedjs_page');
      if (pages && pages[pageNum - 1]) {
        pages[pageNum - 1].scrollIntoView({ behavior: 'smooth' });
        setCurrentPage(pageNum);
      }
    }
  };

  // Keep all toolbar handlers
  const handleZoomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanValue = zoomInput.replace(/[^0-9]/g, '');
    const zoomVal = parseInt(cleanValue);
    if (!isNaN(zoomVal)) {
      const clamped = Math.max(25, Math.min(400, zoomVal));
      setZoomMode('custom');
      setCustomZoom(clamped);
      setZoomInput(`${clamped}%`);
    }
  };

  return (
    <div className={cn("pdf-viewer flex flex-col h-full bg-slate-900/50", className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 shrink-0 select-none backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-200 uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5" /> PDF
            {isRendering && <span className="text-xs text-yellow-500 animate-pulse ml-2">(Rendering...)</span>}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              {/* Pagination Controls */}
              <Button variant="ghost" size="icon"
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  const pages = previewRef.current?.querySelectorAll('.pagedjs_page');
                  if (pages && pages[newPage - 1]) pages[newPage - 1].scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <ChevronUp className="w-3 h-3" />
              </Button>

              <form onSubmit={handlePageInputSubmit} className="flex items-baseline gap-1 px-1 min-w-[3rem] justify-center">
                <Input value={pageInput} onChange={(e) => setPageInput(e.target.value)} className="h-4 w-6 text-center bg-transparent border-0 p-0 text-white text-xs" />
                <span className="text-[10px] text-slate-500">/ {totalPages}</span>
              </form>

              <Button variant="ghost" size="icon"
                onClick={() => {
                  const newPage = Math.min(totalPages, currentPage + 1);
                  const pages = previewRef.current?.querySelectorAll('.pagedjs_page');
                  if (pages && pages[newPage - 1]) pages[newPage - 1].scrollIntoView({ behavior: 'smooth' });
                }}
                className="h-6 w-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(-10)} className="h-6 w-6 text-slate-400 hover:text-white"><ZoomOut className="w-3 h-3" /></Button>
              <form onSubmit={handleZoomInputSubmit} className="min-w-[2.5rem] flex justify-center">
                <Input value={zoomInput} onChange={(e) => setZoomInput(e.target.value)} className="h-4 w-8 text-center bg-transparent border-0 p-0 text-white text-xs" />
              </form>
              <Button variant="ghost" size="icon" onClick={() => handleZoomChange(10)} className="h-6 w-6 text-slate-400 hover:text-white"><ZoomIn className="w-3 h-3" /></Button>
            </div>

            <div className="flex items-center gap-0.5 bg-slate-800/50 rounded-lg p-0.5 border border-white/5">
              <Button variant="ghost" size="icon" onClick={() => setZoomMode('fit-page')} className={cn("h-6 w-6", zoomMode === 'fit-page' ? "bg-slate-700 text-white" : "text-slate-400")}><Maximize className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setZoomMode('fit-width')} className={cn("h-6 w-6", zoomMode === 'fit-width' ? "bg-slate-700 text-white" : "text-slate-400")}><ArrowLeftRight className="w-3 h-3" /></Button>
            </div>

            <div className="w-px h-4 bg-slate-800 mx-0.5" />

            <Button variant="ghost" size="icon" onClick={onDownload} disabled={isGenerating} className="h-6 w-6 text-slate-400 hover:text-primary">
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div
        ref={containerRef}
        className="flex-grow overflow-auto p-4 flex justify-center bg-slate-900/40 custom-scrollbar"
      >
        <div
          className="transition-transform duration-200 origin-top"
          style={{
            transform: `scale(${getScale()})`,
            // Paged.js renders block elements. we need to make sure they stack if viewMode is continuous.
            // Actually Paged.js renders a column of pages by default (block).
          }}
        >
          <div ref={previewRef} className="pagedjs-container shadow-2xl bg-white min-h-[297mm] min-w-[210mm]" />
        </div>
      </div>

      <style jsx global>{`
         .pagedjs_pages {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            width: auto !important;
         }
         .pagedjs_page {
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
            margin: 0 !important; /* Managed by gap above */
            flex: 0 0 auto;
         }
         /* Hide Paged.js internal print styles that might mess up preview */
         @media screen {
            .pagedjs_sheet { display: none; }
         }
      `}</style>
    </div>
  );
};
