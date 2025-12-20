import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { getReportComputedStyle, getReportContentHtml, Metadata } from '@/lib/report-template';

export async function generatePdf(markdownHtml: string, metadata: Metadata) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load images as base64
  const logoPath = path.join(process.cwd(), 'public', 'du-logo.png');
  const bgPath = path.join(process.cwd(), 'public', 'cover-bg.png');
  const pagedJsPath = path.join(process.cwd(), 'node_modules', 'pagedjs', 'dist', 'paged.polyfill.js');

  let logoBase64 = '';
  let bgBase64 = '';
  let pagedJsScript = '';

  try {
    logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64');
    bgBase64 = 'data:image/png;base64,' + fs.readFileSync(bgPath).toString('base64');
    pagedJsScript = fs.readFileSync(pagedJsPath, 'utf-8');
  } catch (err) {
    console.error('Error reading assets:', err);
  }

  const style = getReportComputedStyle({ logo: logoBase64, background: bgBase64 });
  const contentHtml = getReportContentHtml(markdownHtml, metadata, { logo: logoBase64, background: bgBase64 });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${style}</style>
      <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <script>
        mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
      </script>
      <script>
        ${pagedJsScript}
      </script>
      <script>
        window.PagedConfig = {
          auto: false,
          before: () => { console.log('PagedJS starting...'); },
          after: (flow) => { console.log('PagedJS finished!'); window.renderingDone = true; }
        };
        
        document.addEventListener('DOMContentLoaded', () => {
           setTimeout(() => {
             window.PagedPolyfill.preview();
           }, 1000); 
        });
      </script>
    </head>
    <body>
      ${contentHtml}
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for PagedJS to signal completion
  // We added window.renderingDone in the "after" hook of PagedConfig
  try {
    await page.waitForFunction('window.renderingDone === true', { timeout: 30000 });
  } catch (e) {
    console.warn('PagedJS rendering timed out or failed, proceeding with PDF generation anyway.');
  }

  const pdf = await page.pdf({
    printBackground: true,
    displayHeaderFooter: false,
    // PagedJS handles margins and headers/footers via CSS @page
    width: '210mm',
    height: '297mm'
  });

  await browser.close();
  return pdf;
}
