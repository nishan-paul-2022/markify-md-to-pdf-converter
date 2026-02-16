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
*   **Flexible Root Structure**: Zip files can contain:
    *   **Multiple folders** at the root level
    *   **Multiple `.md` files** at the root level
    *   **Both folders and `.md` files** at the root level
*   **Folder Rules**: Each folder inside the zip must comply with **Section 2** rules:
    *   Only `.md` files at the folder root
    *   Optional `images/` subfolder with only supported images
    *   No other subfolders allowed
    *   If `images/` exists, all images must be referenced
*   **Strict Validation**: If any folder within the zip violates Section 2 rules, the **entire archive** will fail validation.

**Example Valid Zip Structures:**
```
my-project.zip/
├── readme.md                    ← Root .md file (allowed)
├── guide.md                     ← Another root .md file (allowed)
├── project-a/                   ← Folder (must follow Section 2 rules)
│   ├── main.md
│   └── images/
│       └── logo.png
└── project-b/                   ← Another folder (must follow Section 2 rules)
    ├── index.md
    └── images/
        └── banner.jpg
```

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
