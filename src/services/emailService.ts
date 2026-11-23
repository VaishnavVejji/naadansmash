/**
 * Email Notification Service for NAADANSMASH using Resend.
 * 
 * Strict Requirement:
 * Only report emails as sent if the provider explicitly confirms success (HTTP 200/201 with delivery ID).
 * If the provider key is not configured or an error occurs, report sent: false and the exact reason.
 */

export interface EmailSendResult {
  sent: boolean;
  provider: 'resend';
  id?: string;
  error?: string;
  recipient: string;
  subject: string;
  timestamp: string;
}

export interface EmailParticipantInfo {
  fullName: string;
  email: string;
  registrationNumber: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  registrationFee: number;
  utrReference?: string;
  rejectionReason?: string;
}

const STORAGE_KEY_RESEND_KEY = 'naadansmash_resend_api_key';
const STORAGE_KEY_RESEND_FROM = 'naadansmash_resend_from_email';

export const emailService = {
  /**
   * Retrieves current Resend configuration from localStorage or Vite environment.
   */
  getConfig(): { apiKey: string; fromEmail: string; isConfigured: boolean } {
    let apiKey = '';
    let fromEmail = 'NAADANSMASH <onboarding@resend.dev>';

    try {
      apiKey = localStorage.getItem(STORAGE_KEY_RESEND_KEY) || '';
      fromEmail = localStorage.getItem(STORAGE_KEY_RESEND_FROM) || fromEmail;
    } catch {}

    if (!apiKey && typeof import.meta !== 'undefined' && import.meta.env) {
      apiKey = (import.meta.env.VITE_RESEND_API_KEY as string) || '';
      if (import.meta.env.VITE_RESEND_FROM_EMAIL) {
        fromEmail = import.meta.env.VITE_RESEND_FROM_EMAIL as string;
      }
    }

    return {
      apiKey: apiKey.trim(),
      fromEmail: fromEmail.trim(),
      isConfigured: Boolean(apiKey && apiKey.trim().startsWith('re_')),
    };
  },

  /**
   * Saves Resend credentials into local settings.
   */
  saveConfig(apiKey: string, fromEmail?: string): void {
    try {
      if (apiKey) {
        localStorage.setItem(STORAGE_KEY_RESEND_KEY, apiKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_RESEND_KEY);
      }
      if (fromEmail) {
        localStorage.setItem(STORAGE_KEY_RESEND_FROM, fromEmail.trim());
      }
    } catch (e) {
      console.warn('Failed to save Resend config to localStorage', e);
    }
  },

  /**
   * Performs an actual low-level delivery request to the Resend API endpoint.
   * Returns success ONLY if Resend returns 200/201 with a valid message id.
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<EmailSendResult> {
    const timestamp = new Date().toISOString();
    const config = this.getConfig();

    if (!options.to || !options.to.includes('@')) {
      return {
        sent: false,
        provider: 'resend',
        recipient: options.to || 'unknown',
        subject: options.subject,
        error: 'Invalid recipient email address.',
        timestamp,
      };
    }

    if (!config.isConfigured || !config.apiKey) {
      return {
        sent: false,
        provider: 'resend',
        recipient: options.to,
        subject: options.subject,
        error: 'Resend API key not configured. Add your key in Admin Portal Settings to enable automated email notifications.',
        timestamp,
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: config.fromEmail || 'NAADANSMASH <onboarding@resend.dev>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && data.id) {
        return {
          sent: true,
          provider: 'resend',
          id: data.id,
          recipient: options.to,
          subject: options.subject,
          timestamp,
        };
      }

      const errorMsg = data?.message || data?.error?.message || `Provider returned HTTP ${response.status} ${response.statusText}`;
      return {
        sent: false,
        provider: 'resend',
        error: errorMsg,
        recipient: options.to,
        subject: options.subject,
        timestamp,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network failure contacting Resend API';
      return {
        sent: false,
        provider: 'resend',
        error: msg,
        recipient: options.to,
        subject: options.subject,
        timestamp,
      };
    }
  },

  /**
   * 1. REGISTRATION RECEIVED EMAIL
   */
  async sendRegistrationReceivedEmail(info: EmailParticipantInfo): Promise<EmailSendResult> {
    const subject = `Your registration has been received — NAADANSMASH [#${info.registrationNumber}]`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1a1a1a; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eaeaea; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: #1f0847; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffd400; }
    .header p { margin: 0; font-size: 13px; color: rgba(255,255,255,0.8); }
    .content { padding: 28px 24px; }
    .badge { display: inline-block; padding: 6px 14px; background: #fff8d6; color: #855b00; font-weight: 700; border-radius: 20px; font-size: 12px; margin-bottom: 16px; border: 1px solid #ffd400; }
    .hero-text { font-size: 18px; font-weight: 700; color: #1f0847; margin: 0 0 12px; }
    .lead { font-size: 14px; line-height: 1.6; color: #444444; margin: 0 0 20px; }
    .card { background: #f9f9fa; border: 1px solid #e5e5e7; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eeeeee; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #666666; font-weight: 500; }
    .val { font-weight: 700; color: #111111; }
    .upi-box { background: #edf9f6; border: 1px solid #c2ece0; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .upi-title { font-weight: 800; color: #0f4c5c; font-size: 14px; text-transform: uppercase; margin: 0 0 8px; }
    .instructions { font-size: 13px; color: #235865; line-height: 1.5; margin: 0; }
    .footer { background: #fbfbfb; border-top: 1px solid #eaeaea; padding: 18px 24px; text-align: center; font-size: 12px; color: #777777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NAADANSMASH</h1>
      <p>Kochi Weekend Badminton Community</p>
    </div>
    <div class="content">
      <div class="badge">REGISTRATION RECEIVED</div>
      <div class="hero-text">Your registration has been received.</div>
      <p class="lead">Hi <strong>${info.fullName}</strong>, thank you for signing up! We have received your registration for the upcoming weekend game.</p>
      
      <div class="card">
        <div class="row"><span class="label">Registration Number</span><span class="val" style="color: #0f4c5c; font-family: monospace;">${info.registrationNumber}</span></div>
        <div class="row"><span class="label">Session</span><span class="val">${info.eventTitle}</span></div>
        <div class="row"><span class="label">Date</span><span class="val">${info.eventDate}</span></div>
        <div class="row"><span class="label">Timing</span><span class="val">${info.startTime.slice(0, 5)} – ${info.endTime.slice(0, 5)}</span></div>
        <div class="row"><span class="label">Venue</span><span class="val">${info.venue}</span></div>
        <div class="row"><span class="label">Entry Fee</span><span class="val">₹${info.registrationFee}</span></div>
      </div>

      <div class="upi-box">
        <div class="upi-title">Payment Instructions</div>
        <p class="instructions">
          1. Transfer <strong>₹${info.registrationFee}</strong> via GPay / PhonePe / Paytm to <strong>naadansmash@upi</strong>.<br>
          2. Enter your 12-digit transaction UTR reference number on the <strong>My Ticket</strong> lookup portal or message the organiser on WhatsApp.<br>
          3. Once verified by our organiser, your registration status will update to confirmed!
        </p>
      </div>

      <p style="font-size: 13px; color: #555555; line-height: 1.5;">
        You can check your status anytime using your Registration Number (<strong>${info.registrationNumber}</strong>) on the NAADANSMASH website.
      </p>
    </div>
    <div class="footer">
      NAADANSMASH Collective • Kochi, Kerala • WhatsApp: +91 83048 83872
    </div>
  </div>
</body>
</html>
`;

    const text = `
NAADANSMASH — REGISTRATION RECEIVED
======================================
Your registration has been received.

Hi ${info.fullName},

Thank you for registering for NAADANSMASH weekend badminton!

Registration Details:
- Registration Number: ${info.registrationNumber}
- Session: ${info.eventTitle}
- Date: ${info.eventDate}
- Timing: ${info.startTime.slice(0, 5)} - ${info.endTime.slice(0, 5)}
- Venue: ${info.venue}
- Entry Fee: ₹${info.registrationFee}

Payment Instructions:
1. Transfer ₹${info.registrationFee} via GPay/PhonePe/Paytm to naadansmash@upi.
2. Enter your 12-digit UTR reference on the NAADANSMASH "My Ticket" portal or message the organiser.
3. Once verified, your status will update to confirmed.

Check your ticket anytime on the website using your registration number.
Organiser WhatsApp: +91 83048 83872
`;

    return this.sendEmail({ to: info.email, subject, html, text });
  },

  /**
   * 2. PAYMENT VERIFIED EMAIL
   */
  async sendPaymentVerifiedEmail(info: EmailParticipantInfo): Promise<EmailSendResult> {
    const subject = `YOU'RE IN! Your NaadanSmash registration is confirmed [#${info.registrationNumber}]`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1a1a1a; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eaeaea; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: #0f4c5c; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffd400; }
    .content { padding: 28px 24px; }
    .badge-success { display: inline-block; padding: 6px 14px; background: #e6f8f0; color: #086b46; font-weight: 800; border-radius: 20px; font-size: 12px; margin-bottom: 16px; border: 1px solid #a3e8c7; }
    .headline { font-size: 22px; font-weight: 900; color: #0f4c5c; margin: 0 0 12px; line-height: 1.25; }
    .card { background: #f9f9fa; border: 1px solid #e5e5e7; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eeeeee; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #666666; font-weight: 500; }
    .val { font-weight: 700; color: #111111; }
    .checklist { background: #fffbe6; border: 1px solid #ffe58f; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
    .checklist-title { font-weight: 800; color: #ad6800; font-size: 13px; text-transform: uppercase; margin: 0 0 8px; }
    .footer { background: #fbfbfb; border-top: 1px solid #eaeaea; padding: 18px 24px; text-align: center; font-size: 12px; color: #777777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NAADANSMASH</h1>
      <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.85);">Spot Verified & Confirmed</p>
    </div>
    <div class="content">
      <div class="badge-success">PAYMENT VERIFIED</div>
      <div class="headline">YOU'RE IN! Your NaadanSmash registration is confirmed.</div>
      <p style="font-size:14px; line-height:1.6; color:#444; margin:0 0 20px;">
        Hi <strong>${info.fullName}</strong>, our organisers have verified your payment receipt. Your court allocation is secured for the upcoming session!
      </p>

      <div class="card">
        <div class="row"><span class="label">Registration Number</span><span class="val" style="color: #0f4c5c; font-family: monospace;">${info.registrationNumber}</span></div>
        <div class="row"><span class="label">Session</span><span class="val">${info.eventTitle}</span></div>
        <div class="row"><span class="label">Date</span><span class="val">${info.eventDate}</span></div>
        <div class="row"><span class="label">Court Time</span><span class="val">${info.startTime.slice(0, 5)} – ${info.endTime.slice(0, 5)}</span></div>
        <div class="row"><span class="label">Venue</span><span class="val">${info.venue}</span></div>
        <div class="row"><span class="label">Payment Status</span><span class="val" style="color:#086b46;">✓ VERIFIED</span></div>
      </div>

      <div class="checklist">
        <div class="checklist-title">🎒 What to Bring</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #613400; line-height: 1.6;">
          <li>Comfortable sports shoes</li>
          <li>Your badminton racquet (or ask organiser for a loaner)</li>
          <li>Personal water bottle</li>
          <li>Dry-fit sports apparel</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">
        Court bookings, organized match play, and post-game Kerala chai are all taken care of. See you on court!
      </p>
    </div>
    <div class="footer">
      NAADANSMASH Collective • Kochi, Kerala • WhatsApp: +91 83048 83872
    </div>
  </div>
</body>
</html>
`;

    const text = `
NAADANSMASH — PAYMENT VERIFIED
======================================
YOU'RE IN! Your NaadanSmash registration is confirmed.

Hi ${info.fullName},

Your payment has been successfully verified by our organiser. Your court spot is locked in!

Session Details:
- Registration Number: ${info.registrationNumber}
- Session: ${info.eventTitle}
- Date: ${info.eventDate}
- Court Time: ${info.startTime.slice(0, 5)} - ${info.endTime.slice(0, 5)}
- Venue: ${info.venue}
- Status: Confirmed & Paid

What to bring: Sports shoes, racquet (or loaner), water bottle, dry-fit sportswear.
Organized match play and post-match chai are included.

Organiser WhatsApp: +91 83048 83872
`;

    return this.sendEmail({ to: info.email, subject, html, text });
  },

  /**
   * 3. PAYMENT REJECTED EMAIL
   */
  async sendPaymentRejectedEmail(info: EmailParticipantInfo): Promise<EmailSendResult> {
    const subject = `Action Required: Payment Verification for NAADANSMASH [#${info.registrationNumber}]`;
    const reason = info.rejectionReason || 'The payment reference or receipt could not be verified against bank credits.';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1a1a1a; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #eaeaea; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: #82181a; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0 0 6px; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffd400; }
    .content { padding: 28px 24px; }
    .badge-rejected { display: inline-block; padding: 6px 14px; background: #ffebee; color: #b71c1c; font-weight: 800; border-radius: 20px; font-size: 12px; margin-bottom: 16px; border: 1px solid #ffcdd2; }
    .headline { font-size: 20px; font-weight: 800; color: #82181a; margin: 0 0 12px; }
    .alert-box { background: #fff5f5; border: 1px solid #feb2b2; border-left: 4px solid #e53e3e; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; color: #742a2a; }
    .card { background: #f9f9fa; border: 1px solid #e5e5e7; border-radius: 12px; padding: 18px; margin-bottom: 20px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eeeeee; font-size: 13px; }
    .row:last-child { border-bottom: none; }
    .label { color: #666666; font-weight: 500; }
    .val { font-weight: 700; color: #111111; }
    .action-box { background: #edf9f6; border: 1px solid #c2ece0; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #0f4c5c; }
    .footer { background: #fbfbfb; border-top: 1px solid #eaeaea; padding: 18px 24px; text-align: center; font-size: 12px; color: #777777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NAADANSMASH</h1>
      <p style="margin:0; font-size:13px; color:rgba(255,255,255,0.85);">Payment Verification Notice</p>
    </div>
    <div class="content">
      <div class="badge-rejected">PAYMENT REJECTED</div>
      <div class="headline">Payment verification was unsuccessful.</div>
      <p style="font-size:14px; line-height:1.6; color:#444; margin:0 0 16px;">
        Hi <strong>${info.fullName}</strong>, our organiser was unable to verify your payment for registration <strong>#${info.registrationNumber}</strong>.
      </p>

      <div class="alert-box">
        <strong>Administrator's Rejection Reason:</strong><br>
        "${reason}"
      </div>

      <div class="action-box">
        <strong style="display:block; margin-bottom: 6px;">How to resolve this:</strong>
        1. Open the <strong>My Ticket</strong> lookup on the NAADANSMASH website with your registration number (<strong>${info.registrationNumber}</strong>) and phone number to update your UTR reference number or upload a clear payment screenshot.<br><br>
        2. Or message organiser Sivaram directly on WhatsApp at <strong>+91 83048 83872</strong> with your transaction screenshot.
      </div>

      <div class="card">
        <div class="row"><span class="label">Registration Number</span><span class="val">${info.registrationNumber}</span></div>
        <div class="row"><span class="label">Session</span><span class="val">${info.eventTitle}</span></div>
        <div class="row"><span class="label">Entry Fee</span><span class="val">₹${info.registrationFee}</span></div>
      </div>
    </div>
    <div class="footer">
      NAADANSMASH Collective • Kochi, Kerala • WhatsApp: +91 83048 83872
    </div>
  </div>
</body>
</html>
`;

    const text = `
NAADANSMASH — PAYMENT REJECTED
======================================
Payment verification was unsuccessful.

Hi ${info.fullName},

Our organiser was unable to verify your payment for registration #${info.registrationNumber}.

Reason from Administrator:
"${reason}"

Instructions to resolve:
1. Open the "My Ticket" lookup on the NAADANSMASH website to submit the corrected 12-digit UTR reference.
2. Or contact organiser Sivaram on WhatsApp at +91 83048 83872 with your payment screenshot.

Session: ${info.eventTitle}
Entry Fee: ₹${info.registrationFee}
Registration Number: ${info.registrationNumber}
`;

    return this.sendEmail({ to: info.email, subject, html, text });
  },

  /**
   * Diagnostic test for the Resend API connection.
   */
  async testConnection(testToEmail: string): Promise<{ success: boolean; message: string; id?: string }> {
    const config = this.getConfig();
    if (!config.isConfigured) {
      return {
        success: false,
        message: 'Resend API key is not configured. Please enter a valid key starting with "re_".',
      };
    }

    const res = await this.sendEmail({
      to: testToEmail,
      subject: 'Test Notification — NAADANSMASH Email Service',
      html: '<p>This is a test notification confirming that the Resend email service is properly integrated with NAADANSMASH.</p>',
      text: 'This is a test notification confirming that the Resend email service is properly integrated with NAADANSMASH.',
    });

    if (res.sent) {
      return {
        success: true,
        message: `Test email successfully sent to ${testToEmail}! (Provider ID: ${res.id})`,
        id: res.id,
      };
    }

    return {
      success: false,
      message: res.error || 'Failed to dispatch test email through Resend.',
    };
  },
};
