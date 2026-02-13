import type { Metadata } from '@/lib/pdf-generator';
import { generatePdf } from '@/lib/pdf-generator';
import prisma from '@/lib/prisma';

import { randomUUID } from 'crypto';
import fs from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { marked } from 'marked';
import path from 'path';
import { join } from 'path';

/**
 * Service to handle PDF generation pipeline including image processing and persistence.
 * Follows Guideline 1 (Source -> Process -> Sink) and Guideline 6 (Service-Level Abstraction).
 */
export const PdfService = {
  /**
   * Embeds local images as base64 in HTML content.
   */
  processHtmlImages: async (html: string, basePath?: string): Promise<string> => {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    const matches = [...html.matchAll(imgRegex)];
    let processedHtml = html;

    for (const match of matches) {
      const fullTag = match[0];
      const src = match[1];

      if (src.startsWith('http') || src.startsWith('data:')) {
        continue;
      }

      const filename = src.split('/').pop();
      if (!filename) {
        continue;
      }

      let relativePath = src;
      if (src.startsWith('./')) {
        relativePath = src.substring(2);
      } else if (src.startsWith('/')) {
        relativePath = src.substring(1);
      }

      const potentialPaths: string[] = [];
      if (basePath) {
        let cleanBasePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
        if (cleanBasePath.startsWith('api/')) {
          cleanBasePath = cleanBasePath.substring(4);
        }
        potentialPaths.push(path.join(process.cwd(), 'public', cleanBasePath, relativePath));
      }
      potentialPaths.push(path.join(process.cwd(), 'public', relativePath));

      for (const imgPath of potentialPaths) {
        if (fs.existsSync(imgPath)) {
          try {
            const buffer = fs.readFileSync(imgPath);
            const base64 = buffer.toString('base64');
            const ext = path.extname(filename).substring(1).toLowerCase();
            const mimeType = ext === 'svg' ? 'svg+xml' : ext === 'jpg' ? 'jpeg' : ext;
            const newSrc = `data:image/${mimeType};base64,${base64}`;

            processedHtml = processedHtml.replace(fullTag, fullTag.replace(src, newSrc));
            break;
          } catch (e) {
            console.error(`Error reading image ${imgPath}:`, e);
          }
        }
      }
    }
    return processedHtml;
  },

  /**
   * Main pipeline for generating and optionally saving a PDF.
   */
  processPdfPipeline: async (params: {
    markdown: string;
    metadata: Metadata;
    userId: string;
    basePath?: string;
    saveToServer?: boolean;
    sourceFileId?: string;
  }) => {
    const { markdown, metadata, userId, basePath, saveToServer, sourceFileId } = params;

    // 1. Process markdown to HTML
    const processedMarkdown = markdown.replace(
      /\\pagebreak|<!-- pagebreak -->/g,
      '<div class="page-break-marker"></div>',
    );
    let htmlContent = await marked.parse(processedMarkdown);

    // 2. Embed images
    htmlContent = await PdfService.processHtmlImages(htmlContent, basePath);

    // 3. Generate PDF Buffer
    const pdfBuffer = await generatePdf(htmlContent, metadata);

    let pdfFileRecord = null;

    // 4. Persistence logic (Sink)
    if (saveToServer && sourceFileId) {
      const sourceFile = await prisma.file.findUnique({
        where: { id: sourceFileId, userId },
      });

      if (sourceFile) {
        const batchId = sourceFile.batchId || 'no-batch';
        const pdfFilename = sourceFile.originalName.replace(/\.md$/i, '') + '.pdf';
        const uniqueFilename = `${randomUUID()}.pdf`;

        const relativeStorageDir = join('uploads', userId, batchId);
        const uploadDir = join(process.cwd(), 'public', relativeStorageDir);
        await mkdir(uploadDir, { recursive: true });

        const storageKey = `${relativeStorageDir}/${uniqueFilename}`;
        const systemFilePath = join(process.cwd(), 'public', storageKey);

        await writeFile(systemFilePath, pdfBuffer);

        // Extract Page Count
        const pdfContent = pdfBuffer.toString('binary');
        const pageCountMatch = pdfContent.match(/\/Type\s*\/Pages\s*\/Count\s*(\d+)/);
        const pageCount = pageCountMatch
          ? parseInt(pageCountMatch[1])
          : pdfContent.match(/\/Type\s*\/Page\b/g)?.length || 1;

        // Create DB record
        pdfFileRecord = await prisma.file.create({
          data: {
            userId,
            batchId,
            filename: uniqueFilename,
            originalName: pdfFilename,
            relativePath: sourceFile.relativePath
              ? sourceFile.relativePath.replace(/\.md$/i, '.pdf')
              : pdfFilename,
            mimeType: 'application/pdf',
            size: pdfBuffer.length,
            storageKey,
            url: `/api/${storageKey}`,
            metadata: {
              sourceFileId: sourceFile.id,
              isGenerated: true,
              generatedFrom: 'converter',
              pageCount,
            },
          },
        });

        // Update Source Link
        const currentMetadata = (sourceFile.metadata as Record<string, unknown> | null) ?? {};
        await prisma.file.update({
          where: { id: sourceFile.id },
          data: {
            metadata: {
              ...currentMetadata,
              generatedPdfId: pdfFileRecord.id,
              generatedPdfUrl: pdfFileRecord.url,
              generatedPdfSize: pdfBuffer.length,
              generatedPdfPageCount: pageCount,
              lastConvertedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    return {
      pdfBuffer,
      pdfFileRecord,
      filename: sourceFileId ? undefined : 'report.pdf',
    };
  },
};
