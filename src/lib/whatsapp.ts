/**
 * WhatsApp Helper Utilities for NEK LEADS
 */

/**
 * Normalizes phone numbers for wa.me links.
 * Handles standard 10-digit Indian phone numbers by prepending country code 91.
 */
export const formatPhoneForWhatsApp = (rawPhone: string): string => {
  if (!rawPhone) return '';
  // Strip all non-digit characters
  let digits = rawPhone.replace(/\D/g, '');

  // If 10 digits (typical Indian mobile), prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Leading zero, e.g. 09876543210 -> 919876543210
    digits = `91${digits.slice(1)}`;
  }

  return digits;
};

/**
 * Opens a WhatsApp direct chat, optionally preloading a message.
 */
export const openWhatsAppDirect = (phone: string, message?: string) => {
  const formatted = formatPhoneForWhatsApp(phone);
  if (!formatted) {
    // If no phone provided, open WhatsApp share composer
    const encoded = message ? encodeURIComponent(message) : '';
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    return;
  }

  const encoded = message ? `?text=${encodeURIComponent(message)}` : '';
  window.open(`https://wa.me/${formatted}${encoded}`, '_blank');
};

/**
 * Quick templates for one-tap WhatsApp messages to leads
 */
export interface QuickTemplate {
  id: string;
  label: string;
  iconName: string;
  generateText: (leadName: string, meta?: { eventName?: string; location?: string; amount?: string }) => string;
}

export const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'availability',
    label: 'Check Availability',
    iconName: 'calendar',
    generateText: (name, meta) => 
      `Hi ${name}! 👋\nAre you available for an upcoming event${meta?.eventName ? ` (${meta.eventName})` : ''}?\n\nPlease reply with your availability. Thanks!\n- NEK Leads Team`
  },
  {
    id: 'briefing',
    label: 'Send Event Brief',
    iconName: 'file-text',
    generateText: (name, meta) => 
      `Hi ${name}! 📋\nHere are the details for the upcoming event:\n\n*Event:* ${meta?.eventName || 'Private Event'}\n*Location:* ${meta?.location || 'Bangalore'}\n\nPlease confirm your reporting on time.\n- NEK Leads Team`
  },
  {
    id: 'payment_ready',
    label: 'Payment Confirmation',
    iconName: 'credit-card',
    generateText: (name, meta) => 
      `Hi ${name}! ✅\nYour payout for ${meta?.eventName || 'the event'}${meta?.amount ? ` (₹${meta.amount})` : ''} has been processed via UPI/Bank.\n\nPlease check and confirm once received.\nThank you for working with us! 🌟\n- NEK Leads Team`
  },
  {
    id: 'general',
    label: 'Direct Chat',
    iconName: 'message-circle',
    generateText: (name) => `Hi ${name}! Following up regarding NEK Leads events.`
  }
];

