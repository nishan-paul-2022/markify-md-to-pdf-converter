import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import path7za from "7zip-bin";
import { exec } from "child_process";
import { randomUUID } from "crypto";
import { mkdir, readdir, rm, stat,writeFile } from "fs/promises";
import { join, relative } from "path";
import { promisify } from "util";

const execPromise = promisify(exec);

// Robust way to find 7za binary:
// 1. Try system-wide '7za' command
// 2. Fallback to 7zip-bin package path
async function get7zaPath() {
  try {
    await execPromise('7za --help');
    return '7za';
  } catch {
    return path7za.path7za;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const path7zaBinary = await get7zaPath();
  let tempDir = "";
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const archiveFile = formData.get("file") as File | null;
    const source = formData.get("source") as string | null; // 'editor' or 'converter'

    if (!archiveFile) {
      return NextResponse.json({ error: "No archive provided" }, { status: 400 });
    }

    // 1. Create a unique temp directory for extraction
    const batchId = randomUUID();
    tempDir = join(process.cwd(), "tmp", batchId);
    await mkdir(tempDir, { recursive: true });

    // 2. Save the archive to temp directory
    const archivePath = join(tempDir, archiveFile.name);
    const buffer = Buffer.from(await archiveFile.arrayBuffer());
    await writeFile(archivePath, buffer);

    // 3. Extract using 7za
    // -y: assume Yes on all queries
    // -o: set output directory
    const extractDir = join(tempDir, "extracted");
    await mkdir(extractDir, { recursive: true });

    try {
      await execPromise(`"${path7zaBinary}" x "${archivePath}" -o"${extractDir}" -y`);
    } catch (extractError) {
      console.error("Extraction error:", extractError);
      return NextResponse.json({ error: "Failed to extract archive. Ensure it is a valid ZIP, 7Z, RAR, or TAR file." }, { status: 400 });
    }

    // 4. Recursively find all files
    const RAW_FILES: { name: string; relativePath: string; fullPath: string; size: number }[] = [];

    async function walk(dir: string, base: string) {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = relative(base, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          // Skip system directories like __MACOSX
          if (entry.name === '__MACOSX' || entry.name.startsWith('.')) { continue; }
          await walk(fullPath, base);
        } else {
          // Skip system files like .DS_Store or files starting with .
          if (entry.name.startsWith('.')) { continue; }

          const stats = await stat(fullPath);
          RAW_FILES.push({
            name: entry.name,
            relativePath: relPath,
            fullPath,
            size: stats.size
          });
        }
      }
    }
    await walk(extractDir, extractDir);

    // Filtered list of files for logic processing
    const allFiles = RAW_FILES;

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Archive is empty or only contains invalid files." }, { status: 400 });
    }

    // 5. Apply the same validation rules as single file/folder uploads
    // Rule: Must contain at least one .md file
    const mdFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.md'));
    if (mdFiles.length === 0) {
       return NextResponse.json({ error: "Upload failed — only .md files are allowed here." }, { status: 400 });
    }

    // Determine if there's a common wrapper folder to strip
    // A wrapper exists if all files share the same first path segment,
    // and that segment is NOT "images", and no files are at the root level relative to it.
    const firstSegments = new Set(allFiles.map(f => f.relativePath.split('/')[0]));
    const hasWrapper = firstSegments.size === 1 &&
                       ![...firstSegments][0].toLowerCase().endsWith('.md') &&
                       [...firstSegments][0].toLowerCase() !== 'images';

    // Strict Path Validation Logic (Mirrored from single file route)
    const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    const validFiles: typeof allFiles = [];

    for (const file of allFiles) {
      const actualParts = file.relativePath.split('/');
      const effectiveParts = hasWrapper ? actualParts.slice(1) : actualParts;

      if (effectiveParts.length === 0) { continue; }

      const fileName = file.name.toLowerCase();
      const isMd = fileName.endsWith('.md');
      const isImage = allowedImageExtensions.some(ext => fileName.endsWith(ext));

      // Rule 1: Root level files (effective) MUST be .md
      if (effectiveParts.length === 1) {
        if (!isMd) {
          return NextResponse.json({ error: `Upload failed — only .md files are allowed at the root. Found: ${file.relativePath}` }, { status: 400 });
        }
        validFiles.push(file);
      }
      // Rule 2: Subfolder level
      else if (effectiveParts.length === 2) {
        // Option A: Root-level images/ folder
        if (effectiveParts[0].toLowerCase() === 'images') {
          if (!isImage) {
            return NextResponse.json({ error: `Upload failed — only images are allowed in the images/ folder. Found: ${file.relativePath}` }, { status: 400 });
          }
          validFiles.push(file);
        }
        // Option B: A project's root file (e.g., FolderA/note.md)
        else {
          if (!isMd) {
            return NextResponse.json({ error: `Upload failed — ensure it follows the required .md + images/ layout. Invalid file in folder: ${file.relativePath}` }, { status: 400 });
          }
          validFiles.push(file);
        }
      }
      // Rule 3: Depth 3 level (e.g., Project/images/file.png)
      else if (effectiveParts.length === 3) {
        if (effectiveParts[1].toLowerCase() !== 'images') {
          return NextResponse.json({ error: `Upload failed — nested folders are only allowed for 'images/'. Invalid path: ${file.relativePath}` }, { status: 400 });
        }
        if (!isImage) {
          return NextResponse.json({ error: `Upload failed — only images are allowed in 'images/' folders. Found: ${file.relativePath}` }, { status: 400 });
        }
        validFiles.push(file);
      }
      // Rule 4: Too deep
      else {
        return NextResponse.json({ error: `Upload failed — directory structure too deep (max 1 subfolder level allowed): ${file.relativePath}` }, { status: 400 });
      }
    }

    // 6. Save valid files
    const uploadResults = [];
    const userDir = join(process.cwd(), "public", "uploads", session.user.id, batchId);
    await mkdir(userDir, { recursive: true });

    for (const file of validFiles) {
       // Normalize the relative path for saving (remove wrapper if any)
       const actualParts = file.relativePath.split('/');
       const savedRelPath = hasWrapper ? actualParts.slice(1).join('/') : file.relativePath;

       const storageKey = `uploads/${session.user.id}/${batchId}/${savedRelPath}`;
       const destinationPath = join(process.cwd(), "public", storageKey);

       // Ensure subdirectories exist
       if (savedRelPath.includes('/')) {
         await mkdir(join(userDir, savedRelPath.substring(0, savedRelPath.lastIndexOf('/'))), { recursive: true });
       }

       // Move file
       const { readFile } = await import('fs/promises');
       const fileContent = await readFile(file.fullPath);
       await writeFile(destinationPath, fileContent);

       const isMd = file.name.toLowerCase().endsWith('.md');

       const fileRecord = await prisma.file.create({
         data: {
           userId: session.user.id,
           batchId,
           filename: randomUUID() + '.' + (file.name.split('.').pop() || 'file'),
           originalName: file.name,
           relativePath: savedRelPath,
           mimeType: isMd ? "text/markdown" : "image/octet-stream",
           size: file.size,
           storageKey,
           url: `/api/${storageKey}`,
           metadata: source ? { source } : undefined,
         },
       });
       uploadResults.push(fileRecord);
    }

    return NextResponse.json({
      success: true,
      batchId,
      files: uploadResults
    });

  } catch (error: unknown) {
    console.error("Archive upload error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  } finally {
    // 7. Cleanup temp directory
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  }
}
