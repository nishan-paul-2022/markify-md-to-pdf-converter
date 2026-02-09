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
      const ext = entry.name.split(".").pop()?.toLowerCase()
      if (ext === "pdf") continue; // Ignore PDF files
      
      const stats = await stat(fullPath)
      
      let mimeType = "application/octet-stream"
      if (ext === "md") mimeType = "text/markdown"
      else if (ext === "png") mimeType = "image/png"
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg"
      else if (ext === "webp") mimeType = "image/webp"
      else if (ext === "gif") mimeType = "image/gif"

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
