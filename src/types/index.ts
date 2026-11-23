export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled' | 'in_progress' | 'closed';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type AttendanceStatus = 'registered' | 'present' | 'absent';

export type ParticipantRegistrationStatus = 
  | 'received'            // Registration received, awaiting entry fee payment details
  | 'payment_submitted'   // Payment details (UTR / receipt) submitted for verification
  | 'confirmed'           // Payment verified by organiser: "YOU'RE IN!"
  | 'rejected';           // Payment rejected with admin reason

export interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS or HH:MM
  end_time: string;   // HH:MM:SS or HH:MM
  venue: string;
  registration_fee: number;
  max_participants: number;
  registration_deadline?: string | null;
  status: EventStatus;
  created_at: string;
  // Computed / aggregated field
  available_slots?: number;
  isHistorical?: boolean;
}

// For frontend backward-compatibility in UI components
export type BadmintonEvent = DatabaseEvent;

export interface RegistrationPayload {
  eventId: string;
  fullName: string;
  email?: string;
  phone: string;
  age?: number;
  gender?: string;
  skillLevel: SkillLevel;
  playingCategory?: string;
  emergencyContact?: string;
  utrReference?: string;
  paymentScreenshotPath?: string;
}

export interface PaymentAuditEntry {
  action: 'registered' | 'utr_submitted' | 'verified' | 'rejected' | 're_submitted' | 'attendance_updated';
  timestamp: string;
  actor: 'participant' | 'admin';
  note?: string;
  previousStatus?: string;
  newStatus?: string;
}

export interface EmailNotificationLog {
  sent: boolean;
  provider: 'resend';
  type: 'registration_received' | 'payment_verified' | 'payment_rejected';
  id?: string;
  error?: string;
  recipient: string;
  timestamp: string;
}

export interface RegistrationRecord {
  id: string;
  registration_number: string;
  event_id: string;
  full_name: string;
  email?: string;
  phone: string;
  age?: number;
  gender?: string;
  skill_level: SkillLevel;
  playing_category: string;
  emergency_contact?: string;
  payment_status: PaymentStatus;
  attendance_status: AttendanceStatus;
  registration_status?: ParticipantRegistrationStatus;
  rejection_reason?: string;
  utr_reference?: string;
  payment_screenshot_path?: string;
  payment_audit_history?: PaymentAuditEntry[];
  email_notifications?: EmailNotificationLog[];
  created_at: string;
}

export interface PaymentSettings {
  id: string;
  upi_id: string;
  qr_image_path?: string;
  account_display_name: string;
  payment_instructions?: string;
  resend_api_key?: string;
  resend_from_email?: string;
  organiser_whatsapp?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: 'admin' | 'organizer' | 'staff';
  created_at: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  title: string;
  caption: string;
  category: 'action' | 'community' | 'court';
  tag?: string;
}

export interface ContactFormData {
  name: string;
  whatsapp: string;
  email: string;
  subject: string;
  message: string;
}
