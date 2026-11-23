import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { DatabaseEvent, SkillLevel, PaymentSettings, ParticipantRegistrationStatus } from '../../types';
import { eventsService } from '../../services/eventsService';
import { EmailSendResult } from '../../services/emailService';

interface RegistrationModalProps {
  event: DatabaseEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playerPhone?: string;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess,
  playerPhone,
}) => {
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState(playerPhone || '');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('Male');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('Intermediate');
  const [utrReference, setUtrReference] = useState('');
  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isOpen) {
      eventsService.getPaymentSettings().then((settings) => {
        setPaymentSettings(settings);
      });
      const lastPhone = localStorage.getItem('naadansmash_last_phone') || playerPhone || '';
      if (lastPhone && !phone) {
        setPhone(lastPhone);
      }
    }
  }, [isOpen, playerPhone]);

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

    // Require photo screenshot or UTR proof of payment
    if (!screenshotData && !utrReference.trim()) {
      setErrorMsg('Please attach a photo screenshot of your payment before sending for approval.');
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
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        eventsService.recordPlayerTicket(res.registrationNumber, cleanPhone, event.id);
        localStorage.setItem('naadansmash_last_phone', cleanPhone);
        setSuccessData({
          registrationNumber: res.registrationNumber,
          registrationId: res.registrationId,
          message: res.message,
          registrationStatus: 'payment_submitted',
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
    setGender('Male');
    setSkillLevel('Intermediate');
    setUtrReference('');
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
            <div className="text-center py-4 animate-fade-in space-y-5">
              <div>
                <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Clock className="w-9 h-9" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-2">
                  SENT FOR APPROVAL • UNDER REVIEW
                </div>
                <h4 className="font-heading font-extrabold text-2xl sm:text-3xl text-brand-black mb-2 uppercase leading-tight">
                  Registration Sent for Approval!
                </h4>
                <p className="text-sm text-brand-charcoal/80 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{fullName}</strong>. Your spot and payment screenshot have been submitted to the organiser for review.
                </p>
              </div>

              {/* Registration Number Card */}
              <div className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-center">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-brand-muted mb-1 font-semibold">
                  OFFICIAL REGISTRATION NUMBER
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
                  Saved with mobile number <strong>+91 {phone}</strong>
                </p>
              </div>

              {/* Status Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-amber-900 font-bold uppercase">
                  <span>Organiser Review in Progress</span>
                  <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px]">Under Review</span>
                </div>
                {screenshotData && (
                  <div className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payment screenshot uploaded and attached</span>
                  </div>
                )}
                {utrReference && (
                  <div className="text-amber-900">
                    Submitted UTR: <strong className="text-brand-black font-mono">{utrReference}</strong>
                  </div>
                )}
                <p className="text-amber-900/90 leading-relaxed text-[11px] pt-1 border-t border-amber-200/60">
                  Our organisers will verify bank credits before match time. You can check your pass status anytime under <strong>"My Tickets"</strong> in the top menu by entering your phone number (<strong>+91 {phone}</strong>).
                </p>
              </div>

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

              {/* Email Delivery Feedback */}
              {email && (
                <div className="p-3 rounded-xl bg-brand-offwhite border border-black/[0.06] text-xs font-mono text-left mb-6 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    {successData.emailResult?.sent ? (
                      <span className="text-emerald-700 font-semibold">
                        ✓ Confirmation email sent to {email}
                      </span>
                    ) : (
                      <span className="text-brand-muted">
                        ℹ Registered with email {email}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-extrabold text-xs uppercase tracking-widest transition-colors shadow-sm"
                >
                  Done — Back to Home
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
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                          Phone / WhatsApp *
                        </label>
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm focus:border-brand-teal transition-all font-mono"
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
                      Next: Scan official UPI QR code or copy UPI ID to complete payment
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
                          Scan & Pay
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Interactive Organiser QR Code */}
                        <div className="shrink-0 p-3 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                          <div className="w-36 h-36 flex items-center justify-center p-1 bg-white overflow-hidden rounded-xl">
                            <img
                              src={paymentSettings.qr_image_path || '/images/qr.jpeg'}
                              alt="Official UPI QR Code"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold tracking-wider text-brand-charcoal/70 uppercase mt-2">
                            Scan with Any UPI App
                          </span>
                        </div>

                        {/* Payment Details */}
                        <div className="flex-1 w-full space-y-2.5 text-xs text-brand-charcoal">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                              Payee Name
                            </span>
                            <span className="font-semibold text-brand-black text-sm">
                              {paymentSettings.account_display_name || 'Sivaram P Babu'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-brand-muted block">
                              Organiser UPI ID
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono font-bold text-brand-black text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] select-all">
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

                          <div className="p-2 rounded-xl bg-white border border-black/[0.06] text-[11px] font-mono text-brand-charcoal/90 leading-relaxed">
                            Pay <strong>₹{event.registration_fee}</strong> via any UPI app (GPay, PhonePe, Paytm, etc.) to the UPI ID or QR above, and attach the screenshot below.
                          </div>
                        </div>
                      </div>

                      {/* Payment Screenshot Upload (Required proof) */}
                      <div className="pt-3 border-t border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-black">
                            Photo Screenshot of Payment *
                          </label>
                          <span className="text-[10px] font-mono text-brand-teal font-semibold">
                            PNG, JPG, WEBP (Max 5MB)
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
                          <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-black/[0.08] bg-black/5">
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
                                <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Screenshot ready for approval
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
                            className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-brand-teal/40 hover:border-brand-teal hover:bg-white bg-black/[0.02] cursor-pointer transition-all text-center space-y-1.5 group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-teal-50 group-hover:bg-teal-100 text-brand-teal flex items-center justify-center transition-colors">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-mono font-bold text-brand-teal uppercase tracking-wider block">
                              Click or Drag & Drop to Attach Screenshot *
                            </span>
                            <span className="text-[10px] font-mono text-brand-muted block">
                              Upload the confirmation screenshot of your ₹{event.registration_fee} transfer
                            </span>
                          </label>
                        )}
                      </div>

                      {/* Optional 12-Digit UTR Input */}
                      <div className="pt-2.5 border-t border-black/[0.06] space-y-1">
                        <label className="block text-[11px] font-mono text-brand-charcoal uppercase tracking-wider font-semibold">
                          12-Digit UPI Transaction / UTR Number (Optional)
                        </label>
                        <input
                          type="text"
                          value={utrReference}
                          onChange={(e) => setUtrReference(e.target.value)}
                          placeholder="e.g. 432109876543 (optional)"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-mono focus:border-brand-teal outline-none transition-all"
                        />
                        <p className="text-[10px] text-brand-muted font-mono">
                          Optional: If visible in your UPI app, paste your 12-digit transaction ID.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SUBMISSION ACTIONS */}
                  <div className="pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-4 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:opacity-50 text-white font-heading font-extrabold text-xs sm:text-sm uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>{loading ? 'Sending Registration for Approval...' : 'Send Registration for Approval'}</span>
                    </button>
                    <p className="text-[11px] text-center text-brand-muted font-mono leading-relaxed">
                      Your registration and payment screenshot will be sent directly to the organiser for verification. You can check your pass anytime under <strong>My Tickets</strong> with your phone number.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[11px] text-brand-muted pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Protected against duplicate registrations and overselling.</span>
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
