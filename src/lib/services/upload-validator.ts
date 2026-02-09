export interface ValidationResult {
  case: number;
  valid: boolean;
  error?: string;
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
 * @returns ValidationResult with case number and validity status
 */
export function validateUploadStructure(files: File[]): ValidationResult {
  if (files.length === 0) {
    return { case: 0, valid: false, error: "No files selected." };
  }

  // Determine if it's a folder upload by checking webkitRelativePath
  // In most browsers, webkitRelativePath is populated when a directory is chosen
  const isFolderUpload = files.some(f => f.webkitRelativePath && f.webkitRelativePath.includes('/'));

  // 1. Independent File Uploads (Case 1 & 2)
  if (!isFolderUpload) {
    for (const file of files) {
      if (file.name.startsWith('.')) {
        return { 
          case: files.length === 1 ? 1 : 2, 
          valid: false, 
          error: `Hidden files like "${file.name}" are not allowed.` 
        };
      }
      if (!file.name.toLowerCase().endsWith('.md')) {
        return { 
          case: files.length === 1 ? 1 : 2, 
          valid: false, 
          error: `Invalid file type: "${file.name}". Only .md files are allowed for independent file uploads.` 
        };
      }
    }
    return { 
      case: files.length === 1 ? 1 : 2, 
      valid: true 
    };
  }

  // 2. Folder Uploads (Case 3 & 4) - "Strict Check"
  let rootDirName = "";
  let mdFilesInRootCount = 0;

  for (const file of files) {
    const pathParts = file.webkitRelativePath.split('/');
    
    // Safety check for browser inconsistencies
    if (pathParts.length < 2) {
      // If we are in folder mode but find a file without a path, reject it
      return { case: 3, valid: false, error: "Invalid path structure detected. Please upload a single folder." };
    }
    
    const currentRoot = pathParts[0];
    if (!rootDirName) {rootDirName = currentRoot;}
    
    if (currentRoot !== rootDirName) {
      return { case: 3, valid: false, error: "Multiple root folders detected. Please upload only one folder at a time." };
    }

    const subPath = pathParts.slice(1); // Path within the root
    const fileName = file.name;

    // Check for hidden files anywhere in the structure
    if (fileName.startsWith('.')) {
      return { 
        case: 3, 
        valid: false, 
        error: `Unauthorized hidden file found: "${file.webkitRelativePath}".` 
      };
    }

    // Rule: Root level can ONLY have .md files or an "images/" directory
    if (subPath.length === 1) {
      // It's a file directly inside the root
      if (!fileName.toLowerCase().endsWith('.md')) {
        return { 
          case: 3, 
          valid: false, 
          error: `Invalid file in folder root: "${fileName}". Only .md files and an "images/" folder are allowed.` 
        };
      }
      mdFilesInRootCount++;
    } else if (subPath.length === 2) {
      // It's one level deep (should be inside images/)
      const subDir = subPath[0];
      if (subDir !== "images") {
        return { 
          case: 3, 
          valid: false, 
          error: `Unauthorized folder "${subDir}/" found. Only "images/" is allowed at the root.` 
        };
      }
      
      // Check if it's an allowed image
      const isImage = ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.toLowerCase().endsWith(ext));
      if (!isImage) {
        return { 
          case: 3, 
          valid: false, 
          error: `Unauthorized file in images folder: "${fileName}". Only image files (png, jpg, etc.) are allowed.` 
        };
      }
    } else {
      // More than 2 parts in subPath means nested folders like images/subfolder/test.png
      return { 
        case: 3, 
        valid: false, 
        error: `Structure too deep: "${file.webkitRelativePath}". Nested folders are not supported.` 
      };
    }
  }

  if (mdFilesInRootCount === 0) {
    return { 
      case: 3, 
      valid: false, 
      error: "No Markdown (.md) files found in the root of the uploaded folder." 
    };
  }

  return {
    case: mdFilesInRootCount === 1 ? 3 : 4,
    valid: true
  };
}
