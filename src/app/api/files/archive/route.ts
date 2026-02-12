import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, rm, readdir, stat } from "fs/promises"
import { join, relative } from "path"
import { randomUUID } from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import path7za from "7zip-bin"

const execPromise = promisify(exec)
const path7zaBinary = path7za.path7za

export async function POST(request: NextRequest): Promise<NextResponse> {
  let tempDir = ""
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const archiveFile = formData.get("file") as File | null
    const source = formData.get("source") as string | null // 'editor' or 'converter'

    if (!archiveFile) {
      return NextResponse.json({ error: "No archive provided" }, { status: 400 })
    }

    // 1. Create a unique temp directory for extraction
    const batchId = randomUUID()
    tempDir = join(process.cwd(), "tmp", batchId)
    await mkdir(tempDir, { recursive: true })

    // 2. Save the archive to temp directory
    const archivePath = join(tempDir, archiveFile.name)
    const buffer = Buffer.from(await archiveFile.arrayBuffer())
    await writeFile(archivePath, buffer)

    // 3. Extract using 7za
    // -y: assume Yes on all queries
    // -o: set output directory
    const extractDir = join(tempDir, "extracted")
    await mkdir(extractDir, { recursive: true })
    
    try {
      await execPromise(`"${path7zaBinary}" x "${archivePath}" -o"${extractDir}" -y`)
    } catch (extractError) {
      console.error("Extraction error:", extractError)
      return NextResponse.json({ error: "Failed to extract archive. Ensure it is a valid ZIP, 7Z, RAR, or TAR file." }, { status: 400 })
    }

    // 4. Recursively find all files
    const allFiles: { name: string; relativePath: string; fullPath: string; size: number }[] = []
    
    async function walk(dir: string, base: string) {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relPath = relative(base, fullPath).replace(/\\/g, '/')
        if (entry.isDirectory()) {
          await walk(fullPath, base)
        } else {
          const stats = await stat(fullPath)
          allFiles.push({
            name: entry.name,
            relativePath: relPath,
            fullPath,
            size: stats.size
          })
        }
      }
    }
    await walk(extractDir, extractDir)

    if (allFiles.length === 0) {
      return NextResponse.json({ error: "Archive is empty." }, { status: 400 })
    }

    // 5. Apply the same validation rules as single file/folder uploads
    // Rule: Must contain at least one .md file
    const mdFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.md'))
    if (mdFiles.length === 0) {
       return NextResponse.json({ error: "Upload failed — only .md files are allowed here." }, { status: 400 })
    }

    // Strict Path Validation Logic (Mirrored from single file route)
    const allowedImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    const validFiles: typeof allFiles = []

    for (const file of allFiles) {
      const normalizedPath = file.relativePath.replace(/^\//, '')
      const actualParts = normalizedPath.split('/')
      
      // Handle potential wrapper folder
      let effectiveParts = actualParts
      if (actualParts.length > 1 && actualParts[0].toLowerCase() !== 'images') {
        // If there's a wrapper, we only allow it if it's the only folder at root level or similar
        // For simplicity, we skip the wrapper if it exists and apply rules to contents
        effectiveParts = actualParts.slice(1)
      }

      const fileName = file.name.toLowerCase()
      const isMd = fileName.endsWith('.md')
      const isImage = allowedImageExtensions.some(ext => fileName.endsWith(ext))

      // Rule 1: Root level files (effective) MUST be .md
      if (effectiveParts.length === 1) {
        if (!isMd) {
          return NextResponse.json({ error: `Upload failed — only .md files are allowed at the root. Found: ${file.relativePath}` }, { status: 400 })
        }
        validFiles.push(file)
      }
      // Rule 2: Subfolder files (effective) MUST be in 'images/' and MUST be images
      else if (effectiveParts.length === 2) {
        if (effectiveParts[0].toLowerCase() !== 'images') {
          return NextResponse.json({ error: `Upload failed — ensure it follows the required .md + images/ layout. Invalid folder: ${effectiveParts[0]}` }, { status: 400 })
        }
        if (!isImage) {
          return NextResponse.json({ error: `Upload failed — only images are allowed in the images/ folder. Found: ${file.relativePath}` }, { status: 400 })
        }
        validFiles.push(file)
      }
      // Rule 3: No nested folders or depth > 2 (effective)
      else {
        return NextResponse.json({ error: `Upload failed — directory structure too deep or invalid: ${file.relativePath}` }, { status: 400 })
      }
    }

    // 6. Save valid files
    const uploadResults = []
    const userDir = join(process.cwd(), "public", "uploads", session.user.id, batchId)
    await mkdir(userDir, { recursive: true })

    for (const file of validFiles) {
       // Normalize the relative path for saving (remove wrapper if any)
       const actualParts = file.relativePath.split('/')
       let savedRelPath = file.relativePath
       if (actualParts.length > 1 && actualParts[0].toLowerCase() !== 'images') {
         savedRelPath = actualParts.slice(1).join('/')
       }

       const storageKey = `uploads/${session.user.id}/${batchId}/${savedRelPath}`
       const destinationPath = join(process.cwd(), "public", storageKey)
       
       // Ensure subdirectories exist
       if (savedRelPath.includes('/')) {
         await mkdir(join(userDir, savedRelPath.substring(0, savedRelPath.lastIndexOf('/'))), { recursive: true })
       }

       // Move file
       const { readFile } = await import('fs/promises')
       const fileContent = await readFile(file.fullPath)
       await writeFile(destinationPath, fileContent)

       const isMd = file.name.toLowerCase().endsWith('.md')
       
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
       })
       uploadResults.push(fileRecord)
    }

    return NextResponse.json({
      success: true,
      batchId,
      files: uploadResults
    })

  } catch (error: unknown) {
    console.error("Archive upload error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  } finally {
    // 7. Cleanup temp directory
    if (tempDir) {
      try {
        await rm(tempDir, { recursive: true, force: true })
      } catch (e) {
        console.error("Cleanup error:", e)
      }
    }
  }
}
