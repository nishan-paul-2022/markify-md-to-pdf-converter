# Mandatory Design Patterns & Engineering Standards

This document defines the **mandatory** design patterns and architectural standards for the **Markify** codebase. Adherence to these patterns is required for all new features and refactors to ensure the application's integrity as a high-performance converter tool.

---

## 1. The Converter Pipeline Pattern (Source → Process → Sink)

Every feature involving data transformation (Markdown, PDF, Archive) **must** follow the unidirectional pipeline pattern:

-   **Source (Input)**: Handled via Client Components using standardized upload logic (`src/components/converter`). Validation must occur both on the client (immediate feedback) and server (security).
-   **Processing (Logic)**: Intensive operations (PDF generation, ZIP extraction) **must** be isolated in the `src/lib/services` layer. Never perform heavy business logic directly inside API routes or Server Actions.
-   **Sink (Output)**: Results must be delivered consistently either as a downloadable Blob or a persisted URL in the database metadata.

---

## 2. Server-Side Data Integrity (Prisma & Auth.js)

Ensuring data security and consistency is non-negotiable.

-   **Mandatory Session Guards**: Every Server Component and API Route **must** verify the session using `auth()` from `@/lib/auth`. Anonymous access to processing features is strictly prohibited.
-   **Prisma Singleton**: All database interactions **must** use the singleton instance from `@/lib/prisma`. Direct instantiation of `PrismaClient` is a blocker.
-   **Owner-Only Access**: All file operations (fetch, delete, update) **must** include a check to ensure the `userId` in the database matches the current session ID.

---

## 3. Premium Aesthetic Standard (Glassmorphism & UX)

Markify is defined by its "Dream-like" premium interface. Developers **must** maintain this aesthetic:

-   **The "Glow" Token**: Use the standard decorative background blurs (e.g., `bg-blue-600/20 blur-[120px]`) and noise overlays found in the root layout and landing page.
-   **Micro-Interactions**: Every button or interactive card **must** include hover transitions (scale, color shift) and standard Lucide-react icons for visual affordance.
-   **Zero Layout Shift**: Use Next.js `<Image />` and pre-defined font variables (`--font-geist-sans`) to prevent CLS.

---

## 4. State Management & Persistence Strategy

State should be stored in the most appropriate location based on its lifecycle:

-   **Ephemeral State**: Use `useState` for local UI toggles.
-   **Navigational State**: Use **URL query parameters** for filters, search, and tab selections to ensure the browser's "Back" button works as expected.
-   **Persistent UI Preferences**: Use `localStorage` inside Client Components to remember user-specific view settings (e.g., "Selection Mode").
-   **Application Data**: Must be persisted in PostgreSQL via Prisma.

---

## 5. Standardized User Feedback (The "Alert/Toast" Pattern)

Avoid browser defaults like `window.alert` or `window.confirm`.

-   **Confirmation Pattern**: Use the `useAlert` hook for all destructive actions (e.g., deleting files, clearing account).
-   **Loading States**: All async actions (e.g., "Converting...", "Uploading...") **must** show a spinner (`Loader2`) and disable the triggering button to prevent double-submissions.

---

## 6. Reusability & Modular Design

To prevent code duplication and ensure the application is maintainable, developers **must** adhere to these modular standards:

-   **Atomic UI Components**: New UI elements **must** be created in `src/components/ui` as small, single-purpose components (e.g., `IconButton`, `Badge`, `StatusDot`).
-   **Logic Extraction (Custom Hooks)**: Any complex logic used in more than one component (e.g., file fetching, selection logic, upload handling) **must** be extracted into a custom hook in `src/hooks`.
-   **Service-Level Abstraction**: All API-calling logic and heavy document processing **must** reside in `src/lib/services` or `src/lib/utils`. Components should consume these services rather than implementing the logic themselves.
-   **Theme Tokens**: Do not use ad-hoc hex codes or arbitrary spacing. Always use Tailwind theme tokens and the project's CSS variables to ensure visual consistency across reused components.

---

## 7. Composition Over Inheritance (Shadcn/UI & Radix)

-   **Standard**: Use the pre-configured Radix UI components in `src/components/ui`.
-   **Patterns**: Wrap low-level components with feature-specific logic rather than modifying the base UI components.
-   **Class Merging**: Always use the `cn()` utility for conditional styling to prevent Tailwind class conflicts.

---

## 8. Performance & Resource Management

-   **Client Hydration**: Minimize the use of `'use client'`. If only a small button needs state, extract only that button into a Client Component.
-   **Cleanup**: All `createObjectURL` calls in the converter **must** be followed by a `revokeObjectURL` once the download is triggered to prevent memory leaks in the SPA.
-   **Async Boundaries**: Use React `Suspense` for data-heavy regions of the page to allow the rest of the UI to remain interactive.

---

## 9. Development Workflow

-   **Type Safety**: Every function signature **must** have TypeScript types. Avoid `any` at all costs.
-   **Linting**: Code should be lint-free. Run `npm run lint` before committing.
-   **Documentation**: New services or complex utility functions **must** be accompanied by a brief JSDoc comment explaining their purpose.
