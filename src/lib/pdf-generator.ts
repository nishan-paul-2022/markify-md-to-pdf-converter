import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export interface GroupMember {
  name: string;
  roll: string;
}

export interface Metadata {
  university?: string;
  program?: string;
  title?: string;
  subtitle?: string;
  course?: string;
  name?: string;
  roll?: string;
  reg?: string;
  batch?: string;
  date?: string;
  groupMembers?: GroupMember[];
}

export async function generatePdf(markdownHtml: string, metadata: Metadata): Promise<Buffer> {
  let browser;
  try {
    console.log('🚀 Starting PDF generation...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Browser launched successfully');
    
    const page = await browser.newPage();
    
    // Capture browser console logs for debugging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    page.on('pageerror', error => console.error('Browser page error:', error));

    // Load images as base64
    const logoPath = path.join(process.cwd(), 'public', 'university-logo.png');
    const bgPath = path.join(process.cwd(), 'public', 'cover-bg.png');

    let logoBase64 = '';
    let bgBase64 = '';

    try {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
      bgBase64 = fs.readFileSync(bgPath).toString('base64');
    } catch (err: unknown) {
      console.error('Error reading images:', err);
    }

    const hasMetadata = metadata && Object.keys(metadata).length > 0;

    // Exact same styling as PageTemplates.tsx but in CSS
    const style = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora&display=swap');
      
      ${hasMetadata ? `
      @page :first {
        margin: 0;
      }
      ` : ''}
      
      @page {
        margin: 15mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body { 
        font-family: 'Inter', sans-serif;
        padding: 0;
        margin: 0;
        color: #1a1a1a;
        background: white;
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .report-container { padding: 0; }
      
      h1, h2, h3, h4, h5, h6 {
        margin: 0;
      }

      h1 {
        font-size: 28pt;
        color: #0369a1;
        margin-bottom: 0.4cm;
      }

      h2 { 
        font-size: 24pt; 
        color: #0369a1; 
        border-left: 10px solid #0ea5e9; 
        padding: 10px 0 10px 20px; 
        margin-top: 0.8cm; 
        margin-bottom: 0.3cm; 
        background: #f8fafc;
        border-radius: 0 8px 8px 0;
        line-height: 1.3;
      }

      h3 { 
        font-size: 16pt; 
        color: #0369a1; 
        margin-top: 0.6cm; 
        margin-bottom: 0.2cm; 
        display: flex;
        align-items: center;
        line-height: 1.4;
      }
      
      h3::before {
        content: "";
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: #0ea5e9;
        border-radius: 50%;
        margin-right: 10px;
      }

      h4, h5, h6 {
        font-size: 13pt;
        color: #0f172a;
        margin-top: 0.5cm;
        margin-bottom: 0.15cm;
      }

      p { 
        text-align: justify; 
        -webkit-hyphens: auto;
        hyphens: auto;
        line-height: 1.6; 
        font-family: 'Lora', serif; 
        font-size: 11pt; 
        color: #334155;
        margin-bottom: 0.4cm;
      }

      ul, ol {
        margin-bottom: 0.4cm;
        color: #334155;
        font-family: 'Lora', serif;
        font-size: 11pt;
        padding-left: 1.5cm;
        page-break-inside: auto;
      }
      
      li { 
        margin-bottom: 0.2cm; 
        line-height: 1.6;
      }

      .page-break, .page-break-marker { 
        page-break-before: always; 
        break-before: page;
      }
      
      pre { 
        background: #0f172a; 
        color: #f8fafc; 
        padding: 15px; 
        border-radius: 8px; 
        font-size: 9pt; 
        white-space: pre-wrap; 
        margin: 0.2cm 0 0.8cm 0;
        border: 1px solid rgba(255,255,255,0.05);
        line-height: 1.45;
      }
      
      code {
        font-family: 'Inter', monospace;
      }

      hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 0.8cm 0;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0.2cm 0 0.6cm 0;
        font-size: 10pt;
        page-break-inside: auto;
      }
      th {
        background: #f8fafc;
        color: #0369a1;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 8.5pt;
        letter-spacing: 0.05em;
        padding: 10px;
        border-bottom: 2px solid #e2e8f0;
        text-align: left;
      }
      td {
        padding: 10px;
        border-bottom: 1px solid #f1f5f9;
        color: #475569;
      }
      tr {
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        display: block;
        margin: 0.2cm auto 0.8cm auto;
      }
      
      .content-page { 
        padding: 0; 
        word-break: break-word;
      }

      /* Cover Page - Exact match to PageTemplates.tsx */
      .cover-page {
        width: 794px;
        height: 1123px;
        background-color: #020617;
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0;
        page-break-after: always;
        position: relative;
        overflow: hidden;
      }
      
      .bg-blur-1 {
        position: absolute;
        top: -10%;
        left: -10%;
        width: 40%;
        height: 40%;
        background: rgba(37, 99, 235, 0.2);
        border-radius: 50%;
        filter: blur(120px);
      }
      
      .bg-blur-2 {
        position: absolute;
        bottom: -10%;
        right: -10%;
        width: 50%;
        height: 50%;
        background: rgba(79, 70, 229, 0.1);
        border-radius: 50%;
        filter: blur(140px);
      }
      
      .cover-bg-image {
        position: absolute;
        inset: 0;
        background-image: url('data:image/png;base64,${bgBase64}');
        background-size: cover;
        background-position: center;
        mix-blend-mode: overlay;
        opacity: 0.4;
      }
      
      .cover-content {
        position: relative;
        z-index: 10;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px;
      }
      
      .cover-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
      }
      
      .logo {
        width: 100px;
        height: auto;
        filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.15));
      }
      
      .session-info {
        text-align: right;
      }
      
      .session-tag {
        font-size: 14px;
        font-weight: 900;
        letter-spacing: 0.3em;
        text-transform: uppercase;
        color: #60a5fa;
        margin-bottom: 4px;
      }
      
      .date-tag {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255,255,255,0.4);
        letter-spacing: 0.1em;
      }
      
      .university-section {
        margin-bottom: 56px;
        text-align: center;
        width: 100%;
      }
      
      .university-name {
        font-size: 28px;
        font-weight: 900;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: white;
        line-height: 1.1;
      }
      
      .program-name {
        font-size: 16px;
        font-weight: 700;
        margin-top: 16px;
        color: rgba(255,255,255,0.6);
        letter-spacing: 0.12em;
        text-transform: uppercase;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding-top: 16px;
        display: inline-block;
        white-space: nowrap;
      }
      
      .hero-section {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 95%;
        text-align: center;
      }
      
      .title-wrapper {
        margin-bottom: 48px;
        width: 100%;
      }
      
      .report-title-hero {
        font-size: 40px;
        font-weight: 900;
        line-height: 1.2;
        margin-bottom: 24px;
        letter-spacing: -0.02em;
        color: white;
        padding: 0 16px;
      }
      
      .report-subtitle-hero {
        font-size: 20px;
        font-weight: 600;
        color: rgba(255,255,255,0.9);
        line-height: 1.5;
        white-space: nowrap;
        padding: 0 16px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .course-box {
        display: inline-flex;
        align-items: center;
        padding: 12px 24px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(20px);
        font-weight: 900;
        font-size: 16px;
        color: #60a5fa;
        white-space: nowrap;
      }
      
      .footer-grid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 32px;
        align-items: end;
        margin-top: 48px;
        padding-top: 32px;
        border-top: 1px solid rgba(255,255,255,0.1);
        text-align: left;
      }
      
      .submitter-column {
        grid-column: span 5;
      }
      
      .label-pill {
        display: inline-block;
        padding: 6px 14px;
        background: rgba(59, 130, 246, 0.1);
        color: #60a5fa;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        margin-bottom: 16px;
        border: 1px solid rgba(59, 130, 246, 0.2);
      }
      
      .info-group {
        margin-bottom: 14px;
      }
      
      .info-label {
        font-size: 10px;
        font-weight: 700;
        color: rgba(255,255,255,0.4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 4px;
        display: block;
      }
      
      .info-value-big {
        font-size: 16px;
        font-weight: 900;
        color: white;
      }
      
      .info-value-small {
        font-size: 14px;
        font-weight: 700;
        color: white;
      }
      
      .group-column {
        grid-column: span 7;
      }
      
      .group-card {
        background: rgba(255,255,255,0.05);
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 20px;
        backdrop-filter: blur(20px);
      }
      
      .group-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 0 4px;
      }
      
      .group-card-title {
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        color: #60a5fa;
        letter-spacing: 0.2em;
      }
      
      .group-count {
        font-size: 10px;
        font-weight: 700;
        color: rgba(255,255,255,0.4);
      }
      
      .member-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .member-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.05);
      }
      
      .member-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .member-index {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.2);
        border: 1px solid rgba(59, 130, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 900;
        color: #60a5fa;
      }
      
      .member-name {
        font-size: 13px;
        font-weight: 700;
        color: rgba(255,255,255,0.9);
      }
      
      .member-roll {
        font-size: 12px;
        font-weight: 700;
        color: rgba(255,255,255,0.4);
      }
    `;

    // Process metadata
    const groupMembers = metadata.groupMembers || [];
    const courseText = metadata.course ? metadata.course.replace(',', ':') : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${style}</style>
      </head>
      <body>
        ${hasMetadata ? `
        <div class="cover-page">
          <div class="bg-blur-1"></div>
          <div class="bg-blur-2"></div>
          <div class="cover-bg-image"></div>
          
          <div class="cover-content">
            <div class="cover-header">
              <div>
                <img src="data:image/png;base64,${logoBase64}" class="logo" />
              </div>
              <div class="session-info">
                <div class="session-tag">Session 2025-26</div>
                <div class="date-tag">${metadata.date || ''}</div>
              </div>
            </div>
            
            <div class="university-section">
              <div class="university-name">${metadata.university || ''}</div>
              <div class="program-name">${metadata.program || ''}</div>
            </div>
            
            <div class="hero-section">
              <div class="title-wrapper">
                <h1 class="report-title-hero">${metadata.title || ''}</h1>
                <div class="report-subtitle-hero">${metadata.subtitle || ''}</div>
              </div>
              
              <div class="course-box">
                ${courseText}
              </div>
            </div>
            
            <div class="footer-grid">
              <div class="submitter-column">
                <div class="label-pill">Submitted By</div>
                <div class="info-group">
                  <span class="info-label">Name of Student</span>
                  <span class="info-value-big">${metadata.name || ''}</span>
                </div>
                <div style="display: flex; gap: 32px;">
                  <div class="info-group">
                    <span class="info-label">Roll Number</span>
                    <span class="info-value-small">${metadata.roll || ''}</span>
                  </div>
                  <div class="info-group">
                    <span class="info-label">Reg. No</span>
                    <span class="info-value-small">${metadata.reg || ''}</span>
                  </div>
                </div>
                <div class="info-group">
                  <span class="info-label">Batch</span>
                  <span class="info-value-small">${metadata.batch || ''}</span>
                </div>
              </div>
              
              <div class="group-column">
                ${groupMembers.length > 0 ? `
                <div class="group-card">
                  <div class="group-card-header">
                    <div class="group-card-title">Collaborative Group</div>
                    <div class="group-count">${groupMembers.length} Members</div>
                  </div>
                  <div class="member-list">
                    ${groupMembers.map((m: GroupMember, i: number) => `
                    <div class="member-row">
                      <div class="member-info">
                        <div class="member-index">${i + 1}</div>
                        <span class="member-name">${m.name}</span>
                      </div>
                      <span class="member-roll">${m.roll}</span>
                    </div>
                    `).join('')}
                  </div>
                </div>
                ` : `
                <div style="text-align: right;">
                  <div class="label-pill">Confidential</div>
                </div>
                `}
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        ${markdownHtml.trim() ? `
        <div class="report-container">
          <div class="content-page">
            ${markdownHtml}
          </div>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    console.log('📄 Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('🖨️ Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-family: 'Inter', sans-serif; font-size: 9px; width: 100%; display: flex; justify-content: flex-end; padding-right: 15mm; padding-bottom: 5mm; color: #64748b;">
          <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
        </div>`
    });

    console.log('✅ PDF generated successfully');
    return pdf;
  } catch (error) {
    console.error('❌ Error in PDF generation:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}
