import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/drafts/[fileId]
 * Fetch the draft for a specific file
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { fileId } = await params;

    const draft = await prisma.fileDraft.findUnique({
      where: {
        fileId_userId: {
          fileId,
          userId: user.id,
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({
      draft: {
        content: draft.content,
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 });
  }
}

/**
 * POST /api/drafts/[fileId]
 * Save or update a draft for a specific file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { fileId } = await params;
    const { content } = await request.json();

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    // Verify the file exists and belongs to the user
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: user.id,
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Upsert the draft
    const draft = await prisma.fileDraft.upsert({
      where: {
        fileId_userId: {
          fileId,
          userId: user.id,
        },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        fileId,
        userId: user.id,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      updatedAt: draft.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts/[fileId]
 * Delete a draft for a specific file
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { fileId } = await params;

    await prisma.fileDraft.deleteMany({
      where: {
        fileId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}
