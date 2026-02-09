# Markify Implementation Prompts

This document contains the step-by-step prompts required to implement the four upload cases and the strict folder validation logic for Markify.

---

### **Prompt 1: Naming & Timestamp Utility**
**Target**: `src/lib/utils/naming.ts`
> Implement a utility file `src/lib/utils/naming.ts` with two functions:
> 1. `generateStandardName(name: string): string`: Enforces lowercase kebab-case (replaces spaces/specials with hyphens, removes extension).
> 2. `addTimestampToName(name: string): string`: Appends the current timestamp in exactly this format: `YYYY-MM-DD-HH-mm-ss` (e.g., `sample-document-2026-02-09-21-26-55`).
> 
> These will be used for both uploaded file/folder identification and PDF export naming.

---

### **Prompt 2: Upload Structure Validator**
**Target**: `src/lib/services/upload-validator.ts`
> Create a validation service `validateUploadStructure(files: File[]): { case: number, valid: boolean, error?: string }` in `src/lib/services/upload-validator.ts`. 
> It must classify uploads into 4 cases:
> - **Case 1/2**: Selection of independent `.md` files.
> - **Case 3/4**: A folder containing ONLY `.md` files and an `images/` subfolder at the root.
> 
> **Strict Rules for Case 3/4**: 
> - Use `file.webkitRelativePath` to verify structure.
> - Reject if any files exist in the root other than `.md`.
> - Reject if the `images/` folder contains sub-folders or non-image files.
> - Reject the upload if any unauthorized file types (e.g., `.txt`, `.js`) or hidden files are found.

---

### **Prompt 3: Frontend Upload Integration**
**Target**: `src/components/file-manager` components
> Update the `FileManager` or `Upload` component to:
> 1. Provide two distinct triggers: "Upload File" and "Upload Folder" (using the `directory` attribute).
> 2. On selection, run the `validateUploadStructure` service.
> 3. If valid, normalize all filenames using `generateStandardName`.
> 4. If invalid, display a clear error message explaining exactly what part of the "Strict Check" failed (e.g., "Invalid folder structure: Extra files found in root").

---

### **Prompt 4: Active File & Folder Highlighting**
**Target**: `src/components/file-manager/FileTree.tsx`
> Update the `FileTree` and sidebar components to handle state-based highlighting.
> When a user clicks an `.md` file and it opens in the editor:
> 1. Ensure the `.md` file node in the sidebar is visually active (highlighted background).
> 2. If that file is part of a folder (Case 3/4), implement logic to highlight the parent folder node as well (e.g., a subtle border or secondary highlight) so the user knows which "project" they are working in.

---

### **Prompt 5: Backend API Enhancement**
**Target**: `src/app/api/files/route.ts`
> Modify the `/api/files` POST route to handle structured batch uploads.
> 1. It must accept a `batchId` and preserve the `relativePath` for Case 3 and 4 uploads.
> 2. Ensure the file storage logic on the server correctly recreates the `images/` subfolder structure so that relative image links in the Markdown files (e.g., `![alt](images/photo.jpg)`) remain functional during PDF generation.

---

### **Prompt 6: PDF Export with Timestamped Naming**
**Target**: `src/components/layout/Header.tsx`
> Integrate the PDF download trigger into the application header:
> 1. The download button should only be active when an `.md` file is selected and open in the editor.
> 2. When clicked, it should trigger the PDF generation for the active file.
> 3. The final downloaded PDF filename MUST use the `addTimestampToName` utility (e.g., `my-report-2026-02-09-21-26-55.pdf`).
