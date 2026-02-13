import { NextRequest, NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf-generator';
import { marked } from 'marked';
import fs from 'fs';
import path from 'path';
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import { join } from "path";

// Helper to embed images as base64
async function processHtmlImages(html: string, basePath?: string): Promise<string> {
  // More generic regex to catch all images
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  const matches = [...html.matchAll(imgRegex)];
  let processedHtml = html;

  for (const match of matches) {
    const fullTag = match[0];
    const src = match[1];
    
    // Skip remote images and already embedded ones
    if (src.startsWith('http') || src.startsWith('data:')) {continue;}

    const filename = src.split('/').pop();
    if (!filename) {continue;}

    // Resolve path: if src is ./images/foo.png and basePath is /content-2
    // we want public/content-2/images/foo.png
    
    let relativePath = src;
    if (src.startsWith('./')) {
      relativePath = src.substring(2);
    } else if (src.startsWith('/')) {
      relativePath = src.substring(1);
    }

    const potentialPaths: string[] = [];
    if (basePath) {
      let cleanBasePath = basePath.startsWith('/') ? basePath.substring(1) : basePath;
      
      // If the path comes from our API route adjustment, it might start with 'api/'
      // We need to strip that to get the actual filesystem path in 'public/'
      if (cleanBasePath.startsWith('api/')) {
        cleanBasePath = cleanBasePath.substring(4); // Remove 'api/'
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
          const mimeType = ext === 'svg' ? 'svg+xml' : (ext === 'jpg' ? 'jpeg' : ext);
          const newSrc = `data:image/${mimeType};base64,${base64}`;
          
          // Replace src in the tag
          processedHtml = processedHtml.replace(fullTag, fullTag.replace(src, newSrc));
          break; 
        } catch (e) {
          console.error(`Error reading image ${imgPath}:`, e);
        }
      }
    }
  }
  return processedHtml;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    
    // Auth Check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { markdown, metadata, basePath, saveToServer, sourceFileId } = await req.json();

    // Process markdown to HTML for PDF engine
    const processedMarkdown = markdown.replace(/\\pagebreak|<!-- pagebreak -->/g, '<div class="page-break-marker"></div>');
    let htmlContent = await marked.parse(processedMarkdown);
    
    // Process images to embed them
    htmlContent = await processHtmlImages(htmlContent, basePath);

    // Generate PDF
    const pdfBuffer = await generatePdf(htmlContent, metadata);

    // If saving is requested and we have a source file ID
    if (saveToServer && sourceFileId) {
      // 1. Fetch Source File Info
      const sourceFile = await prisma.file.findUnique({
        where: { id: sourceFileId, userId: session.user.id }
      });

      if (sourceFile) {
        // 2. Prepare Storage Path
        const batchId = sourceFile.batchId || 'no-batch';
        const pdfFilename = sourceFile.originalName.replace(/\.md$/i, '') + '.pdf';
        const uniqueFilename = `${randomUUID()}.pdf`;
        
        // Use same folder structure as source if possible
        const relativeStorageDir = join("uploads", session.user.id, batchId);
        const uploadDir = join(process.cwd(), "public", relativeStorageDir);
        await mkdir(uploadDir, { recursive: true });

        const storageKey = `${relativeStorageDir}/${uniqueFilename}`; // Forward slashes for URL consistency
        const systemFilePath = join(process.cwd(), "public", storageKey);

        // 3. Write PDF to Disk
        await writeFile(systemFilePath, pdfBuffer);

        // -- Extract Page Count --
        const pdfContent = pdfBuffer.toString('binary');
        const pageCountMatch = pdfContent.match(/\/Type\s*\/Pages\s*\/Count\s*(\d+)/);
        const pageCount = pageCountMatch ? parseInt(pageCountMatch[1]) : (pdfContent.match(/\/Type\s*\/Page\b/g)?.length || 1);

        // 4. Create PDF File Record
        const pdfFile = await prisma.file.create({
          data: {
            userId: session.user.id,
            batchId: batchId,
            filename: uniqueFilename,
            originalName: pdfFilename,
            relativePath: sourceFile.relativePath ? sourceFile.relativePath.replace(/\.md$/i, '.pdf') : pdfFilename,
            mimeType: 'application/pdf',
            size: pdfBuffer.length,
            storageKey: storageKey,
            url: `/api/${storageKey}`,
            metadata: {
              sourceFileId: sourceFile.id,
              isGenerated: true,
              generatedFrom: 'converter',
              pageCount: pageCount
            }
          }
        });

        // 5. Update Source File Metadata to link to PDF
        // We accumulate metadata, don't overwrite if it exists and is an object
        const currentMetadata = (sourceFile.metadata as Record<string, unknown>) || {};
        await prisma.file.update({
          where: { id: sourceFile.id },
          data: {
            metadata: {
              ...currentMetadata,
              generatedPdfId: pdfFile.id,
              generatedPdfUrl: pdfFile.url,
              generatedPdfSize: pdfBuffer.length,
              generatedPdfPageCount: pageCount,
              lastConvertedAt: new Date().toISOString()
            }
          }
        });

        // Return the saved file info along with the PDF blob
        // We return the binary PDF as usual, but with headers indicating success/id?
        // Actually, cleaner to return JSON if saveToServer is true?
        // But the client expects a Blob usually. 
        // Let's stick to returning the Blob, but maybe add headers, 
        // OR better: The client handles this.
        
        // WAIT: If we return JSON here, existing logic in client (response.blob()) might break if it expects a blob immediately.
        // But the client code for 'saveToServer' is new. 
        // Let's make it so if saveToServer is true, we return JSON with the file info AND the blob in base64? 
        // Or just return JSON with the URL, and let client fetch it?
        
        // Actually, easiest is to return the PDF blob as before, but include the new File ID in headers.
        
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${pdfFilename}"`,
            'X-Generated-Pdf-Id': pdfFile.id,
            'X-Generated-Pdf-Url': pdfFile.url || ''
          },
        });
      }
    }

    // Default behavior (no save, just stream)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
      },
    });

  } catch (error: unknown) {
    console.error('PDF Generation Error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
    }
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error",
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
