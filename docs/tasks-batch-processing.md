# Prompt Sequence: Batch Processing Feature

This sequence of prompts is designed to implement the Batch Processing feature step-by-step, ensuring full integration with the existing Markify design system.

## Prompt 1: Foundation & Entry Point

"Install `jszip` and `@types/jszip`. Then, update `src/components/auth/UserNav.tsx` to add a 'Batch Processing' link in the dropdown menu. Use the `Layers` icon from `lucide-react`. The link should navigate to `/converter/batch`. Ensure the styling matches the existing menu items (text-slate-300, hover:text-white, uppercase tracking-wider)."

## Prompt 2: Route & Layout

"Create a new route at `src/app/converter/batch/page.tsx`. This page should handle authentication (redirect to '/' if no session) and dynamically import a client component `BatchConverterClient` with `ssr: false`. Pass the `session.user` to the client component."

## Prompt 3: BatchConverterClient UI (The Shell)

"Create `src/components/converter/BatchConverterClient.tsx`. Design a premium, dashboard-style interface that feels like a natural extension of the main editor.

- Use a background consistent with the main app (slate-950).
- Include a header with 'Batch Processing' and a back button to '/converter'.
- Divide the main area into an 'Upload' section and a 'Batch Library' section.
- Add large, styled upload buttons for 'Upload Files', 'Upload Folder', and 'Upload Zip' (use existing icons and colors: Amber for folders, Blue for Zips)."

## Prompt 4: Data Management & List View

"Integrate the `useFiles` hook into `BatchConverterClient.tsx`. Display uploaded files grouped by `batchId`.

- Each group (Project) should show a folder icon if it contains multiple files or was uploaded as a folder.
- Show file metadata: original name, size, type, and upload date.
- Implement a status indicator (Pending / Processed) for PDF conversion."

## Prompt 5: Individual Actions (Convert & Download)

"Implement individual actions for each file in the batch list:

- **Convert**: A single-click button that triggers the `/api/generate-pdf` endpoint for that specific file.
- **Download**: Download the generated PDF or the original MD.
- Ensure smooth transitions and loading states for each action."

## Prompt 6: Batch Actions (Bulk Conversion)

"Implement 'Convert Batch' functionality:

- Add a button to each project group to convert all MD files within that batch to PDF.
- Show a progress overlay or a progress bar (e.g., 'Converting 3 of 8...') to keep the user informed.
- Handle errors gracefully and allow retrying failed items."

## Prompt 7: Batch Download (Zip & Multi-Download)

"Implement batch download options:

- **Download as Zip**: Use `jszip` to bundle all converted PDFs (or original MDs) into a single zip file for the entire batch.
- **Download Individual Files**: A feature to trigger multiple individual downloads at once.
- Ensure the filenames are generated correctly using the existing `generateStandardName` utility."

## Prompt 8: Polishing & Visual Excellence

"Review the entire Batch Processing page and add micro-animations (hover effects on cards, pulse effects during conversion). Ensure the layout is fully responsive and uses the exact same typography and color palette as the main editor to make it feel like a core part of the application."
