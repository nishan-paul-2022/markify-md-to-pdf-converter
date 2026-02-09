import { readdir, stat } from "fs/promises"
import { join } from "path"

export interface DefaultFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath?: string;
  batchId?: string;
  createdAt: string;
}

async function getFilesRecursively(dir: string, baseDir: string, batchId: string, projectName: string): Promise<DefaultFile[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: DefaultFile[] = []

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    
    const fullPath = join(dir, entry.name)
    const relativeToPublic = fullPath.split("public")[1]
    const relativeToProject = fullPath.split(baseDir)[1].replace(/^\//, "")
    
    if (entry.isDirectory()) {
      const subFiles = await getFilesRecursively(fullPath, baseDir, batchId, projectName)
      files.push(...subFiles)
    } else {
      const ext = entry.name.split(".").pop()?.toLowerCase() || ""
      const validImageExts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
      
      // Strict Structure Validation Logic
      // 1. Root Level: Only .md files allowed
      if (!relativeToProject.includes("/")) {
        if (ext !== "md") continue;
      } 
      // 2. Subfolder Level: Must be "images/" and contain only images
      else {
        const parts = relativeToProject.split("/");
        
        // Only allow 1 level deep (images/file.png)
        // However, relativeToProject for "content-4/images/img.png" might be just "images/img.png" if baseDir is correct
        // But getFilesRecursively calls recursively, so relativeToProject is calculated relative to baseDir.
        // Let's ensure we are checking the path correctly.
        // The implementation assumes relativeToProject is correct.
        
        if (parts.length > 2) continue; // Reject deep nesting
        
        // If it has subdirectory, it MUST be "images"
        if (parts.length === 2 && parts[0] !== "images") continue;
        
        // If it is in images folder, must be image
        if (parts.length === 2 && !validImageExts.includes(ext)) continue;
      }
      
      const stats = await stat(fullPath)
      
      let mimeType = "application/octet-stream"
      if (ext === "md") mimeType = "text/markdown"
      else if (validImageExts.includes(ext)) mimeType = `image/${ext === "svg" ? "svg+xml" : ext}`

      files.push({
        id: `default-${batchId}-${relativeToProject.replace(/\//g, "-")}`,
        filename: entry.name,
        originalName: entry.name,
        mimeType,
        size: stats.size,
        url: relativeToPublic.replace(/\\/g, "/"),
        relativePath: projectName ? `${projectName}/${relativeToProject}`.replace(/\\/g, "/") : relativeToProject.replace(/\\/g, "/"),
        batchId: batchId,
        createdAt: stats.birthtime.toISOString()
      })
    }
  }

  return files
}

export async function getDefaultFiles(): Promise<DefaultFile[]> {
  const publicDir = join(process.cwd(), "public")
  
  const content1Dir = join(publicDir, "content-1")
  const content4Dir = join(publicDir, "content-4")
  
  const files1 = await getFilesRecursively(content1Dir, content1Dir, "sample-document", "")
  const files4 = await getFilesRecursively(content4Dir, content4Dir, "sample-project", "sample-project")
  
  return [...files1, ...files4]
}
