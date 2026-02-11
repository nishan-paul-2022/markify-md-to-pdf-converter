import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import { getDefaultFiles } from "@/lib/server/defaults"

// Note: Prisma Client was regenerated to include batchId and relativePath.
// If you see errors below, please restart your IDE's TypeScript server.

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    console.log('🔐 File upload - Auth check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id 
    });
    
    if (!session?.user?.id) {
      console.error('❌ File upload REJECTED - No authentication');
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    console.log('✅ File upload - User authenticated:', session.user.id);

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const batchId = formData.get("batchId") as string | null
    const relativePath = formData.get("relativePath") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Selection exceeds 10MB limit." },
        { status: 400 }
      )
    }

    // Validate file type (markdown and images only - NO PDFs, NO TXT)
    const allowedTypes = [
      "text/markdown",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ]
    
    // Some browsers might not send correct mime types for .md files
    const isMarkdown = file.name.endsWith(".md") || file.type === "text/markdown"
    
    if (!allowedTypes.includes(file.type) && !isMarkdown) {
      console.log(`❌ Upload rejected - invalid file type: ${file.type} for file: ${file.name}`);
      return NextResponse.json(
        { error: "Upload failed — only .md file is allowed here." },
        { status: 400 }
      )
    }

    // --- STRICT PATH VALIDATION (Server Side) ---
    if (batchId && relativePath) {
      const normalizedPath = relativePath.replace(/\\/g, '/').replace(/^\//, '');
      const actualParts = normalizedPath.split('/');
      
      // Handle potential wrapper folder (common in browser folder uploads)
      // If the first part is NOT 'images' and it's not a root file, treat it as a wrapper
      let effectiveParts = actualParts;
      if (actualParts.length > 1 && actualParts[0] !== 'images') {
        effectiveParts = actualParts.slice(1);
      }

      // Rule 1: Root level files (effective) MUST be .md
      if (effectiveParts.length === 1) {
        if (!effectiveParts[0].toLowerCase().endsWith('.md')) {
          return NextResponse.json(
            { error: "Upload failed — only .md file is allowed here." },
            { status: 400 }
          );
        }
      }
      // Rule 2: Subfolder files (effective) MUST be in 'images/'
      else if (effectiveParts.length === 2) {
        if (effectiveParts[0] !== 'images') {
          return NextResponse.json(
            { error: "Project structure is invalid. Ensure it follows the required .md + images/ layout." },
            { status: 400 }
          );
        }
        // Subfolder files MUST be images
        const isImage = allowedTypes.includes(file.type);
        if (!isImage) {
           return NextResponse.json(
            { error: "Project structure is invalid. Ensure it follows the required .md + images/ layout." },
            { status: 400 }
          );
        }
      }
      // Rule 3: No nested folders or depth > 2 (effective)
      else {
        return NextResponse.json(
          { error: "Project structure is invalid. Ensure it follows the required .md + images/ layout." },
          { status: 400 }
        );
      }
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${randomUUID()}.${fileExtension}`
    
    // We store the file in a structure that allows linking if it's part of a batch
    // If relativePath exists, we can use it, but for storage convenience we still use UUID
    // However, if we want to preserve the structure on disk for easier Markdown processing:
    const storageKey = batchId 
      ? `uploads/${session.user.id}/${batchId}/${relativePath || file.name}`
      : `uploads/${session.user.id}/${uniqueFilename}`

    // Create upload directory if it doesn't exist
    const relativeStorageDir = batchId 
      ? join("uploads", session.user.id, batchId)
      : join("uploads", session.user.id)
      
    const uploadDir = join(process.cwd(), "public", relativeStorageDir)
    
    if (relativePath && relativePath.includes("/")) {
      const subDir = relativePath.substring(0, relativePath.lastIndexOf("/"))
      await mkdir(join(uploadDir, subDir), { recursive: true })
    } else {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(process.cwd(), "public", storageKey)
    
    console.log('💾 Saving file to disk:', filePath);
    console.log('📦 Buffer size:', buffer.length);
    await writeFile(filePath, buffer)
    
    // Verify file existence immediately
    try {
      // proper check using fs stat
      const { stat } = await import('fs/promises');
      const stats = await stat(filePath);
      console.log('✅ File saved successfully. Size on disk:', stats.size);
    } catch (verErr) {
      console.error('❌ CRITICAL: File does not exist after write!', filePath, verErr);
      throw new Error(`File write verified failed: ${filePath}`);
    }

    // Save file metadata to database (non-blocking - file is already on disk)
    let fileRecord;
    try {
      fileRecord = await prisma.file.create({
        data: {
          userId: session.user.id,
          batchId,
          filename: uniqueFilename,
          originalName: file.name,
          relativePath,
          mimeType: file.type || (isMarkdown ? "text/markdown" : "application/octet-stream"),
          size: file.size,
          storageKey,
          url: `/api/${storageKey}`,
        },
      })
      console.log('✅ File metadata saved to database');
    } catch (dbError) {
      console.error('❌ DATABASE SAVE FAILED:', dbError);
      // Create a mock record for response so the UI doesn't break immediately,
      // but the user will need to fix their session/database for persistence.
      fileRecord = {
        id: uniqueFilename,
        filename: uniqueFilename,
        originalName: file.name,
        url: `/${storageKey}`,
        size: file.size,
        mimeType: file.type || (isMarkdown ? "text/markdown" : "application/octet-stream"),
        batchId,
        relativePath,
        createdAt: new Date(),
      };
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        url: fileRecord.url,
        size: fileRecord.size,
        mimeType: fileRecord.mimeType,
        batchId: fileRecord.batchId,
        relativePath: fileRecord.relativePath,
        createdAt: fileRecord.createdAt,
      },
    })
  } catch (error: unknown) {
    console.error("File upload error detailed:", error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const [files, total, defaults] = await Promise.all([
      prisma.file.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          size: true,
          url: true,
          batchId: true,
          relativePath: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.file.count({
        where: { userId: session.user.id },
      }),
      getDefaultFiles().catch(() => []),
    ])

    return NextResponse.json({
      files: [...defaults, ...files],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: unknown) {
    console.error("❌ File fetch error detailed:", error)
    if (error instanceof Error) {
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
    return NextResponse.json(
      { error: "Failed to fetch files", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400 }
      )
    }

    // Find all files to get their storage keys
    const files = await prisma.file.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id,
      },
    })

    // Delete files from disk
    const deletePromises = files.map(async (file) => {
      try {
        const filePath = join(process.cwd(), "public", file.storageKey)
        await unlink(filePath)
      } catch (error: unknown) {
        console.error(`Error deleting file from disk: ${file.storageKey}`, error)
      }
    })

    const { unlink } = await import("fs/promises")
    await Promise.all(deletePromises)

    // Delete records from database
    await prisma.file.deleteMany({
      where: {
        id: { in: files.map(f => f.id) },
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `${files.length} files deleted successfully`,
    })
  } catch (error: unknown) {
    console.error("Bulk deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, type, newName, batchId, oldPath } = await request.json()

    if (!newName || !newName.trim()) {
      return NextResponse.json(
        { error: "New name is required" },
        { status: 400 }
      )
    }

    // Protection for default project and document
    if (id?.startsWith("default-") || batchId === 'no-batch' || (id && id.includes('folder-no-batch'))) {
      return NextResponse.json(
        { error: "Changing default project or document is not allowed" },
        { status: 403 }
      )
    }

    if (type === "folder") {
      if (!batchId || !oldPath) {
        return NextResponse.json(
          { error: "BatchId and oldPath required for folder rename" },
          { status: 400 }
        )
      }

      // Rename all files in this folder by updating their relativePath
      const files = await prisma.file.findMany({
        where: {
          userId: session.user.id,
          batchId: batchId,
          relativePath: {
            startsWith: oldPath
          }
        }
      })

      const updates = files.map(file => {
        const relativePath = file.relativePath || "";
        const pathParts = relativePath.split('/');
        const oldPathParts = oldPath.split('/');
        
        // Check if it's a true prefix (matching full path segments)
        let matches = true;
        for (let i = 0; i < oldPathParts.length; i++) {
          if (pathParts[i] !== oldPathParts[i]) {
            matches = false;
            break;
          }
        }
        
        if (!matches) {return null;}
        
        // Replace segments
        const newPathParts = [...pathParts];
        newPathParts[oldPathParts.length - 1] = newName;
        const newPath = newPathParts.join('/');

        return prisma.file.update({
          where: { id: file.id },
          data: {
            relativePath: newPath,
          }
        })
      }).filter((p): p is NonNullable<typeof p> => p !== null);

      await Promise.all(updates);

      return NextResponse.json({ success: true })
    } else {
      // Single file rename
      const file = await prisma.file.findUnique({
        where: { id, userId: session.user.id }
      })

      if (!file) {
        return NextResponse.json(
          { error: "File not found" },
          { status: 404 }
        )
      }

      // Update originalName and relativePath
      let newRelativePath = file.relativePath;
      if (newRelativePath) {
        const parts = newRelativePath.split('/');
        parts[parts.length - 1] = newName;
        newRelativePath = parts.join('/');
      }

      await prisma.file.update({
        where: { id },
        data: {
          originalName: newName,
          relativePath: newRelativePath || newName
        }
      })

      return NextResponse.json({ success: true })
    }
  } catch (error: unknown) {
    console.error("Rename error:", error)
    return NextResponse.json(
      { error: "Failed to rename" },
      { status: 500 }
    )
  }
}
