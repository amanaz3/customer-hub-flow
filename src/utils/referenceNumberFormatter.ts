/**
 * Utility functions for formatting and parsing reference numbers
 */

/**
 * Format customer reference with leading zeros: 1 → "001"
 */
export const formatCustomerReference = (num: number): string => {
  return num.toString().padStart(3, '0');
};

/**
 * Format application reference with leading zeros: 1001 → "1001"
 */
export const formatApplicationReference = (num: number): string => {
  return num.toString().padStart(4, '0');
};

/**
 * Parse reference number from string input (handles hash prefix and leading zeros)
 * Examples: "#1001" → 1001, "0001" → 1, "001" → 1
 */
export const parseReferenceNumber = (input: string): number | null => {
  // Remove hash prefix if present
  const cleaned = input.replace(/^#/, '').trim();
  // Remove leading zeros and parse
  const num = parseInt(cleaned.replace(/^0+/, '') || '0', 10);
  return isNaN(num) ? null : num;
};

/**
 * Format customer reference with hash prefix: 1 → "#001"
 */
export const formatCustomerReferenceWithHash = (num: number): string => {
  return `#${formatCustomerReference(num)}`;
};

/**
 * Format application reference with hash prefix: 1001 → "#1001"
 */
export const formatApplicationReferenceWithHash = (num: number): string => {
  return `#${formatApplicationReference(num)}`;
};
