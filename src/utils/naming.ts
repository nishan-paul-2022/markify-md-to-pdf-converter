/**
 * Enforces lowercase kebab-case on a string.
 * Replaces spaces and special characters with hyphens and removes the file extension.
 *
 * @param name - The name to standardize (e.g., "Sample File.md")
 * @returns The standardized name (e.g., "sample-file")
 */
export function generateStandardName(name: string): string {
  // 1. Remove the file extension (last occurrence of a dot and everything after it)
  // If no dot is found, use the original name
  const lastDotIndex = name.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? name : name.substring(0, lastDotIndex);

  return (
    baseName
      .toLowerCase()
      .trim()
      // 2. Replace all non-alphanumeric characters with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // 3. Remove leading and trailing hyphens
      .replace(/^-+|-+$/g, '')
  );
}

/**
 * Appends the current timestamp to a name in the format YYYY-MM-DD-HH-mm-ss.
 *
 * @param name - The base name (should be standardized first)
 * @returns The name with the timestamp appended (e.g., "name-2026-02-09-21-26-55")
 */
export function addTimestampToName(name: string): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;

  return `${name}-${timestamp}`;
}

/**
 * Formats a date into the specific format: DD-mmm-YYYY-HH.MMam/pm
 * e.g., "15-feb-2026-11.11am"
 */
export function formatFilenameTimestamp(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const hourString = String(displayHours).padStart(2, '0');

  return `${day}-${month}-${year}-${hourString}-${minutes}-${seconds}-${ms}-${ampm}`;
}

/**
 * Generates a PDF filename with the requested timestamp format.
 */
export function generateTimestampedPdfName(baseName: string): string {
  const timestamp = formatFilenameTimestamp(new Date());
  const cleanBase = generateStandardName(baseName);
  return `${cleanBase}-${timestamp}.pdf`;
}
