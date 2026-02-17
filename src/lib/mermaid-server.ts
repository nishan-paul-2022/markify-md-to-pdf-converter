import { logger } from '@/lib/logger';

import { chromium } from 'playwright';

/**
 * Renders Mermaid diagrams to SVG on the server side using Playwright
 */
export async function renderMermaidToSvg(mermaidCode: string): Promise<string> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Create a minimal HTML page with Mermaid
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <script type="module">
          import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
          
          mermaid.initialize({
            startOnLoad: false,
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

          window.renderMermaid = async (code) => {
            try {
              const { svg } = await mermaid.render('mermaid-diagram', code);
              return svg;
            } catch (error) {
              throw new Error('Mermaid rendering failed: ' + error.message);
            }
          };
        </script>
      </head>
      <body>
        <div id="output"></div>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle' });

    // Wait for mermaid to be available
    await page.waitForFunction(() => typeof window.renderMermaid === 'function', { timeout: 10000 });

    // Render the diagram
    const svg = await page.evaluate(async (code) => {
      return await window.renderMermaid(code);
    }, mermaidCode);

    return svg;
  } catch (error) {
    logger.error('Failed to render Mermaid diagram:', error);
    // Return an error message as SVG
    return `
      <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="100" fill="#fee" stroke="#f00" stroke-width="2"/>
        <text x="200" y="50" text-anchor="middle" fill="#c00" font-family="Arial" font-size="14">
          Failed to render Mermaid diagram
        </text>
      </svg>
    `;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Process HTML content and replace Mermaid code blocks with rendered SVGs
 */
export async function processMermaidInHtml(html: string): Promise<string> {
  // Match code blocks with language-mermaid class
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  const matches = [...html.matchAll(mermaidRegex)];

  if (matches.length === 0) {
    return html;
  }

  logger.info(`Found ${matches.length} Mermaid diagram(s) to render`);

  let processedHtml = html;

  for (const match of matches) {
    const fullMatch = match[0];
    const mermaidCode = match[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();

    logger.debug('Rendering Mermaid diagram:', mermaidCode.substring(0, 100));

    const svg = await renderMermaidToSvg(mermaidCode);

    // Wrap SVG in a styled container matching the live preview
    const wrappedSvg = `
      <div class="diagram-wrapper" style="margin: 0.3cm 0 0.8cm 0; display: flex; width: 100%; flex-direction: column; align-items: center;">
        <div class="mermaid-container" style="display: flex; width: 100%; justify-content: center; background-color: #f8fafc; padding: 1.5rem; border-radius: 0.5rem;">
          ${svg}
        </div>
      </div>
    `;

    processedHtml = processedHtml.replace(fullMatch, wrappedSvg);
  }

  logger.info('Mermaid diagrams rendered successfully');

  return processedHtml;
}

// Type declaration for window.renderMermaid
declare global {
  interface Window {
    renderMermaid: (code: string) => Promise<string>;
  }
}
