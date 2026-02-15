# Markify Upload Rules

This document outlines the strict validation rules for all upload methods in Markify. These rules ensure that the PDF generation engine receives only supported content and that all assets are correctly managed.

---

## 1. Single/Multiple File Upload
*   **Permitted Files**: One or more `.md` (Markdown) files.
*   **Strict Restriction**: Absolutely no other file types are allowed. Other document formats (PDF, Word, TXT, etc.) are strictly prohibited across all upload methods.

---

## 2. Folder Upload
*   **Subfolder Restriction**: No subfolders are permitted other than an optional **`images/`** directory. Any other nested folder names or deeper nesting levels will fail validation.
*   **File Type Restriction**: 
    *   The **root directory** of the folder must contain only `.md` files.
    *   The **`images/`** subfolder must contain only supported image assets (**`.png`**, **`.jpg`**, **`.jpeg`**, **`.gif`**, **`.webp`**, **`.svg`**).
*   **Referenced Image Rule**: 
    *   An `images/` subfolder is not mandatory. 
    *   **However**, if an `images/` subfolder exists, **every single image** inside it must be referenced in at least one of the `.md` files within that folder. 
    *   **Orphaned images** (images not linked in markdown) will cause the entire upload to fail.

---

## 3. Zip Archive Upload
*   **Multi-Archive Support**: Users can select and upload **one or more** `.zip` archive files at once.
*   **Rule Inheritance**: Zip uploads are essentially a batch of files and folders. Therefore, every single item extracted from the Zip must strictly comply with:
    *   **Section 1** for individual files (Only `.md` allowed).
    *   **Section 2** for folders (Only `images/` subfolder allowed, no orphans, no extra file types).
*   **Strict Validation**: If any file or folder within the Zip violates the rules in Sections 1 or 2, the **entire archive** will fail validation.

---

## 4. Hidden & System Files
*   **Automatic Exclusion**: System-generated files and directories are automatically ignored during the upload process.
*   **Ignored Patterns**:
    *   Any file or folder starting with a dot (e.g., `.DS_Store`, `.git`, `.env`).
    *   System-specific directories like `__MACOSX`.
*   **Validation Impact**: These ignored files **do not count** towards validation rules. For example, a `.DS_Store` file at the root will not trigger a "no extra files" failure, as the system skips it entirely before checking compliance.

---

## Summary for Developers
Validation logic should be implemented both on the **Client-side** (immediate feedback) and **Server-side** (security and final verification). Any violation of these rules should provide a clear, specific error message to the user indicating exactly which rule was broken.
