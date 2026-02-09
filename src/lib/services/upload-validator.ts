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
  const violations: string[] = [];

  // --- Independent File Uploads (Strict) ---
  if (!isFolderUpload) {
    for (const file of files) {
      if (file.name.startsWith('.')) {continue;}
      if (file.name.toLowerCase().endsWith('.md')) {
        filteredFiles.push(file);
      } else {
        violations.push(`Forbidden file '${file.name}'. Only .md files are allowed in selective mode.`);
      }
    }

    if (violations.length > 0) {
      return {
        case: filteredFiles.length <= 1 ? 1 : 2,
        valid: false,
        error: `Selection rejected! Invalid files detected:\n${violations.slice(0, 3).join('\n')}`,
        filteredFiles: []
      };
    }

    if (filteredFiles.length === 0) {
      return { case: 1, valid: false, error: "No Markdown (.md) files found in selection.", filteredFiles: [] };
    }

    return { 
      case: filteredFiles.length === 1 ? 1 : 2, 
      valid: true,
      filteredFiles
    };
  }

  // --- Folder Uploads (Strict) ---
  const firstParts = new Set<string>();
  files.forEach(f => {
    const path = normalizePath(f.webkitRelativePath || "");
    if (path.includes('/')) {
      firstParts.add(path.split('/')[0]);
    }
  });

  const isSingleFolderDrop = firstParts.size === 1 && !files.some(f => !(f.webkitRelativePath || "").includes('/'));
  
  const subdirectories = new Set<string>();
  const foundImageRefs = new Set<string>();
  let mdFilesInRootCount = 0;

  for (const file of files) {
    const fullPath = normalizePath(file.webkitRelativePath || file.name);
    const pathParts = fullPath.split('/');
    const fileName = file.name;
    
    if (fileName.startsWith('.')) {continue;}

    const subParts = isSingleFolderDrop ? pathParts.slice(1) : pathParts;
    const internalPath = subParts.join('/');
    
    if (subParts.length > 1) {
      subdirectories.add(subParts[0]);
    }

    if (subParts.length === 1) {
      if (fileName.toLowerCase().endsWith('.md')) {
        filteredFiles.push(file);
        mdFilesInRootCount++;
      } else {
        violations.push(`Violation: Unexpected file at root: ${fullPath}`);
      }
    } 
    else if (subParts.length === 2 && subParts[0] === 'images') {
      const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
      if (isImage) {
        // FAST REFERENCE CHECKING
        const isReferenced = referencedImages.has(internalPath) || referencedImages.has(fileName);

        if (isReferenced) {
          filteredFiles.push(file);
          if (referencedImages.has(internalPath)) {foundImageRefs.add(internalPath);}
          if (referencedImages.has(fileName)) {foundImageRefs.add(fileName);}
        } else {
          violations.push(`Violation: Unreferenced image in images/ folder: ${fileName}`);
        }
      } else {
        violations.push(`Violation: Non-image file in images/ folder: ${fileName}`);
      }
    } else {
      violations.push(`Violation: Unauthorized structure: ${fullPath}`);
    }
  }

  // Final structural integrity checks
  // Rule: Folder must have .md file(s) in root
  if (mdFilesInRootCount === 0) {
    violations.push("Critical: No Markdown files found in the root of the folder.");
  }

  // Rule: Only one subfolder allowed, and it must be named "images/"
  if (subdirectories.size === 0) {
    if (referencedImages.size > 0) {
      violations.push("Critical: Markdown references images but 'images/' subfolder is missing.");
    }
  } else if (subdirectories.size > 1 || !subdirectories.has('images')) {
    const others = Array.from(subdirectories).filter(s => s !== 'images');
    violations.push(`Critical: Unauthorized folders: ${others.join(', ')}. Only one subfolder named 'images/' is allowed.`);
  }

  // Ensure all referenced images are present
  referencedImages.forEach(ref => {
    if (!foundImageRefs.has(ref)) {
      violations.push(`Critical: Referenced image missing from images/ folder: ${ref}`);
    }
  });

  if (violations.length > 0) {
    return {
      case: mdFilesInRootCount === 1 ? 3 : 4,
      valid: false,
      error: `Project structural violation! Upload blocked:\n${violations.slice(0, 5).join('\n')}${violations.length > 5 ? `\n...and ${violations.length - 5} more` : ''}`,
      filteredFiles: []
    };
  }

  return {
    case: mdFilesInRootCount === 1 ? 3 : 4,
    valid: true,
    filteredFiles
  };
}
