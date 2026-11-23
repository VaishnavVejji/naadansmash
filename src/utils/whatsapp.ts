import { BRAND_CONFIG } from '../data/communityData';

/**
 * WhatsApp integration utility for NAADANSMASH.
 * 
 * Note: Never pretend WhatsApp messages are automatically sent.
 * These helpers construct official WhatsApp direct deep-links with prefilled
 * message text for user review and sending in their own WhatsApp client.
 */

export type WhatsAppEnquiryType = 
  | 'registration_enquiry'
  | 'payment_verification'
  | 'event_info'
  | 'payment_rejection_appeal'
  | 'racket_loaner'
  | 'general_chat';

export interface WhatsAppPrefillParams {
  regNumber?: string;
  name?: string;
  eventTitle?: string;
  utr?: string;
  rejectionReason?: string;
}

const STORAGE_KEY_WHATSAPP = 'naadansmash_organiser_whatsapp';

/**
 * Returns the currently active official organiser WhatsApp number (digits only, e.g. 918304883872).
 */
export function getOrganiserWhatsAppNumber(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WHATSAPP);
    if (saved && saved.replace(/[^0-9]/g, '').length >= 10) {
      return saved.replace(/[^0-9]/g, '');
    }
  } catch {}

  const defaultNum = (BRAND_CONFIG.contacts.whatsapp || '918304883872').replace(/[^0-9]/g, '');
  return defaultNum;
}

/**
 * Checks whether an official organiser number is configured with a valid 10+ digit phone.
 */
export function isWhatsAppConfigured(): boolean {
  const num = getOrganiserWhatsAppNumber();
  return Boolean(num && num.length >= 10);
}

/**
 * Returns the formatted display phone string (e.g. "+91 83048 83872").
 */
export function getFormattedOrganiserWhatsApp(): string {
  const num = getOrganiserWhatsAppNumber();
  if (num === '918304883872' || num.endsWith('8304883872')) {
    return '+91 83048 83872';
  }
  if (num.length === 10) {
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  if (num.length === 12 && num.startsWith('91')) {
    return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
  }
  return `+${num}`;
}

/**
 * Updates the configured organiser WhatsApp number in local settings.
 */
export function saveOrganiserWhatsAppNumber(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 10) return false;
  try {
    localStorage.setItem(STORAGE_KEY_WHATSAPP, clean);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generates the prefilled message string for each communication scenario.
 */
export function getPrefilledMessage(type: WhatsAppEnquiryType, params?: WhatsAppPrefillParams): string {
  const reg = params?.regNumber ? ` #${params.regNumber}` : '';
  const name = params?.name ? ` (${params.name})` : '';
  const event = params?.eventTitle ? ` for ${params.eventTitle}` : '';

  switch (type) {
    case 'registration_enquiry':
      return `Hi Sivaram! I have an enquiry regarding NAADANSMASH registration${reg}${event}${name}. Could you please assist me?`;

    case 'payment_verification':
      const utrPart = params?.utr ? ` UTR Reference: ${params.utr}.` : '';
      return `Hi Sivaram! Checking in on payment verification for NAADANSMASH registration${reg}${name}.${utrPart} Could you please verify my spot on the court roster?`;

    case 'event_info':
      return `Hi NAADANSMASH! I would like more information about upcoming weekend badminton sessions in Kochi (session timings, court venues, and doubles format).`;

    case 'payment_rejection_appeal':
      const reasonPart = params?.rejectionReason ? ` (Reason stated: "${params.rejectionReason}")` : '';
      const utrUpdated = params?.utr ? ` My updated UTR number is ${params.utr}.` : '';
      return `Hi Sivaram! My payment verification for NAADANSMASH registration${reg}${reasonPart} was rejected.${utrUpdated} Could you please review and help me confirm my spot?`;

    case 'racket_loaner':
      return `Hi NAADANSMASH! I'm joining the upcoming session${event} and wanted to check if a loaner racket is available to borrow.`;

    case 'general_chat':
    default:
      return `Hi Sivaram! I'd love to connect about NAADANSMASH weekend badminton sessions in Kochi.`;
  }
}

/**
 * Creates a clickable WhatsApp link with prefilled text.
 * Only returns a live URL if the organiser number is configured.
 */
export function createWhatsAppLink(type: WhatsAppEnquiryType, params?: WhatsAppPrefillParams): {
  url: string;
  isConfigured: boolean;
  prefilledText: string;
  formattedNumber: string;
} {
  const configured = isWhatsAppConfigured();
  const phone = getOrganiserWhatsAppNumber();
  const prefilledText = getPrefilledMessage(type, params);
  const formattedNumber = getFormattedOrganiserWhatsApp();

  if (!configured) {
    return {
      url: '#',
      isConfigured: false,
      prefilledText,
      formattedNumber,
    };
  }

  const encoded = encodeURIComponent(prefilledText);
  return {
    url: `https://wa.me/${phone}?text=${encoded}`,
    isConfigured: true,
    prefilledText,
    formattedNumber,
  };
}
