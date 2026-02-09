export interface ValidationResult {
  case: number;
  valid: boolean;
  error?: string;
  filteredFiles: File[];
}

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/**
 * Normalizes a file path to remove leading ./ and ../ and ensure consistent slashes
 */
const normalizePath = (path: string): string => {
  return path.replace(/\\/g, '/')
             .replace(/^\.\//, '')
             .replace(/\/\.\//g, '/')
             .replace(/^\//, '');
};

/**
 * Extract image references from markdown content
 */
export const extractImageReferences = (markdownContent: string): Set<string> => {
  const imageRefs = new Set<string>();
  
  // Standard Markdown images: ![alt](path)
  const mdImageRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  // HTML img tags: <img src="path">
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  
  let match;
  while ((match = mdImageRegex.exec(markdownContent)) !== null) {
    const url = match[2];
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      imageRefs.add(normalizePath(url));
    }
  }
  
  while ((match = htmlImageRegex.exec(markdownContent)) !== null) {
    const url = match[1];
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
      imageRefs.add(normalizePath(url));
    }
  }
  
  return imageRefs;
};

/**
 * Validates the structure of uploaded files and classifies them into 4 cases.
 */
export function validateUploadStructure(files: File[], referencedImages: Set<string> = new Set()): ValidationResult {
  if (files.length === 0) {
    return { case: 0, valid: false, error: "No files selected.", filteredFiles: [] };
  }

  // Determine if it's a folder upload
  const isFolderUpload = files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
  const filteredFiles: File[] = [];

  // --- Independent File Uploads (Case 1 & 2) ---
  if (!isFolderUpload) {
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (!file.name.startsWith('.') && fileName.endsWith('.md')) {
        filteredFiles.push(file);
      }
    }

    if (filteredFiles.length === 0) {
      return { 
        case: 1, 
        valid: false, 
        error: "No valid Markdown (.md) files found in selection.",
        filteredFiles: []
      };
    }

    return { 
      case: filteredFiles.length === 1 ? 1 : 2, 
      valid: true,
      filteredFiles
    };
  }

  // --- Folder Uploads (Case 3 & 4) ---
  
  // First, determine the effective root depth.
  // If we drop a folder 'Project', files are 'Project/file.md'. Root depth = 1 (Folder name)
  // If we drop contents of 'Project', files are 'file.md' and 'images/img.png'. Root depth = 0.
  
  let mdFilesInRootCount = 0;
  const violations: string[] = [];

  // Identify root depth by looking for the first part of paths
  const firstParts = new Set<string>();
  files.forEach(f => {
    const path = normalizePath(f.webkitRelativePath || "");
    if (path.includes('/')) {
      firstParts.add(path.split('/')[0]);
    }
  });

  // If there's exactly one first part and NO files are at depth 0, it's a single folder drop
  const isSingleFolderDrop = firstParts.size === 1 && !files.some(f => !(f.webkitRelativePath || "").includes('/'));

  for (const file of files) {
    const fullPath = normalizePath(file.webkitRelativePath || file.name);
    const pathParts = fullPath.split('/');
    const fileName = file.name;
    
    if (fileName.startsWith('.')) {continue;}

    // Adjust subPath based on whether we are in a single root folder or virtual root
    const subParts = isSingleFolderDrop ? pathParts.slice(1) : pathParts;
    const internalPath = subParts.join('/');
    
    // Violation check: Forbidden folders/depths
    if (subParts.length > 2 || (subParts.length === 2 && subParts[0] !== 'images')) {
      violations.push(`Unauthorized folder structure: ${fullPath}`);
      continue; // Move to next file, don't even consider this for filtering
    }

    if (subParts.length === 1) {
      // Root level file
      if (fileName.toLowerCase().endsWith('.md')) {
        filteredFiles.push(file);
        mdFilesInRootCount++;
      } else {
        violations.push(`Invalid root file '${fileName}'. Only .md files are allowed at root.`);
      }
    } 
    else if (subParts.length === 2 && subParts[0] === 'images') {
      const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
      if (isImage) {
        // STRICT REFERENCE CHECKING
        const isReferenced = referencedImages.has(internalPath) || 
                           referencedImages.has(fileName);

        if (isReferenced) {
          filteredFiles.push(file);
        } else {
          // It's in the images folder but not referenced - we don't call it a violation,
          // we just quietly don't include it. 
          console.log(`ℹ️ Filtering out unreferenced image: ${fullPath}`);
        }
      } else {
        violations.push(`Non-image file '${fileName}' in images/ folder.`);
      }
    }
  }

  if (mdFilesInRootCount === 0) {
    return { 
      case: 3, 
      valid: false, 
      error: "No Markdown (.md) files found in the project root.",
      filteredFiles: []
    };
  }

  // CRITICAL: If there are ANY violations (like an unused-folder), block the ENTIRE upload
  if (violations.length > 0) {
    return {
      case: mdFilesInRootCount === 1 ? 3 : 4,
      valid: false,
      error: `Upload blocked! Invalid structure detected:\n${violations.slice(0, 3).join('\n')}${violations.length > 3 ? `\n...and ${violations.length - 3} more` : ''}`,
      filteredFiles: []
    };
  }

  return {
    case: mdFilesInRootCount === 1 ? 3 : 4,
    valid: true,
    filteredFiles
  };
}
