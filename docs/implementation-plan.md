# Markify Implementation Plan: Upload Cases & Validation

This plan outlines the steps required to implement the four upload cases defined for the Markdown-to-PDF converter.

## Case Definitions Overview

| Case | Upload Type | Structure | Requirements |
| :--- | :--- | :--- | :--- |
| **Case 1** | File(s) | Single `.md` | Independent, lowercase kebab-case naming. |
| **Case 2** | File(s) | Multiple `.md` | Independent, lowercase kebab-case naming. |
| **Case 3** | Folder | 1 `.md` + `images/` | Strict structure: no extra files, timestamped folder. |
| **Case 4** | Folder | Multiple `.md` + `images/` | Strict structure: no extra files, timestamped folder. |

---

## Phase 1: Logic & Validation Utility
**Goal**: Create a robust validation engine that classifies an upload into one of the 4 cases and enforces the "strict check" (no extra files).

### Sub-task 1.1: File Name Standardizer
- **Objective**: Create a utility to convert any string to `lowercase-kebab-case` and append the specific timestamp format.
- **Timestamp Format**: `YYYY-MM-DD-HH-mm-ss` (e.g., `2026-02-09-21-26-55`).
- **Logic**:
    - `case1/2`: Apply to the file name: `name-timestamp.md`.
    - `case3/4`: Apply to the folder/batch name: `folder-name-timestamp`.
- **Prompt**:
> Implement a utility function `generateStandardName(name: string): string` that enforces lowercase kebab-case. Also, create a helper `addTimestampToName(name: string): string` that appends the current timestamp in the format `YYYY-MM-DD-HH-mm-ss` (e.g., `sample-document-2026-02-09-21-26-55`).

### Sub-task 1.2: Structure Validator
- **Objective**: Analyze a set of uploaded files to identify the case and validate the strict "no extra files" rule.
- **Strict Logic (Case 3/4)**:
    - Root of uploaded folder: ONLY `.md` files and one `images/` folder.
    - Inside `images/`: ONLY image files.
    - No sub-subfolders, no hidden files, no other extensions.
- **Prompt**:
> Create a validation service `validateUploadStructure(files: File[]): { case: number, valid: boolean, error?: string }`.
> - For Case 3/4: Use `file.webkitRelativePath` to verify structure.
> - Ensure the local folder structure matches the requirement: only MDs and an `images/` subfolder at the root.
> - Reject if extra files or unauthorized folders are found.

---

## Phase 2: Frontend Integration & UI
**Goal**: Update the UI to handle uploads, enforce naming, and improve navigation highlighting.

### Sub-task 2.1: File Selection Handlers
- **Objective**: Update the file input handlers.
- **Logic**: Call the validation service and standardizer before passing files to the state/backend.
- **Prompt**:
> Update the `FileManager` or `Upload` component to:
> 1. Handle separate "File" and "Folder" triggers.
> 2. On selection, execute `validateUploadStructure`.
> 3. If valid, rename all files/folders using the standardizer (apply timestamps for Case 1/2 files and Case 3/4 parent folders).
> 4. Display clear error feedback if the "Strict Check" fails.

### Sub-task 2.2: Active File & Folder Highlighting
- **Objective**: Improve the sidebar UX when a file is open in the editor.
- **Logic**: When an `.md` file is active in the editor, both the file and its parent folder (for Case 3/4) must be highlighted in the sidebar.
- **Prompt**:
> Update the `FileTree` and sidebar component to implement active state highlighting. Ensure that when a user selects an `.md` file for editing:
> 1. The `.md` file node itself is visually highlighted.
> 2. If the file belongs to a folder (Case 3/4), the parent folder node is also highlighted (e.g., subtle background or active border).

---

## Phase 3: Backend & API Handling
**Goal**: Ensure the server receives the structured files and maintains the `images/` relationship.

### Sub-task 3.1: API Route Enhancement
- **Objective**: Update the `/api/files` route to handle the batch upload with preserved directory structure.
- **Prompt**:
> Modify the files API route to accept a `batchId` and the relative paths. Ensure that for Case 3 and 4, the `images/` folder is correctly created in the server's temporary storage or database representation, preserving the link between the MD file and its assets.

---

## Phase 4: Export Logic (PDF Generation)
**Goal**: Ensure the final PDF download follows the naming rules.

### Sub-task 4.1: Download Header & Naming
- **Objective**: Implement PDF download from the header for the selected MD file.
- **Logic**: User selects an MD from the sidebar -> header download button triggers PDF generation -> filename uses standardized name + timestamp.
- **Prompt**:
> Update the header component to enable PDF downloads:
> 1. The download button must target the currently active `.md` file.
> 2. The output PDF filename must follow the rule: `standard-name-YYYY-MM-DD-HH-mm-ss.pdf`.
