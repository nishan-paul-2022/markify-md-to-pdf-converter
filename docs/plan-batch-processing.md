# Plan: Batch Processing Feature for Markify

## 1. Overview
The goal is to implement a "Batch Processing" page where users can upload multiple files or entire projects (folders/zips), view them in a structured list, and convert them to PDF either individually or as a whole batch. The page will also support batch downloads (individual files or a combined zip).

## 2. UI/UX Design
- **Path**: `/converter/batch`
- **Aesthetic**: Premium, dark-mode design consistent with the current Markify dashboard (slate-950, glassmorphism, smooth animations).
- **Components**:
    - **Header**: Simple title "Batch Processing" with a back button to the main editor.
    - **Upload Area**: Prominent area for uploading files, folders, or zip archives.
    - **Batch List**: A card-based or row-based list showing:
        - Files (grouped by upload batch/project).
        - Status (Converted/Pending).
        - Individual actions (Convert, Download, Delete).
    - **Global Actions**: Fixed toolbar for "Convert All", "Download All (Zip)", and "Clear All".

## 3. Integration Points
- **User Profile**: Add a "Batch Processing" link in the `UserNav` dropdown (right-bottom icon).
- **Navigation**: Ensure seamless transitions between the single-file editor and batch mode.

## 4. Technical Implementation
- **Dependencies**: Install `jszip` and `file-saver` for batch download functionality.
- **Frontend**:
    - Create `src/app/converter/batch/page.tsx` (Route).
    - Create `src/components/converter/BatchConverterClient.tsx` (Main Logic).
    - Use `useFiles` hook to manage the list of uploaded items.
    - Implement batch conversion by iterating over files and calling `/api/generate-pdf`.
- **API**: Leverage existing `/api/generate-pdf` and `/api/files` endpoints.

## 5. Implementation Sequence
1. **Setup**: Install `jszip` and `@types/jszip`.
2. **Navigation**: Update `UserNav.tsx` to include the entry point.
3. **Route & Layout**: Create the `/converter/batch` route and basic structure.
4. **Client Component**: Build `BatchConverterClient` with list view and upload triggers.
5. **Logic**:
    - Group files by `batchId` to represent "Projects".
    - Implement single-click individual conversion.
    - Implement whole-batch conversion with progress tracking.
6. **Download**: Implement Zip creation and download.
7. **Polishing**: Add micro-animations and refine the styling to match the main editor.
