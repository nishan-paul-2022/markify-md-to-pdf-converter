/**
 * MARKIFY UPLOAD VALIDATOR - PRODUCTION GRADE
 * 
 * Implements strict validation rules as defined in docs/upload-rules.md
 * 
 * Rules Summary:
 * 1. Single/Multiple File Upload: Only .md files allowed
 * 2. Folder Upload: 
 *    - Only .md files at root
 *    - Optional images/ subfolder with only images
 *    - NO other subfolders
 *    - If images/ exists, ALL images must be referenced
 * 3. Zip Upload: Same as folder rules but allows multiple folders at root
 * 4. Hidden files (.DS_Store, .git, etc.) are auto-ignored
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  filteredFiles: File[];
  case: number;
}

const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

/**
 * Normalize path: remove leading/trailing slashes, convert backslashes
 */
const normalizePath = (path: string): string => {
  return path
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/+/g, '/');
};

/**
 * Check if a path component is hidden or system file
 */
const isHiddenOrSystem = (name: string): boolean => {
  return name.startsWith('.') || name === '__MACOSX';
};

/**
 * Extract all image references from markdown content
 */
const extractImageReferences = (markdownContent: string): Set<string> => {
  const imageRefs = new Set<string>();

  // Markdown syntax: ![alt](path)
  const mdImageRegex = /!\[([^\]]*)]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  // HTML syntax: <img src="path">
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
 * Main validation function
 */
export async function validateUploadStructure(
  files: File[],
  uploadType?: 'single' | 'folder' | 'zip',
): Promise<ValidationResult> {
  if (files.length === 0) {
    return { valid: false, error: 'No files selected.', filteredFiles: [], case: 0 };
  }

  // Determine the actual upload type for routing
  let detectedUploadType: 'single' | 'folder' | 'zip';

  if (uploadType) {
    detectedUploadType = uploadType;
  } else {
    // If uploadType is not specified, detect based on webkitRelativePath
    const hasFolders = files.some(
      (f) => f.webkitRelativePath && f.webkitRelativePath.includes('/'),
    );
    detectedUploadType = hasFolders ? 'folder' : 'single';
  }

  // Filter out hidden/system files
  const cleanFiles = files.filter((file) => {
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    return !parts.some((part) => isHiddenOrSystem(part));
  });

  if (cleanFiles.length === 0) {
    return {
      valid: false,
      error: 'No valid files found (hidden/system files ignored).',
      filteredFiles: [],
      case: 0,
    };
  }

  // Route to appropriate validator
  if (detectedUploadType === 'single') {
    return validateSingleFileUpload(cleanFiles);
  } else {
    // For 'folder' or 'zip' types, use the combined validator
    return await validateFolderOrZipUpload(cleanFiles, detectedUploadType === 'zip');
  }
}

/**
 * RULE 1: Single/Multiple File Upload
 * Only .md files are allowed
 */
function validateSingleFileUpload(files: File[]): ValidationResult {
  const mdFiles: File[] = [];
  const invalidFiles: string[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith('.md')) {
      mdFiles.push(file);
    } else {
      invalidFiles.push(file.name);
    }
  }

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Upload failed — only .md files are allowed. Found: ${invalidFiles.join(', ')}`,
      filteredFiles: [],
      case: 0,
    };
  }

  if (mdFiles.length === 0) {
    return {
      valid: false,
      error: 'No Markdown (.md) files found in selection.',
      filteredFiles: [],
      case: 0,
    };
  }

  return {
    valid: true,
    filteredFiles: mdFiles,
    case: mdFiles.length === 1 ? 1 : 2,
  };
}

/**
 * RULE 2 & 3: Folder/Zip Upload
 * 
 * FOLDER UPLOAD:
 * - Only .md files at root
 * - Optional images/ subfolder (only images allowed)
 * - NO other subfolders
 * - If images/ exists, ALL images must be referenced
 * 
 * ZIP UPLOAD (More Flexible):
 * - Can contain multiple folders at root
 * - Can contain multiple .md files at root
 * - Each folder must follow folder upload rules
 * - Root .md files are allowed alongside folders
 */
async function validateFolderOrZipUpload(
  files: File[],
  isZipUpload: boolean,
): Promise<ValidationResult> {
  // Detect and strip wrapper folder (e.g., "my-project.zip/" wrapper)
  const paths = files.map((f) => normalizePath(f.webkitRelativePath || f.name));
  const topLevelItems = new Set(paths.map((p) => p.split('/')[0]));

  // Detect if there's a wrapper folder that should be stripped
  const hasWrapper = topLevelItems.size === 1 && 
                     paths.every((p) => p.includes('/')) &&
                     ![...topLevelItems][0].toLowerCase().endsWith('.md');

  const mdFiles: File[] = [];
  const imageFiles: { file: File; path: string; name: string; folder: string }[] = [];
  const errors: string[] = [];

  // Group files by their top-level folder (for zip validation)
  const folderGroups = new Map<string, File[]>();

  for (const file of files) {
    const fullPath = normalizePath(file.webkitRelativePath || file.name);
    const parts = fullPath.split('/');

    // Strip wrapper if detected
    const effectiveParts = hasWrapper ? parts.slice(1) : parts;
    if (effectiveParts.length === 0) continue;

    const depth = effectiveParts.length;
    const fileName = file.name.toLowerCase();
    const effectivePath = effectiveParts.join('/');
    const topLevelFolder = effectiveParts.length > 1 ? effectiveParts[0] : '';

    const isMd = fileName.endsWith('.md');
    const isImage = ALLOWED_IMAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    // Group files by folder for validation
    if (!folderGroups.has(topLevelFolder)) {
      folderGroups.set(topLevelFolder, []);
    }
    const group = folderGroups.get(topLevelFolder);
    if (group) {
      group.push(file);
    }

    // Handle root-level .md files (depth 1, no folder)
    if (isMd && depth === 1) {
      // For single folder uploads, .md files at depth 1 mean they're inside the folder root (which is correct)
      // For zip uploads, depth 1 means truly at root (which is allowed)
      // After wrapper stripping, single folder uploads will have .md at depth 1 (folder/file.md -> file.md)
      mdFiles.push(file);
      continue;
    }

    // Handle .md files inside folders (depth 2)
    if (isMd && depth === 2) {
      // For folder uploads (not zip): depth 2 means file is in a subfolder (e.g., docs/file.md)
      // This is NOT allowed - only images/ subfolder is permitted
      if (!isZipUpload) {
        errors.push(
          `Upload failed — no subfolders allowed except 'images/'. Found .md file in subfolder: ${effectivePath}`,
        );
        continue;
      }
      // For zip uploads: depth 2 means file is at a folder's root (e.g., project/file.md)
      // This IS allowed
      mdFiles.push(file);
      continue;
    }

    // .md files deeper than folder root are not allowed
    if (isMd && depth > 2) {
      errors.push(`Upload failed — .md files must be at root or folder root. Found: ${effectivePath}`);
      continue;
    }

    // Handle images (must be in images/ subfolder)
    if (isImage) {
      // For root-level images (not allowed)
      if (depth === 1) {
        errors.push(
          `Upload failed — images must be inside 'images/' subfolder. Found: ${effectivePath}`,
        );
        continue;
      }

      // For images at depth 2 (images/pic.png - root level images folder)
      if (depth === 2) {
        // Must be directly in images/ folder
        if (effectiveParts[0].toLowerCase() === 'images') {
          // Root-level images/ folder
          imageFiles.push({ file, path: effectivePath, name: file.name, folder: '' });
        } else {
          errors.push(
            `Upload failed — images must be inside 'images/' subfolder. Found: ${effectivePath}`,
          );
        }
        continue;
      }

      // For images at depth 3 (folder/images/pic.png)
      if (depth === 3) {
        if (effectiveParts[1].toLowerCase() === 'images') {
          imageFiles.push({ file, path: effectivePath, name: file.name, folder: topLevelFolder });
        } else {
          errors.push(
            `Upload failed — images must be inside 'images/' subfolder. Found: ${effectivePath}`,
          );
        }
        continue;
      }

      // Images deeper than depth 3 are not allowed
      errors.push(
        `Upload failed — images must be inside 'images/' subfolder (max depth 3). Found: ${effectivePath}`,
      );
      continue;
    }

    // RULE: If we reach here, it's either an invalid file type or invalid structure
    // Check for excessive depth (only applies to non-md, non-image files now)
    if (depth > 3) {
      errors.push(
        `Upload failed — directory structure too deep (max 3 levels). Found: ${effectivePath}`,
      );
      continue;
    }

    // RULE: No other file types allowed
    errors.push(`Upload failed — forbidden file type. Found: ${effectivePath}`);
  }

  // RULE: At least one .md file required
  if (mdFiles.length === 0) {
    errors.push('Upload failed — selection must contain at least one .md file.');
  }

  // Return early if structural errors found
  if (errors.length > 0) {
    return {
      valid: false,
      error: errors[0],
      filteredFiles: [],
      case: 0,
    };
  }

  // RULE: If images/ exists, check for orphaned images
  if (imageFiles.length > 0) {
    const allReferences = new Set<string>();

    // Collect all image references from all .md files
    for (const mdFile of mdFiles) {
      const content = await mdFile.text();
      const refs = extractImageReferences(content);

      // Determine the .md file's location to resolve relative paths
      const mdPath = normalizePath(mdFile.webkitRelativePath || mdFile.name);
      const mdParts = mdPath.split('/');
      const mdEffectiveParts = hasWrapper ? mdParts.slice(1) : mdParts;
      const mdFolder = mdEffectiveParts.length > 1 ? mdEffectiveParts[0] : '';

      refs.forEach((ref) => {
        const normalized = normalizePath(ref);
        
        // Add the raw reference
        allReferences.add(normalized);

        // Add just the filename
        const filename = normalized.split('/').pop();
        if (filename) {
          allReferences.add(filename);
        }

        // If the .md file is at root level (no folder)
        if (!mdFolder) {
          // References like "images/pic.png" should match "images/pic.png"
          allReferences.add(normalized);
          
          // Also add with images/ prefix if not present
          if (!normalized.startsWith('images/')) {
            allReferences.add(`images/${normalized}`);
          }
        } else {
          // If the .md file is inside a folder (e.g., "project/main.md")
          // References like "images/pic.png" should match "project/images/pic.png"
          
          // Add the reference as-is
          allReferences.add(normalized);
          
          // Add with folder prefix
          if (!normalized.startsWith(mdFolder + '/')) {
            allReferences.add(`${mdFolder}/${normalized}`);
          }
          
          // Add with images/ prefix if not present
          if (!normalized.startsWith('images/')) {
            allReferences.add(`images/${normalized}`);
            allReferences.add(`${mdFolder}/images/${normalized}`);
          }
          
          // Extract just the "images/filename" part if present
          if (normalized.includes('images/')) {
            const imagesIndex = normalized.indexOf('images/');
            const fromImages = normalized.substring(imagesIndex);
            allReferences.add(fromImages);
            allReferences.add(`${mdFolder}/${fromImages}`);
          }
        }
      });
    }

    // Check each image is referenced
    for (const img of imageFiles) {
      const isReferenced =
        allReferences.has(img.path) ||
        allReferences.has(img.name);

      if (!isReferenced) {
        return {
          valid: false,
          error: `Upload failed — orphaned image found: '${img.path}' is not referenced in any .md file.`,
          filteredFiles: [],
          case: 0,
        };
      }
    }
  }

  return {
    valid: true,
    filteredFiles: [...mdFiles, ...imageFiles.map((i) => i.file)],
    case: 3,
  };
}
