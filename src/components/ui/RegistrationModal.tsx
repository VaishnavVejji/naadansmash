import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Copy, 
  Check, 
  QrCode, 
  Upload, 
  Trash2, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Smartphone
} from 'lucide-react';
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
  const [step, setStep] = useState<'details' | 'payment'>('details');
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

  const gpayUri = useMemo(() => {
    if (!paymentSettings || !event) return '';
    const pa = encodeURIComponent(paymentSettings.upi_id);
    const pn = encodeURIComponent(paymentSettings.account_display_name);
    const am = encodeURIComponent(event.registration_fee.toString());
    const tn = encodeURIComponent(`NAADANSMASH - ${event.title}`);
    return `tez://upi/pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [paymentSettings, event]);

  const phonepeUri = useMemo(() => {
    if (!paymentSettings || !event) return '';
    const pa = encodeURIComponent(paymentSettings.upi_id);
    const pn = encodeURIComponent(paymentSettings.account_display_name);
    const am = encodeURIComponent(event.registration_fee.toString());
    const tn = encodeURIComponent(`NAADANSMASH - ${event.title}`);
    return `phonepe://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [paymentSettings, event]);

  const paytmUri = useMemo(() => {
    if (!paymentSettings || !event) return '';
    const pa = encodeURIComponent(paymentSettings.upi_id);
    const pn = encodeURIComponent(paymentSettings.account_display_name);
    const am = encodeURIComponent(event.registration_fee.toString());
    const tn = encodeURIComponent(`NAADANSMASH - ${event.title}`);
    return `paytmmp://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
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

    if (!event) {
      setLoading(false);
      return;
    }

    if (event.status === 'closed' || (event.available_slots !== undefined && event.available_slots <= 0)) {
      setErrorMsg('Registrations are currently closed for this session. Nobody else can register.');
      setLoading(false);
      return;
    }

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

  const handleProceedToPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (event.status === 'closed' || (event.available_slots !== undefined && event.available_slots <= 0)) {
      setErrorMsg('Registrations are currently closed for this session.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg('Please enter your full name and 10-digit WhatsApp phone number.');
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp phone number.');
      return;
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStep('payment');
  };

  const resetAndClose = () => {
    setSuccessData(null);
    setStep('details');
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white border border-black/[0.08] text-brand-black">
                Session Registration
              </span>
              {!successData && (
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                  {step === 'details' ? 'Step 1: Details' : 'Step 2: Payment'}
                </span>
              )}
            </div>
            <h3 className="font-heading font-extrabold text-xl text-brand-black mt-1.5 uppercase">
              {successData ? 'Registration Confirmed' : step === 'details' ? 'Player Information' : 'UPI Payment & QR'}
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
                      <div className="w-28 h-28 flex items-center justify-center p-1 bg-white overflow-hidden rounded-xl">
                        {paymentSettings.qr_image_path ? (
                          <img
                            src={paymentSettings.qr_image_path}
                            alt="Official UPI QR Code"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QRCodeSVG
                            value={upiPaymentUri || `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.account_display_name)}&am=${event.registration_fee}&cu=INR`}
                            size={112}
                            level="M"
                            className="w-full h-full"
                          />
                        )}
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

                  {/* 1-Tap Direct UPI App Payment on Mobile */}
                  <div className="pt-2 border-t border-black/[0.06] space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                      1-Tap Direct Payment on Phone:
                    </div>

                    {/* Primary Google Pay Direct Launcher */}
                    <a
                      href={gpayUri}
                      className="w-full inline-flex items-center justify-between py-3 px-4 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all transform active:scale-[0.98]"
                      title="Directly opens Google Pay app"
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-white" />
                        <span>Pay ₹{event.registration_fee} with Google Pay (GPay)</span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold bg-white/20 px-2.5 py-0.5 rounded-full">
                        Open GPay →
                      </span>
                    </a>

                    {/* Quick App Selector: PhonePe, Paytm, Any UPI */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
                      <a
                        href={phonepeUri}
                        className="py-2.5 px-2 rounded-xl bg-[#5f259f] hover:bg-[#4d1d82] text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                        title="Directly opens PhonePe app"
                      >
                        🟣 PhonePe
                      </a>
                      <a
                        href={paytmUri}
                        className="py-2.5 px-2 rounded-xl bg-[#002e6e] hover:bg-[#002252] text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                        title="Directly opens Paytm app"
                      >
                        🔷 Paytm
                      </a>
                      <a
                        href={upiPaymentUri}
                        className="py-2.5 px-2 rounded-xl bg-brand-charcoal hover:bg-black text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                        title="Open device default UPI app chooser"
                      >
                        ⚡ Any UPI
                      </a>
                    </div>
                    <p className="text-[10px] text-center text-brand-muted mt-1 font-mono">
                      Paying to <strong>{paymentSettings.upi_id}</strong> ({paymentSettings.account_display_name})
                    </p>
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

              {(event.status === 'closed' || (event.available_slots !== undefined && event.available_slots <= 0)) && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                  <span className="font-semibold">
                    Registration is currently closed for this session. Nobody else can register.
                  </span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4">
                  {errorMsg}
                </div>
              )}

              {/* 2-Step Progress Indicator */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    step === 'details'
                      ? 'bg-brand-black text-white border-brand-black shadow-xs'
                      : 'bg-brand-offwhite text-brand-charcoal border-black/[0.08] hover:bg-black/[0.04]'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-70">Step 1</div>
                  <div className="text-xs font-heading font-bold uppercase truncate">Your Details</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (fullName.trim() && phone.trim().length >= 10) {
                      setStep('payment');
                    } else {
                      handleProceedToPayment();
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    step === 'payment'
                      ? 'bg-brand-black text-white border-brand-black shadow-xs'
                      : 'bg-brand-offwhite text-brand-charcoal border-black/[0.08] hover:bg-black/[0.04]'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider font-semibold opacity-70">Step 2</div>
                  <div className="text-xs font-heading font-bold uppercase truncate">QR Payment & Approval</div>
                </button>
              </div>

              {step === 'details' ? (
                /* STEP 1: PLAYER DETAILS */
                <form onSubmit={handleProceedToPayment} className="space-y-4">
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

                  <div className="pt-3">
                    {event.status === 'closed' || (event.available_slots !== undefined && event.available_slots <= 0) ? (
                      <button
                        type="button"
                        disabled
                        className="w-full py-3.5 px-6 rounded-full bg-gray-200 text-gray-500 font-heading font-semibold text-xs sm:text-sm uppercase tracking-widest cursor-not-allowed border border-gray-300 flex items-center justify-center gap-2"
                      >
                        <span>Registration Closed</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2"
                      >
                        <span>Proceed to Payment (₹{event.registration_fee})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-[11px] text-center text-brand-muted mt-2 font-mono">
                      Next: Scan official UPI QR code or pay via 1-tap Google Pay app
                    </p>
                  </div>
                </form>
              ) : (
                /* STEP 2: PAYMENT & QR CODE SESSION */
                <div className="space-y-4 animate-fade-in">
                  {/* Back to Details & Summary Strip */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep('details')}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-brand-teal hover:underline"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>← Edit Player Details</span>
                    </button>
                    <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
                      Step 2 of 2
                    </span>
                  </div>

                  {/* Player Summary Card */}
                  <div className="p-3.5 rounded-2xl bg-brand-offwhite border border-black/[0.08] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-brand-muted block text-[10px] uppercase font-bold">Player Details</span>
                      <strong className="text-brand-black">{fullName}</strong>
                      <span className="text-brand-charcoal text-[11px]"> • +91 {phone} ({skillLevel})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-brand-muted block text-[10px] uppercase font-bold">Amount Due</span>
                      <strong className="text-brand-teal text-base font-extrabold">₹{event.registration_fee}</strong>
                    </div>
                  </div>

                  {/* Organiser UPI QR Code & Payment Information Box */}
                  {paymentSettings && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] space-y-4">
                      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                        <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-semibold">
                          <QrCode className="w-4 h-4" />
                          <span>Official Organiser UPI QR Code</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                          Instant Scan
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Interactive Organiser QR Code */}
                        <div className="shrink-0 p-3 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                          <div className="w-32 h-32 flex items-center justify-center p-1 bg-white overflow-hidden rounded-xl">
                            {paymentSettings.qr_image_path ? (
                              <img
                                src={paymentSettings.qr_image_path}
                                alt="Official UPI QR Code"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <QRCodeSVG
                                value={upiPaymentUri || `upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.account_display_name)}&am=${event.registration_fee}&cu=INR`}
                                size={128}
                                level="M"
                                className="w-full h-full"
                              />
                            )}
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

                          {/* 1-Tap Direct UPI App Payment on Mobile */}
                          <div className="pt-2 border-t border-black/[0.06] space-y-2">
                            {/* Primary Google Pay Direct Launcher */}
                            <a
                              href={gpayUri}
                              className="w-full inline-flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all transform active:scale-[0.98]"
                              title="Directly opens Google Pay app"
                            >
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-white" />
                                <span>Pay ₹{event.registration_fee} with Google Pay</span>
                              </div>
                              <span className="text-[10px] font-mono font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                                Open GPay →
                              </span>
                            </a>

                            {/* Quick App Choices */}
                            <div className="grid grid-cols-3 gap-1.5 text-center">
                              <a
                                href={phonepeUri}
                                className="py-2 px-1.5 rounded-lg bg-[#5f259f] hover:bg-[#4d1d82] text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                                title="Open PhonePe app"
                              >
                                🟣 PhonePe
                              </a>
                              <a
                                href={paytmUri}
                                className="py-2 px-1.5 rounded-lg bg-[#002e6e] hover:bg-[#002252] text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                                title="Open Paytm app"
                              >
                                🔷 Paytm
                              </a>
                              <a
                                href={upiPaymentUri}
                                className="py-2 px-1.5 rounded-lg bg-brand-charcoal hover:bg-black text-white font-mono font-bold text-[10px] uppercase tracking-wider transition-all truncate shadow-xs"
                                title="Open device UPI chooser"
                              >
                                ⚡ Any App
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* UTR Input */}
                      <div className="pt-2.5 border-t border-black/[0.06]">
                        <label className="block text-[11px] font-mono text-brand-muted uppercase tracking-wider mb-1">
                          12-Digit UPI Transaction / UTR Number (Optional / Speed Up Verification)
                        </label>
                        <input
                          type="text"
                          value={utrReference}
                          onChange={(e) => setUtrReference(e.target.value)}
                          placeholder="e.g. 432109876543 (paste from GPay / PhonePe)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono focus:border-brand-teal transition-all"
                        />
                        <p className="text-[10px] text-brand-muted mt-1">
                          Paid via UPI? Paste the 12-digit transaction UTR number above to speed up court verification.
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
                          Attach your UPI payment confirmation screenshot for fast-track verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SUBMISSION ACTIONS */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:opacity-50 text-white font-heading font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{loading ? 'Submitting for Approval...' : 'Done Payment — Send for Approval'}</span>
                    </button>
                    <p className="text-[11px] text-center text-brand-charcoal/80 font-mono">
                      Click above once you have transferred ₹{event.registration_fee} to send your spot for organiser verification.
                    </p>

                    <div className="text-center pt-1 border-t border-black/[0.06]">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="text-xs font-mono text-brand-muted hover:text-brand-black transition-colors underline"
                      >
                        Need to pay later or at venue? Reserve spot without pre-payment →
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-brand-muted pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Atomic transaction protected against duplicate registrations and overselling.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
