import { PDF_STYLES } from '@/constants/pdf-styles';

export interface Metadata {
    title?: string;
    subtitle?: string;
    course?: string;
    name?: string;
    roll?: string;
    reg?: string;
    batch?: string;
    date?: string;
}

export interface ImageSources {
    logo: string;
    background: string;
}

export function getReportComputedStyle(images: ImageSources): string {
    return `
    ${PDF_STYLES}
    .cover-page {
        background-image: url('${images.background}');
    }
    `;
}

export function getReportContentHtml(markdownHtml: string, metadata: Metadata, images: ImageSources): string {
    // Return the HTML structure for the BODY content (Cover + Report Container)
    return `
      <div class="cover-page">
        <div class="logo-container">
          <img src="${images.logo}" class="logo" />
        </div>
        <div class="university">UNIVERSITY OF DHAKA</div>
        <div class="program">Professional Masters in Information and Cyber Security</div>
        
        <div class="title-section">
          <div class="report-title">${metadata.title || 'Public Key Infrastructure (PKI)'}</div>
          <div class="report-subtitle">${metadata.subtitle || 'Implementation & Web Application Integration'}</div>
        </div>
        
        <div class="course-info">
          Course: ${metadata.course || 'CSE 802 - Information Security and Cryptography'}
        </div>
        
        <div class="student-details">
          <div class="details-row">
            <div class="details-label">Name:</div>
            <div class="details-value">${metadata.name || 'Nishan Paul'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Roll No:</div>
            <div class="details-value">${metadata.roll || 'JN-50028'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Reg. No:</div>
            <div class="details-value">${metadata.reg || 'H-55'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Batch:</div>
            <div class="details-value">${metadata.batch || '05'}</div>
          </div>
          <div class="details-row">
            <div class="details-label">Submission Date:</div>
            <div class="details-value">${metadata.date || 'December 18, 2025'}</div>
          </div>
        </div>
      </div>
      <div class="content-section">
        ${markdownHtml.replace(/<code class="language-mermaid">([\s\S]*?)<\/code>/g, '<div class="mermaid">$1</div>')}
      </div>
    `;
}
