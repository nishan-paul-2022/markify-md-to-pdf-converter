import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function generatePdf(markdownHtml: string, metadata: any) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Load images as base64
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const bgPath = path.join(process.cwd(), 'public', 'cover-bg.png');
  
  let logoBase64 = '';
  let bgBase64 = '';
  
  try {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
    bgBase64 = fs.readFileSync(bgPath).toString('base64');
  } catch (err) {
    console.error('Error reading images:', err);
  }

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Lora&display=swap');
    
    body { 
      font-family: 'Inter', sans-serif;
      padding: 0;
      margin: 0;
      color: #1a1a1a;
    }
    .report-container { padding: 2cm; }
    h2 { font-size: 24pt; color: #1B263B; border-left: 8px solid #778DA9; padding-left: 15px; margin-top: 1.5cm; margin-bottom: 0.5cm; page-break-after: avoid; }
    h3 { font-size: 18pt; color: #415A77; margin-top: 1cm; page-break-after: avoid; }
    p { text-align: justify; line-height: 1.6; font-family: 'Lora', serif; font-size: 11pt; }
    .page-break { page-break-before: always; }
    pre { background: #1e1e1e; color: #e0e0e0; padding: 12px; border-radius: 4px; font-size: 9.5pt; white-space: pre-wrap; }
    .diagram-container { margin: 20px 0; text-align: center; }
    
    .cover-page { 
      height: 297mm; 
      width: 210mm;
      background-image: url('data:image/png;base64,${bgBase64}');
      background-size: cover;
      background-position: center;
      color: white; 
      display: flex; 
      flex-direction: column; 
      justify-content: center; 
      align-items: center; 
      text-align: center; 
      padding: 2cm; 
      page-break-after: always;
      position: relative;
    }
    .logo-container {
      position: absolute;
      top: 2cm;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
    }
    .logo {
      width: 120px;
      height: auto;
    }
    .university { font-size: 24px; letter-spacing: 4px; font-weight: 700; margin-bottom: 5px; }
  `;

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
    </head>
    <body>
      <div class="cover-page">
        <div class="logo-container">
          <img src="data:image/png;base64,${logoBase64}" class="logo" />
        </div>
        <div style="margin-top: 3cm;">
          <div class="university">UNIVERSITY OF DHAKA</div>
          <div style="font-size: 40px; font-weight: 800; margin-top: 1cm;">${metadata.title || 'Public Key Infrastructure'}</div>
          <div style="font-size: 28px; font-weight: 600; margin-bottom: 2cm;">Implementation Report</div>
          <div style="margin-top: auto;">${metadata.author || 'Nishan Paul'}</div>
        </div>
      </div>
      <div class="report-container">
        ${markdownHtml.replace(/<code class="language-mermaid">([\s\S]*?)<\/code>/g, '<div class="mermaid">$1</div>')}
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle' });
  
  // Wait for mermaid to finish rendering
  await page.waitForTimeout(2000);
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: Arial; font-size: 8px; width: 100%; display: flex; justify-content: flex-end; padding: 5px 20px;">
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>`
  });

  await browser.close();
  return pdf;
}
