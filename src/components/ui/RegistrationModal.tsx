import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, CheckCircle2, ArrowRight, Copy, Check, CreditCard, QrCode, Upload, Trash2, Mail, Clock, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DatabaseEvent, SkillLevel, PaymentSettings, ParticipantRegistrationStatus } from '../../types';
import { eventsService } from '../../services/eventsService';
import { createWhatsAppLink } from '../../utils/whatsapp';
import { EmailSendResult } from '../../services/emailService';

interface RegistrationModalProps {
  event: DatabaseEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('Male');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [utrReference, setUtrReference] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post-registration payment submission state
  const [postUtr, setPostUtr] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    registrationNumber: string;
    registrationId?: string;
    message: string;
    registrationStatus: ParticipantRegistrationStatus;
    emailResult?: EmailSendResult;
    utr?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const upiPaymentUri = useMemo(() => {
    if (!paymentSettings || !event) return '';
    const pa = encodeURIComponent(paymentSettings.upi_id);
    const pn = encodeURIComponent(paymentSettings.account_display_name);
    const am = encodeURIComponent(event.registration_fee.toString());
    const tn = encodeURIComponent(`NAADANSMASH - ${event.title}`);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [paymentSettings, event]);

  useEffect(() => {
    if (isOpen) {
      eventsService.getPaymentSettings().then((settings) => {
        setPaymentSettings(settings);
      });
    }
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setScreenshotName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshotData(null);
    setScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('Please enter your full name and 10-digit WhatsApp phone number.');
      setLoading(false);
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp phone number.');
      setLoading(false);
      return;
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await eventsService.registerPlayer({
        eventId: event.id,
        fullName,
        email: email.trim() || undefined,
        phone,
        age: age ? Number(age) : undefined,
        gender,
        skillLevel,
        utrReference: utrReference.trim() || undefined,
        paymentScreenshotPath: screenshotData || undefined,
      });

      if (res.success && res.registrationNumber) {
        setSuccessData({
          registrationNumber: res.registrationNumber,
          registrationId: res.registrationId,
          message: res.message,
          registrationStatus: res.registrationStatus || (utrReference.trim() || screenshotData ? 'payment_submitted' : 'received'),
          emailResult: res.emailResult,
          utr: utrReference.trim(),
        });
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePostRegistrationPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUtr.trim()) {
      setPostError('Please enter the 12-digit UPI UTR transaction reference number.');
      return;
    }
    if (!successData?.registrationNumber) return;

    setPostSubmitting(true);
    setPostError('');

    try {
      const res = await eventsService.submitPaymentDetails(
        successData.registrationNumber,
        phone,
        postUtr.trim()
      );
      if (res.success) {
        setSuccessData((prev) => prev ? {
          ...prev,
          registrationStatus: 'payment_submitted',
          utr: postUtr.trim(),
          message: 'Your payment details have been submitted for verification.',
        } : null);
      } else {
        setPostError(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit payment details';
      setPostError(msg);
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleCopyRegNumber = () => {
    if (successData?.registrationNumber) {
      navigator.clipboard.writeText(successData.registrationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyUpi = () => {
    if (paymentSettings?.upi_id) {
      navigator.clipboard.writeText(paymentSettings.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setErrorMsg('');
    setFullName('');
    setPhone('');
    setEmail('');
    setAge('');
    setUtrReference('');
    setPostUtr('');
    setPostError('');
    setScreenshotData(null);
    setScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-xl w-full border border-black/[0.08] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-brand-offwhite border-b border-black/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white border border-black/[0.08] text-brand-black">
              Session Registration
            </span>
            <h3 className="font-heading font-extrabold text-xl text-brand-black mt-1.5 uppercase">
              Secure Your Spot
            </h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 rounded-full text-brand-muted hover:text-brand-black hover:bg-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {successData ? (
            <div className="text-center py-4 animate-fade-in">
              {/* STATE 1: PAYMENT SUBMITTED */}
              {successData.registrationStatus === 'payment_submitted' ? (
                <div>
                  <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Clock className="w-9 h-9" />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-3">
                    PAYMENT SUBMITTED
                  </div>
                  <h4 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black mb-2 uppercase leading-tight">
                    Your payment details have been submitted for verification.
                  </h4>
                  <p className="text-sm text-brand-charcoal/80 mb-6 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{fullName}</strong>. We have received your 12-digit UTR transaction details. Our organisers verify bank credits before match time.
                  </p>
                </div>
              ) : (
                /* STATE 2: REGISTRATION RECEIVED */
                <div>
                  <div className="w-16 h-16 rounded-full bg-brand-teal text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="inline-block px-3 py-1 rounded-full bg-teal-50 text-brand-teal border border-teal-200 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-3">
                    REGISTRATION RECEIVED
                  </div>
                  <h4 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black mb-2 uppercase leading-tight">
                    Your registration has been received.
                  </h4>
                  <p className="text-sm text-brand-charcoal/80 mb-6 max-w-md mx-auto leading-relaxed">
                    Your spot is tentatively reserved for this weekend's session, <strong>{fullName}</strong>. Please complete the entry fee payment below to secure your spot.
                  </p>
                </div>
              )}

              {/* Registration Number Card */}
              <div className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] mb-6 text-center">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-muted mb-1 font-semibold">
                  UNIQUE REGISTRATION NUMBER
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono font-extrabold text-2xl sm:text-3xl text-brand-black tracking-wider">
                    {successData.registrationNumber}
                  </span>
                  <button
                    onClick={handleCopyRegNumber}
                    className="p-2 rounded-lg bg-white border border-black/[0.08] text-brand-charcoal hover:text-brand-teal transition-colors"
                    title="Copy Registration Number"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-brand-muted font-mono mt-1">
                  Keep this number handy to access your ticket confirmation.
                </p>
              </div>

              {/* Submitted Payment Info Display (if payment was submitted) */}
              {successData.registrationStatus === 'payment_submitted' && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-left mb-6 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-amber-900 font-bold uppercase">
                    <span>Payment Verification Pending</span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px]">Under Review</span>
                  </div>
                  {(successData.utr || utrReference) && (
                    <div className="text-amber-800">
                      Submitted UTR: <strong className="text-brand-black font-mono">{successData.utr || utrReference}</strong>
                    </div>
                  )}
                  {screenshotData && (
                    <div className="text-emerald-700 flex items-center gap-1.5 pt-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Payment receipt screenshot attached</span>
                    </div>
                  )}
                  <p className="text-[11px] text-brand-charcoal/70 pt-1">
                    Once our organiser verifies the bank credit, your status on "My Ticket" will update to Confirmed!
                  </p>
                </div>
              )}

              {/* Event Recap Card */}
              <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.06] text-left mb-6 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Session:</span>
                  <span className="font-semibold text-brand-black">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Date & Time:</span>
                  <span className="font-semibold text-brand-black">{event.event_date} ({event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Skill Level:</span>
                  <span className="font-semibold text-brand-black">{skillLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Venue:</span>
                  <span className="font-semibold text-brand-black truncate max-w-[240px]">{event.venue}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-black/[0.06]">
                  <span className="text-brand-muted">Entry Fee:</span>
                  <span className="font-bold text-brand-teal text-sm">₹{event.registration_fee}</span>
                </div>
              </div>

              {/* PAYMENT INSTRUCTIONS & INLINE SUBMISSION (For Registration Received State) */}
              {successData.registrationStatus === 'received' && paymentSettings && (
                <div className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-left mb-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                    <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-semibold">
                      <QrCode className="w-4 h-4" />
                      <span>Payment Instructions</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                      Instant UPI Scan
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 p-3 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                      <div className="w-28 h-28 flex items-center justify-center p-1 bg-white">
                        <QRCodeSVG
                          value={upiPaymentUri || `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.account_display_name)}&am=${event.registration_fee}&cu=INR`}
                          size={112}
                          level="M"
                          className="w-full h-full"
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-brand-charcoal/70 uppercase mt-2">
                        Scan with Any UPI App
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2 text-xs text-brand-charcoal">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                          Payee Name
                        </span>
                        <span className="font-semibold text-brand-black">
                          {paymentSettings.account_display_name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                          Organiser UPI ID
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-brand-black text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white border border-black/[0.08]">
                            {paymentSettings.upi_id}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.04] text-[11px] font-mono font-medium text-brand-charcoal flex items-center gap-1.5 transition-colors"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-brand-muted" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-brand-muted">
                        <span>Accepted: GPay • PhonePe • Paytm • BHIM</span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Form to Submit 12-Digit UTR */}
                  <form onSubmit={handlePostRegistrationPaymentSubmit} className="pt-3 border-t border-black/[0.06] space-y-2.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-black">
                      Paid via UPI? Submit 12-Digit UTR Reference
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={postUtr}
                        onChange={(e) => setPostUtr(e.target.value)}
                        placeholder="e.g. 432109876543"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono focus:border-brand-teal"
                      />
                      <button
                        type="submit"
                        disabled={postSubmitting}
                        className="px-5 py-2.5 rounded-xl bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
                      >
                        {postSubmitting ? 'Submitting...' : 'Submit Payment Details'}
                      </button>
                    </div>
                    {postError && (
                      <p className="text-xs text-rose-700 font-mono">{postError}</p>
                    )}
                    <p className="text-[10px] text-brand-muted">
                      Paid now or paying later? You can also submit your UTR anytime via the <strong>My Ticket</strong> lookup.
                    </p>
                  </form>
                </div>
              )}

              {/* Email Delivery Feedback */}
              {email && (
                <div className="p-3 rounded-xl bg-brand-offwhite border border-black/[0.06] text-xs font-mono text-left mb-6 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    {successData.emailResult?.sent ? (
                      <span className="text-emerald-700 font-semibold">
                        ✓ Confirmation email sent to {email} via Resend (Provider ID: {successData.emailResult.id})
                      </span>
                    ) : (
                      <span className="text-brand-muted">
                        ℹ Email delivery: {successData.emailResult?.error || 'Resend API key not configured in Admin Settings.'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* WhatsApp & Modal Navigation Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(() => {
                  const isPaymentSubmitted = successData.registrationStatus === 'payment_submitted';
                  const waInfo = createWhatsAppLink(
                    isPaymentSubmitted ? 'payment_verification' : 'registration_enquiry',
                    {
                      regNumber: successData.registrationNumber,
                      name: fullName,
                      eventTitle: event.title,
                      utr: successData.utr || utrReference,
                    }
                  );

                  return waInfo.isConfigured ? (
                    <a
                      href={waInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-teal text-white text-xs font-mono font-semibold uppercase tracking-wider hover:bg-[#126f8c] transition-colors"
                      title="Opens WhatsApp with prefilled enquiry"
                    >
                      <span>
                        {isPaymentSubmitted ? 'Enquire via WhatsApp' : 'Registration Enquiry on WhatsApp'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black/10 text-brand-muted text-xs font-mono uppercase tracking-wider cursor-not-allowed"
                    >
                      <span>WhatsApp Not Configured</span>
                    </button>
                  );
                })()}

                <button
                  onClick={resetAndClose}
                  className="px-6 py-3 rounded-full bg-brand-offwhite hover:bg-black hover:text-white border border-black/[0.08] text-xs font-mono uppercase tracking-wider text-brand-black transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Event Brief Header */}
              <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08] mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading font-bold text-base text-brand-black">
                    {event.title}
                  </h4>
                  <span className="font-heading font-extrabold text-base text-brand-teal">
                    ₹{event.registration_fee}
                  </span>
                </div>
                <div className="text-xs text-brand-charcoal font-mono">
                  {event.event_date} • {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)} • {event.venue}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Arjun Nair"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Phone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                    />
                  </div>
                </div>

                {/* Email Address for Confirmation & Status Updates */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                      Email Address (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-brand-muted">
                      For ticket confirmation & status updates
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. arjun@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                    />
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 25"
                      min={10}
                      max={80}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all text-brand-charcoal"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Skill Level */}
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                    Skill Level *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Beginner', 'Intermediate', 'Advanced'] as SkillLevel[]).map((level) => (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setSkillLevel(level)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold border transition-all ${
                          skillLevel === level
                            ? 'bg-brand-black text-white border-brand-black shadow-xs'
                            : 'bg-brand-offwhite text-brand-charcoal border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>


                {/* Organiser UPI QR Code & Payment Information Box */}
                {paymentSettings && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                      <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-semibold">
                        <QrCode className="w-4 h-4" />
                        <span>Organiser UPI QR Code & Payment</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                        Instant Scan
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Interactive Organiser QR Code */}
                      <div className="shrink-0 p-3 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                        <div className="w-28 h-28 flex items-center justify-center p-1 bg-white">
                          <QRCodeSVG
                            value={upiPaymentUri || `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.account_display_name)}&am=${event.registration_fee}&cu=INR`}
                            size={112}
                            level="M"
                            className="w-full h-full"
                          />
                        </div>
                        <span className="text-[9px] font-mono font-bold tracking-wider text-brand-charcoal/70 uppercase mt-2">
                          Scan with Any UPI App
                        </span>
                      </div>

                      {/* Payment Details & Quick Actions */}
                      <div className="flex-1 w-full space-y-2 text-xs text-brand-charcoal">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                            Payee Name
                          </span>
                          <span className="font-semibold text-brand-black">
                            {paymentSettings.account_display_name}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                            Organiser UPI ID
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-bold text-brand-black text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white border border-black/[0.08]">
                              {paymentSettings.upi_id}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.04] text-[11px] font-mono font-medium text-brand-charcoal flex items-center gap-1.5 transition-colors"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-brand-muted" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-mono text-brand-muted">Accepted:</span>
                          <span className="text-[10px] font-mono text-brand-charcoal font-semibold">
                            GPay • PhonePe • Paytm • BHIM
                          </span>
                        </div>

                        {/* Mobile tap to pay link */}
                        <a
                          href={upiPaymentUri}
                          className="sm:hidden inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-brand-teal text-white text-[11px] font-mono font-semibold uppercase tracking-wider hover:bg-[#126f8c] transition-colors mt-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Tap to Open in UPI App</span>
                        </a>
                      </div>
                    </div>

                    {/* UTR Input */}
                    <div className="pt-2.5 border-t border-black/[0.06]">
                      <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1">
                        12-Digit UPI UTR Reference (Optional / Pay at Venue)
                      </label>
                      <input
                        type="text"
                        value={utrReference}
                        onChange={(e) => setUtrReference(e.target.value)}
                        placeholder="e.g. 432109876543 (if pre-paid)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono focus:border-brand-teal transition-all"
                      />
                      <p className="text-[10px] text-brand-muted mt-1">
                        Paid via QR? Paste the 12-digit transaction UTR number above to speed up court check-in.
                      </p>
                    </div>

                    {/* Optional Payment Screenshot Upload */}
                    <div className="pt-2.5 border-t border-black/[0.06]">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider">
                          Upload Payment Screenshot (Optional)
                        </label>
                        <span className="text-[10px] font-mono text-brand-teal font-semibold">
                          PNG, JPG, WEBP
                        </span>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleScreenshotChange}
                        className="hidden"
                        id="payment-screenshot-upload"
                      />

                      {screenshotData ? (
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/[0.08] bg-black/5">
                              <img
                                src={screenshotData}
                                alt="Payment Screenshot"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-mono font-bold text-emerald-800 truncate">
                                {screenshotName || 'Payment Screenshot Attached'}
                              </p>
                              <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Ready for court verification
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveScreenshot}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove screenshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="payment-screenshot-upload"
                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-black/20 hover:border-brand-teal hover:bg-white bg-black/[0.02] cursor-pointer transition-all text-xs font-mono text-brand-charcoal"
                        >
                          <Upload className="w-3.5 h-3.5 text-brand-teal" />
                          <span>Attach Receipt Screenshot (Optional)</span>
                        </label>
                      )}
                      <p className="text-[10px] text-brand-muted mt-1">
                        Attach your UPI payment confirmation screenshot for fast-track verification on court.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? 'Securing Spot in Database...' : `Confirm Registration (₹${event.registration_fee})`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-brand-muted pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Atomic transaction protected against duplicate registrations and overselling.</span>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
