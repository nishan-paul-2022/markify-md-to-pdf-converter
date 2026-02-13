import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { BulkDeleteSchema, FileRenameSchema, FileUploadSchema } from '@/schemas/file-schema';
import { ServerFilesService } from '@/services/files-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    const rawData = {
      batchId: formData.get('batchId'),
      relativePath: formData.get('relativePath'),
      source: formData.get('source'),
    };

    const validation = FileUploadSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Selection exceeds 10MB limit.' }, { status: 400 });
    }

    const { batchId, relativePath, source } = validation.data;

    // Strict Path Validation logic remains in the route or moved to service?
    // The codebase review suggested moving logic to services.
    // I'll keep the specialized validation logic here or move to a helper.

    // Validate file type
    const isMarkdown = file.name.endsWith('.md') || file.type === 'text/markdown';
    const isImage = file.type.startsWith('image/');

    if (!isMarkdown && !isImage) {
      return NextResponse.json(
        { error: 'Upload failed — only .md and images are allowed here.' },
        { status: 400 },
      );
    }

    const fileRecord = await ServerFilesService.upload({
      userId,
      file,
      batchId,
      relativePath,
      source,
    });

    return NextResponse.json({
      success: true,
      file: fileRecord,
    });
  } catch (error: unknown) {
    logger.error('File upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const source = searchParams.get('source');

    const data = await ServerFilesService.list(userId, source, page, limit);
    return NextResponse.json(data);
  } catch (error: unknown) {
    logger.error('File fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = BulkDeleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }

    const result = await ServerFilesService.bulkDelete(userId, validation.data.ids);

    return NextResponse.json({
      success: true,
      message: `${result.count} files deleted successfully`,
    });
  } catch (error: unknown) {
    logger.error('Deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    const userId = session?.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = FileRenameSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.message }, { status: 400 });
    }

    const { id } = validation.data;
    // Protection for default folder and file
    if (id.startsWith('default-') || validation.data.batchId === 'no-batch') {
      return NextResponse.json(
        { error: 'Changing default folder or file is not allowed' },
        { status: 403 },
      );
    }

    await ServerFilesService.rename(userId, validation.data);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('Rename error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Rename failed' },
      { status: 500 },
    );
  }
}
