export interface ValidationResult {
  case: number;
  valid: boolean;
  error?: string;
  filteredFiles: File[];
}

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];

/**
 * Validates the structure of uploaded files and classifies them into 4 cases.
 * 
 * Case 1: Single .md file (Independent)
 * Case 2: Multiple .md files (Independent)
 * Case 3: Folder with 1 .md file + images/ folder
 * Case 4: Folder with Multiple .md files + images/ folder
 * 
 * @param files - Array of File objects from a file input or drag-and-drop
 * @returns ValidationResult with case number, validity status, and filtered file list
 */
export function validateUploadStructure(files: File[]): ValidationResult {
  if (files.length === 0) {
    return { case: 0, valid: false, error: "No files selected.", filteredFiles: [] };
  }

  // Determine if it's a folder upload by checking webkitRelativePath
  const isFolderUpload = files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));
  const filteredFiles: File[] = [];

  // 1. Independent File Uploads (Case 1 & 2)
  if (!isFolderUpload) {
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      // Skip hidden files and only allow .md
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

  // 2. Folder Uploads (Case 3 & 4) - Internal Filtering
  let mdFilesInRootCount = 0;

  for (const file of files) {
    const pathParts = file.webkitRelativePath.split('/');
    
    // Safety check: if we are in folder mode but find a file without a path, skip it 
    // to maintain a clean structured project
    if (pathParts.length < 2) {
      continue;
    }

    const fileName = file.name;
    const subPath = pathParts.slice(1); // Path within the root folder(s)

    // Skip hidden files anywhere
    if (fileName.startsWith('.')) {
      continue;
    }

    // Rule: Root level can ONLY have .md files
    // Images must be in "images/" subfolder
    if (subPath.length === 1) {
      // It's a file directly inside a root folder
      if (fileName.toLowerCase().endsWith('.md')) {
        filteredFiles.push(file);
        mdFilesInRootCount++;
      }
    } else if (subPath.length === 2 && subPath[0].toLowerCase() === 'images') {
      // It's inside "images/" folder - check if it's an image
      const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
      if (isImage) {
        filteredFiles.push(file);
      }
    }
    // Ignore any other file types or locations
  }

  if (mdFilesInRootCount === 0) {
    return { 
      case: 3, 
      valid: false, 
      error: "No Markdown (.md) files found in the root of the uploaded folder(s).",
      filteredFiles: []
    };
  }

  return {
    case: mdFilesInRootCount === 1 ? 3 : 4,
    valid: true,
    filteredFiles
  };
}

