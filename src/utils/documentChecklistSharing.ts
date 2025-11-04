import { sendNotificationEmail } from '@/services/emailNotificationService';

export interface ChecklistEmailData {
  recipientEmail: string;
  recipientName: string;
  documentList: string;
  productType: string;
  customerName?: string;
}

/**
 * Send document checklist via email
 */
export const emailDocumentChecklist = async (data: ChecklistEmailData): Promise<boolean> => {
  try {
    const emailData = {
      recipientEmail: data.recipientEmail,
      recipientName: data.recipientName,
      title: `${data.productType} - Required Documents Checklist`,
      message: `Please find below the required documents checklist for ${data.productType}:\n\n${data.documentList}`,
      type: 'document',
      customerName: data.customerName,
    };

    return await sendNotificationEmail(emailData);
  } catch (error) {
    console.error('Error sending checklist email:', error);
    return false;
  }
};

/**
 * Share document checklist via WhatsApp
 */
export const shareViaWhatsApp = (phoneNumber: string, checklistText: string, productType: string): void => {
  try {
    // Clean phone number - remove spaces, dashes, and ensure it starts with country code
    let cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // If phone doesn't start with +, assume UAE (+971) and add it
    if (!cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('971')) {
        cleanPhone = '+' + cleanPhone;
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '+971' + cleanPhone.substring(1);
      } else {
        cleanPhone = '+971' + cleanPhone;
      }
    }
    
    // Format message for WhatsApp
    const message = `*${productType} - Required Documents Checklist*\n\n${checklistText}\n\n_Please prepare these documents for your application._`;
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  } catch (error) {
    console.error('Error sharing via WhatsApp:', error);
    throw error;
  }
};

/**
 * Format checklist for sharing
 */
export const formatChecklistForSharing = (categories: { title: string; items: string[] }[]): string => {
  return categories
    .map(cat => `${cat.title}:\n${cat.items.map(item => `• ${item}`).join('\n')}`)
    .join('\n\n');
};
