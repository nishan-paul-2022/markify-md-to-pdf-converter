import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { getDefaultFiles } from '@/lib/server/defaults';

import { randomUUID } from 'crypto';
import { mkdir, stat,unlink, writeFile } from 'fs/promises';
import { join } from 'path';

export const ServerFilesService = {
  list: async (userId: string, source?: string | null, page = 1, limit = 100) => {
    const skip = (page - 1) * limit;

    const [files, total, defaults] = await Promise.all([
      prisma.file.findMany({
        where: {
          userId,
          ...(source
            ? {
                metadata: {
                  path: ['source'],
                  equals: source,
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.file.count({
        where: {
          userId,
          ...(source
            ? {
                metadata: {
                  path: ['source'],
                  equals: source,
                },
              }
            : {}),
        },
      }),
      !source || source === 'editor' ? getDefaultFiles().catch(() => []) : Promise.resolve([]),
    ]);

    return {
      files: [...defaults, ...files],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  upload: async (params: {
    userId: string;
    file: File;
    batchId?: string;
    relativePath?: string;
    source?: string;
  }) => {
    const { userId, file, batchId, relativePath, source } = params;

    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const storageKey = batchId
      ? `uploads/${userId}/${batchId}/${relativePath || file.name}`
      : `uploads/${userId}/${uniqueFilename}`;

    const relativeStorageDir = batchId ? join('uploads', userId, batchId) : join('uploads', userId);
    const uploadDir = join(process.cwd(), 'public', relativeStorageDir);

    if (relativePath && relativePath.includes('/')) {
      const subDir = relativePath.substring(0, relativePath.lastIndexOf('/'));
      await mkdir(join(uploadDir, subDir), { recursive: true });
    } else {
      await mkdir(uploadDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(process.cwd(), 'public', storageKey);

    await writeFile(filePath, buffer);

    // Verify
    await stat(filePath);

    const isMarkdown = file.name.endsWith('.md') || file.type === 'text/markdown';

    return prisma.file.create({
      data: {
        userId,
        batchId,
        filename: uniqueFilename,
        originalName: file.name,
        relativePath,
        mimeType: file.type || (isMarkdown ? 'text/markdown' : 'application/octet-stream'),
        size: file.size,
        storageKey,
        url: `/api/${storageKey}`,
        metadata: source ? { source } : undefined,
      },
    });
  },

  bulkDelete: async (userId: string, ids: string[]) => {
    const files = await prisma.file.findMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    const deletePromises = files.map(async (file) => {
      try {
        const filePath = join(process.cwd(), 'public', file.storageKey);
        await unlink(filePath);
      } catch (error) {
        logger.error(`Error deleting file from disk: ${file.storageKey}`, error);
      }
    });

    await Promise.all(deletePromises);

    return prisma.file.deleteMany({
      where: {
        id: { in: files.map((f) => f.id) },
        userId,
      },
    });
  },

  rename: async (userId: string, params: {
    id: string;
    newName: string;
    type: 'file' | 'folder';
    batchId?: string;
    oldPath?: string;
  }) => {
    const { id, type, newName, batchId, oldPath } = params;

    if (type === 'folder') {
      if (!batchId || !oldPath) throw new Error('BatchId and oldPath required');

      const files = await prisma.file.findMany({
        where: {
          userId,
          batchId,
          relativePath: { startsWith: oldPath },
        },
      });

      const updates = files.map((file) => {
        const relativePath = file.relativePath || '';
        const pathParts = relativePath.split('/');
        const oldPathParts = oldPath.split('/');

        let matches = true;
        for (let i = 0; i < oldPathParts.length; i++) {
          if (pathParts[i] !== oldPathParts[i]) {
            matches = false;
            break;
          }
        }

        if (!matches) return null;

        const newPathParts = [...pathParts];
        newPathParts[oldPathParts.length - 1] = newName;
        const newPath = newPathParts.join('/');

        return prisma.file.update({
          where: { id: file.id },
          data: { relativePath: newPath },
        });
      }).filter((update): update is Exclude<typeof update, null> => update !== null);

      return Promise.all(updates);
    } else {
      const file = await prisma.file.findUnique({
        where: { id, userId },
      });

      if (!file) throw new Error('File not found');

      let newRelativePath = file.relativePath;
      if (newRelativePath) {
        const parts = newRelativePath.split('/');
        parts[parts.length - 1] = newName;
        newRelativePath = parts.join('/');
      }

      return prisma.file.update({
        where: { id },
        data: {
          originalName: newName,
          relativePath: newRelativePath || newName,
        },
      });
    }
  }
};
