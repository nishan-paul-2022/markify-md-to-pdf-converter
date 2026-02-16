import type { GroupMember, Metadata } from '@/schemas/file-schema';
export type { GroupMember, Metadata };

/**
 * Parses metadata from markdown content.
 * Looks for a "# Landing Page" section with key-value pairs in the format:
 * - **Key:** Value
 * or
 * - **Key:** "Value",
 * And also looks for a "Collaborative Group Members" table.
 */
export function parseMetadataFromMarkdown(markdown: string): Metadata {
  const metadata: Metadata = {};

  // Find the Landing Page section
  // It starts with # Landing Page and ends at the next main heading (#) or horizontal rule (---)
  const landingPageMatch = markdown.match(
    /(?:^|\r?\n)#\s+Landing\s+Page\s*\r?\n([\s\S]*?)(?=\r?\n(?:#\s+|---|\*\*\*|___|\\pagebreak|<!--\s*pagebreak\s*-->)|(?![^]))/i,
  );

  if (!landingPageMatch) {
    return metadata;
  }

  const landingPageContent = landingPageMatch[1];

  // 1. Parse Key-Value pairs: - **Key:** Value
  const lineRegex = /^-\s+\*\*(.+?):\*\*[ \t]*(.*)$/gm;
  let match;

  while ((match = lineRegex.exec(landingPageContent)) !== null) {
    const key = match[1].trim();
    let value = match[2].trim();

    // Remove trailing comma if present
    value = value.replace(/,\s*$/, '');

    // Remove surrounding quotes if present
    value = value.replace(/^["'](.+?)["']$/, '$1');

    // Map the keys to our metadata structure
    const keyMap: Record<string, keyof Metadata> = {
      University: 'university',
      Program: 'program',
      Title: 'title',
      Subtitle: 'subtitle',
      Course: 'course',
      Name: 'name',
      'Roll No': 'roll',
      'Reg. No': 'reg',
      Batch: 'batch',
      'Submission Date': 'date',
    };

    if (key in keyMap) {
      const metadataKey = keyMap[key];
      (metadata as Record<string, unknown>)[metadataKey] = value;
    }
  }

  // 2. Parse Collaborative Group Members table
  // Look for the specific header, then capture everything that looks like a table row
  const tableHeaderIndex = landingPageContent.indexOf('**Collaborative Group Members:**');
  if (tableHeaderIndex !== -1) {
    const contentAfterHeader = landingPageContent.substring(tableHeaderIndex);
    const tableRows = contentAfterHeader.match(/\|[^|]+\|[^|]+\|/g);

    if (tableRows && tableRows.length >= 3) {
      // Header + Separator + At least one member
      const memberRows = tableRows.slice(2);
      const members: GroupMember[] = memberRows
        .map((row) => {
          const cells = row
            .split('|')
            .map((c) => c.trim())
            .filter((c) => c !== '');
          if (cells.length >= 2) {
            return {
              name: cells[0],
              roll: cells[1],
            };
          }
          return null;
        })
        .filter((m): m is GroupMember => m !== null);

      if (members.length > 0) {
        metadata.groupMembers = members;
      }
    }
  }

  return metadata;
}

/**
 * Removes the Landing Page section from markdown content
 */
export function removeLandingPageSection(markdown: string): string {
  // 1. Remove the Landing Page section itself
  // Terminate at next heading, HR (---, ***, ___), or explicit \pagebreak
  const cleaned = markdown
    .replace(
      /(?:^|\r?\n)#\s+Landing\s+Page\s*\r?\n[\s\S]*?(?=\r?\n(?:#\s+|---|\*\*\*|___|\\pagebreak|<!--\s*pagebreak\s*-->)|(?![^]))/i,
      '',
    )
    .trim();

  // 2. If the content now starts with a page break, remove it to avoid an empty second page
  // (since the cover page already implies a page break)
  return cleaned
    .replace(/^(?:\\pagebreak|<!--\s*pagebreak\s*-->)\s*/i, '')
    .trim();
}

export const DEFAULT_METADATA: Metadata = {};

export const DEFAULT_MARKDOWN_PATH = '/samples/sample-file.md';
