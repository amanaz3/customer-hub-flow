
export const sanitizeInput = (input: string): string => {
  // Remove HTML tags and encode special characters
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>?/gm, '')
    .trim();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateCompanyName = (name: string): boolean => {
  // Allow letters, numbers, spaces, and common business characters
  const companyRegex = /^[a-zA-Z0-9\s\.\,\&\-\_]+$/;
  return companyRegex.test(name) && name.length >= 2 && name.length <= 100;
};

export const validateAmount = (amount: number): boolean => {
  return amount >= 0 && amount <= 999999999 && !isNaN(amount);
};

export const validateCustomerData = (customerData: any): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!customerData.name || customerData.name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!validateEmail(customerData.email)) {
    errors.push('Invalid email format');
  }

  if (!validatePhoneNumber(customerData.mobile)) {
    errors.push('Invalid phone number format');
  }

  if (!validateCompanyName(customerData.company)) {
    errors.push('Invalid company name');
  }

  if (!validateAmount(customerData.amount)) {
    errors.push('Invalid amount');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
