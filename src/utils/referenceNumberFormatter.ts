/**
 * Utility functions for formatting and parsing reference numbers
 */

/**
 * Calculate the number of digits needed for a reference number
 * Minimum of 5 digits for consistency
 */
export const calculatePadding = (maxNumber: number): number => {
  const digits = maxNumber.toString().length;
  return Math.max(5, digits);
};

/**
 * Format customer reference with auto-scaling padding based on max reference
 * Examples:
 * - max=99: 1 → "00001" (min 5 digits)
 * - max=99999: 1 → "00001" (5 digits)
 * - max=1000000: 1 → "0000001" (7 digits)
 */
export const formatCustomerReferenceAuto = (num: number, maxReference: number): string => {
  const padding = calculatePadding(maxReference);
  return num.toString().padStart(padding, '0');
};

/**
 * Format customer reference with leading zeros: 1 → "00001"
 * @deprecated Use formatCustomerReferenceAuto for auto-scaling support
 */
export const formatCustomerReference = (num: number): string => {
  return num.toString().padStart(5, '0');
};

/**
 * Format application reference with auto-scaling padding based on max reference
 */
export const formatApplicationReferenceAuto = (num: number, maxReference: number): string => {
  const padding = calculatePadding(maxReference);
  return num.toString().padStart(padding, '0');
};

/**
 * Extract initials from product/service name for reference number
 * Rules:
 * - 1 word → 1 letter (first letter)
 * - 2 words → 2 letters (first letter of first 2 words)
 * - 3+ words → 3 letters (first letter of first 3 words)
 * - Skip words containing non-alphabet characters
 * - "N/A" or null/undefined → "NA"
 * - "Others" → "OT"
 */
export const extractProductInitials = (productName: string | null | undefined): string => {
  if (!productName || productName.trim() === '' || productName.toLowerCase() === 'n/a') {
    return 'NA';
  }
  
  if (productName.toLowerCase() === 'others') {
    return 'OT';
  }
  
  // Split into words and filter out words with non-alphabet characters
  const words = productName.split(/\s+/).filter(word => /^[a-zA-Z]+$/.test(word));
  
  if (words.length === 0) {
    return 'NA';
  }
  
  // Determine how many letters to take based on word count
  const maxLetters = words.length >= 3 ? 3 : words.length;
  
  // Take first letter of each word (up to maxLetters)
  const initials = words
    .slice(0, maxLetters)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
  
  return initials || 'NA';
};

/**
 * Format application reference with APP-[INITIALS]-yyyy-[NUMBER] format
 * Example: "Bank Account Opening" → "APP-BAO-2025-01001"
 * Year is extracted from the application's created_at timestamp from database
 */
export const formatApplicationReferenceWithPrefix = (
  num: number, 
  maxReference: number, 
  createdAt: string,
  productName?: string | null
): string => {
  const year = new Date(createdAt).getFullYear();
  const initials = extractProductInitials(productName);
  return `APP-${initials}-${year}-${formatApplicationReferenceAuto(num, maxReference)}`;
};

/**
 * Format application reference with leading zeros: 1001 → "1001"
 * @deprecated Use formatApplicationReferenceAuto for auto-scaling support
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
 * Format customer reference with CUST-yyyy- prefix and auto-scaling: 1 → "CUST-2025-00001"
 * Year is extracted from the customer's created_at timestamp from database
 */
export const formatCustomerReferenceWithPrefix = (num: number, maxReference: number, createdAt: string): string => {
  const year = new Date(createdAt).getFullYear();
  return `CUST-${year}-${formatCustomerReferenceAuto(num, maxReference)}`;
};

/**
 * Format customer reference with hash prefix and auto-scaling: 1 → "#00001"
 * @deprecated Use formatCustomerReferenceWithPrefix for CUST-yyyy- format
 */
export const formatCustomerReferenceWithHashAuto = (num: number, maxReference: number): string => {
  return `#${formatCustomerReferenceAuto(num, maxReference)}`;
};

/**
 * Format application reference with hash prefix and auto-scaling: 1001 → "#01001"
 * @deprecated Use formatApplicationReferenceWithPrefix for APP-yyyy- format
 */
export const formatApplicationReferenceWithHashAuto = (num: number, maxReference: number): string => {
  return `#${formatApplicationReferenceAuto(num, maxReference)}`;
};

/**
 * Format customer reference with hash prefix: 1 → "#00001"
 * @deprecated Use formatCustomerReferenceWithHashAuto for auto-scaling support
 */
export const formatCustomerReferenceWithHash = (num: number): string => {
  return `#${formatCustomerReference(num)}`;
};

/**
 * Format application reference with hash prefix: 1001 → "#1001"
 * @deprecated Use formatApplicationReferenceWithHashAuto for auto-scaling support
 */
export const formatApplicationReferenceWithHash = (num: number): string => {
  return `#${formatApplicationReference(num)}`;
};
