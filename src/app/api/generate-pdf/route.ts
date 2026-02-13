import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { PdfService } from '@/lib/services/pdf-service';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    // Auth Check (Guideline 2)
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown, metadata, basePath, saveToServer, sourceFileId } = await req.json();

    // Use PDF Service (Guideline 1 & 6)
    const { pdfBuffer, pdfFileRecord } = await PdfService.processPdfPipeline({
      markdown,
      metadata,
      userId,
      basePath,
      saveToServer,
      sourceFileId,
    });

    const pdfFilename = pdfFileRecord?.originalName || 'report.pdf';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFilename}"`,
        ...(pdfFileRecord
          ? {
              'X-Generated-Pdf-Id': pdfFileRecord.id,
              'X-Generated-Pdf-Url': pdfFileRecord.url || '',
            }
          : {}),
      },
    });
  } catch (error: unknown) {
    logger.error('PDF Generation Route Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 },
    );
  }
}
