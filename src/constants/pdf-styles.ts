export const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora&display=swap');
  
  /* Paged.js context separation */
  .pagedjs_pages {
      width: 100%;
      flex: 0 0 auto;
  }

  /* Paged.js setup */
  @page {
    size: A4;
    margin: 20mm; /* Standard margin */
    padding-top: 2rem;
    
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'Inter', sans-serif;
      font-size: 9pt;
      color: #94a3b8;
    }
  }

  @page :first {
    margin: 0;
    @bottom-right { content: none; }
  }

  /* Base Styles */
  /* We scope these to the pagedjs classes or body if used in iframe */
  .pagedjs_page body, body { 
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
    margin: 0; 
  }
  
  /* Standard Markdown Elements */
  h2 { 
    font-size: 24pt; 
    color: #234258; 
    border-left: 8px solid #234258; 
    padding-left: 15px; 
    margin-top: 1.5cm; 
    margin-bottom: 0.5cm; 
  }
  
  h3 { 
    font-size: 18pt; 
    color: #415A77; 
    margin-top: 1cm; 
  }
  
  p { 
    text-align: justify; 
    font-family: 'Lora', serif; 
    font-size: 11pt; 
    margin-bottom: 1em;
  }
  
  /* Code Blocks */
  pre { 
    background: #1e1e1e; 
    color: #e0e0e0; 
    padding: 12px; 
    border-radius: 4px; 
    font-size: 9.5pt; 
    white-space: pre-wrap; 
    break-inside: auto; /* Allow code blocks to split across pages */
  }
  
  /* Diagrams */
  .diagram-container { 
    margin: 20px 0; 
    text-align: center; 
    break-inside: auto;
  }
  
  /* Cover Page */
  .cover-page { 
    min-height: 290mm; /* Slightly less than A4 to prevent rounding overflows */
    width: 100%;
    /* We will inject the bg image via inline style or separate rule */
    background-size: cover;
    background-position: center;
    color: white; 
    display: flex; 
    flex-direction: column; 
    align-items: center; 
    text-align: center; 
    padding: 2cm; 
    box-sizing: border-box;
    page-break-after: always;
  }

  /* Cover Content Styles */
  .logo-container { margin-top: 2cm; padding: 15px; display: flex; justify-content: center; }
  .logo { width: 140px; height: auto; }
  .university { font-size: 32px; letter-spacing: 2px; font-weight: 700; margin-top: 10px; text-transform: uppercase; }
  .program { font-size: 18px; font-weight: 400; margin-top: 8px; opacity: 0.9; }
  .title-section { margin-top: 2.5cm; margin-bottom: 2cm; width: 100%; }
  .report-title { font-size: 44px; font-weight: 800; line-height: 1.2; margin-bottom: 20px; width: 100%; }
  .report-subtitle { font-size: 26px; font-weight: 600; opacity: 0.95; width: 100%; }
  .course-info { margin-top: 1.5cm; font-size: 19px; width: 80%; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 12px; text-align: center; }
  .student-details { margin-top: 1cm; width: 80%; padding: 30px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(4px); break-inside: avoid; }
  .details-row { display: flex; font-size: 18px; margin-bottom: 12px; text-align: left; width: 100%; }
  .details-label { width: 160px; font-weight: 600; color: rgba(255, 255, 255, 0.8); }
  .details-value { flex: 1; font-weight: 500; color: #ffffff; }

  /* Mermaid */
  .mermaid { 
    display: block; 
    margin: 1.5em 0; 
    text-align: center;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    overflow: visible !important;
  }
  
  .mermaid svg {
    max-width: 100% !important;
    height: auto !important;
    max-height: 240mm !important; /* Ensure it stays within A4 content area */
    display: block;
    margin: 0 auto;
  }
  
  /* Prevent large elements from causing pagination loops */
  .diagram-container, .mermaid, svg, blockquote, figure {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  
  .mermaid svg, .diagram-container svg {
    max-width: 100% !important;
    height: auto !important;
    max-height: 230mm !important; /* Slightly smaller to be safe */
    display: block;
    margin: 0 auto;
    overflow: visible !important;
  }
  
  /* Fallback for extremely tall elements that must break */
  pre {
    break-inside: auto !important;
    white-space: pre-wrap;
    word-break: break-all;
    overflow: visible !important;
  }
  
  /* Paged JS Interface overrides */
  /* Hide the Paged.js default interface styles if any leak */
  .pagedjs_page {
     background-color: white;
     box-shadow: 0 0 10px rgba(0,0,0,0.1);
     margin-bottom: 2rem;
     flex: 0 0 auto;
  }
`;
