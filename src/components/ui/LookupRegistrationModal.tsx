import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  AlertCircle, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MessageCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Upload, 
  ShieldCheck, 
  FileText,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { eventsService } from '../../services/eventsService';
import { PaymentSettings, ParticipantRegistrationStatus } from '../../types';
import { 
  createWhatsAppLink, 
  getFormattedOrganiserWhatsApp 
} from '../../utils/whatsapp';

interface LookupRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LookupRegistrationModal: React.FC<LookupRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [regNumber, setRegNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // In-modal payment details submission (for 'received' and 'rejected' states)
  const [inlineUtr, setInlineUtr] = useState('');
  const [inlineScreenshot, setInlineScreenshot] = useState<string | null>(null);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSubmitError, setInlineSubmitError] = useState('');
  const [inlineSubmitSuccess, setInlineSubmitSuccess] = useState('');

  // Copy feedback states
  const [copiedReg, setCopiedReg] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      eventsService.getPaymentSettings().then(setPaymentSettings);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim() || !phone.trim()) {
      setErrorMsg('Please enter both your Registration Number and Phone Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setInlineSubmitSuccess('');
    setInlineSubmitError('');

    try {
      const res = await eventsService.lookupRegistration(regNumber.trim(), phone.trim());
      if (res.found && res.registration) {
        setResult(res.registration);
      } else {
        setErrorMsg(res.message || 'No matching registration found. Please verify your details.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lookup failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setInlineSubmitError('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setInlineSubmitError('Screenshot file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInlineScreenshot(reader.result);
        setInlineSubmitError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInlineSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineUtr.trim()) {
      setInlineSubmitError('Please enter your 12-digit UPI transaction reference (UTR).');
      return;
    }

    setInlineSubmitting(true);
    setInlineSubmitError('');
    setInlineSubmitSuccess('');

    try {
      const res = await eventsService.submitPaymentDetails(
        result.registration_number,
        phone,
        inlineUtr.trim(),
        inlineScreenshot || undefined
      );

      if (res.success && res.registration) {
        setResult({
          ...result,
          ...res.registration,
          registration_status: 'payment_submitted',
          utr_reference: inlineUtr.trim(),
          payment_status: 'pending',
          rejection_reason: undefined,
        });
        setInlineSubmitSuccess('Your payment details have been submitted for verification.');
        setInlineUtr('');
        setInlineScreenshot(null);
      } else {
        setInlineSubmitError(res.message || 'Failed to submit payment details. Please try again.');
      }
    } catch (err: any) {
      setInlineSubmitError(err?.message || 'Error submitting payment details.');
    } finally {
      setInlineSubmitting(false);
    }
  };

  const handleCopyReg = () => {
    if (result?.registration_number) {
      navigator.clipboard.writeText(result.registration_number);
      setCopiedReg(true);
      setTimeout(() => setCopiedReg(false), 2000);
    }
  };

  const handleCopyUpi = () => {
    if (paymentSettings?.upi_id) {
      navigator.clipboard.writeText(paymentSettings.upi_id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleFillTestId = (testRegNo: string, testPhone: string) => {
    setRegNumber(testRegNo);
    setPhone(testPhone);
    setErrorMsg('');
  };

  const resetAndClose = () => {
    setResult(null);
    setErrorMsg('');
    setRegNumber('');
    setPhone('');
    setInlineUtr('');
    setInlineScreenshot(null);
    setInlineSubmitError('');
    setInlineSubmitSuccess('');
    onClose();
  };

  // Determine current participant status
  const currentStatus: ParticipantRegistrationStatus = result?.registration_status || (
    result?.payment_status === 'verified' 
      ? 'confirmed' 
      : result?.payment_status === 'rejected' 
      ? 'rejected' 
      : result?.utr_reference 
      ? 'payment_submitted' 
      : 'received'
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-xl w-full border border-black/[0.08] shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-brand-black text-white flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 text-brand-teal flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm text-white uppercase tracking-tight block">
                My Ticket & Registration Lookup
              </span>
              <span className="text-[10px] font-mono text-white/60">
                Secure 1-to-1 participant lookup
              </span>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-semibold">Verification Notice</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {result ? (
            /* =========================================================================
             * RESULT VIEW: EXPLICIT 4-STATE PARTICIPANT NOTIFICATION EXPERIENCES
             * ========================================================================= */
            <div className="space-y-5 animate-fade-in">
              {/* STATUS-SPECIFIC HERO BANNER */}

              {/* 1. REGISTRATION RECEIVED */}
              {currentStatus === 'received' && (
                <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-200/70 text-sky-900 inline-block mb-1">
                      Registration Received • Payment Pending
                    </span>
                    <h3 className="font-heading font-extrabold text-base text-sky-950 uppercase leading-snug">
                      Your registration has been received.
                    </h3>
                    <p className="text-xs text-sky-900/80 mt-1 leading-relaxed">
                      Your spot on the roster is reserved pending entry fee verification. Follow the payment instructions below to finalize your booking.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. PAYMENT SUBMITTED */}
              {currentStatus === 'payment_submitted' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 inline-block mb-1">
                      Payment Submitted • Awaiting Verification
                    </span>
                    <h3 className="font-heading font-extrabold text-base text-amber-950 uppercase leading-snug">
                      Your payment details have been submitted for verification.
                    </h3>
                    <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
                      The NAADANSMASH team is currently matching your submitted UTR reference against incoming bank credits. Verification usually completes within 1-2 hours.
                    </p>
                  </div>
                </div>
              )}

              {/* 3. PAYMENT VERIFIED / CONFIRMED */}
              {currentStatus === 'confirmed' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 inline-block mb-1">
                      ✓ Confirmed & Paid • Court Pass Ready
                    </span>
                    <h3 className="font-heading font-black text-lg text-emerald-950 uppercase leading-snug tracking-tight">
                      YOU'RE IN! Your NaadanSmash registration is confirmed.
                    </h3>
                    <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                      Your entry fee has been verified. Present this registration number at the reception desk for instant court check-in.
                    </p>
                  </div>
                </div>
              )}

              {/* 4. PAYMENT REJECTED */}
              {currentStatus === 'rejected' && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 inline-block mb-1">
                      Payment Verification Unsuccessful
                    </span>
                    <h3 className="font-heading font-black text-lg text-rose-950 uppercase leading-snug tracking-tight">
                      Action Required: Payment Verification Rejected
                    </h3>
                    <p className="text-xs text-rose-900/80 mt-1 leading-relaxed">
                      The organiser was unable to match your payment details with our bank credits. Please review the rejection reason and contact the organiser or re-submit your corrected UTR below.
                    </p>
                  </div>
                </div>
              )}

              {/* REJECTION REASON CALLOUT (For Rejected State) */}
              {currentStatus === 'rejected' && (
                <div className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-mono font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Administrator Rejection Reason:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-900 text-xs font-medium leading-relaxed">
                    "{result.rejection_reason || 'Payment details could not be verified in the organiser bank statement.'}"
                  </div>
                  <p className="text-[11px] text-brand-charcoal/80 leading-relaxed pt-1">
                    Please check your UPI payment app (Google Pay, PhonePe, Paytm, BHIM) for the 12-digit transaction ID / UTR number, or reach out to the organiser directly.
                  </p>
                </div>
              )}

              {/* REGISTRATION NUMBER CARD */}
              <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-muted block mb-1">
                  Registration Number
                </span>
                <div className="flex items-center justify-center gap-2.5">
                  <span className="font-mono font-extrabold text-2xl text-brand-black tracking-wider">
                    {result.registration_number}
                  </span>
                  <button
                    onClick={handleCopyReg}
                    className="p-1.5 rounded-lg bg-white border border-black/[0.08] text-brand-charcoal hover:text-brand-teal transition-colors"
                    title="Copy Registration Number"
                  >
                    {copiedReg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* PLAYER & SESSION DETAILS GRID */}
              <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.06] text-xs font-mono space-y-2">
                <div className="flex justify-between border-b border-black/[0.06] pb-2">
                  <span className="text-brand-muted">Player Name:</span>
                  <span className="font-bold text-brand-black">{result.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Session:</span>
                  <span className="font-semibold text-brand-black">{result.event_title || 'Weekend Badminton Session'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Date & Time:</span>
                  <span className="font-semibold text-brand-black">
                    {result.event_date || 'Upcoming Weekend'} {result.start_time ? `(${result.start_time.slice(0, 5)} – ${result.end_time?.slice(0, 5)})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Skill Level:</span>
                  <span className="font-semibold text-brand-black capitalize">{result.skill_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Venue:</span>
                  <span className="font-semibold text-brand-black truncate max-w-[220px]">{result.venue || 'Kochi Badminton Arena'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-black/[0.06]">
                  <span className="text-brand-muted">Entry Fee:</span>
                  <span className="font-bold text-brand-teal text-sm">₹{result.registration_fee || 250}</span>
                </div>
                {result.utr_reference && (
                  <div className="flex justify-between pt-1 border-t border-black/[0.06]">
                    <span className="text-brand-muted">Submitted UTR:</span>
                    <strong className="font-mono text-brand-black">{result.utr_reference}</strong>
                  </div>
                )}
              </div>

              {/* GAME-DAY CHECKLIST (For Confirmed Players) */}
              {currentStatus === 'confirmed' && (
                <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-mono font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Game Day Essentials</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-brand-charcoal">
                    <div className="p-2 rounded-xl bg-brand-offwhite">
                      <span className="font-bold block">🏸 Racket</span>
                      <span className="text-[10px] text-brand-muted">Loaners available on request</span>
                    </div>
                    <div className="p-2 rounded-xl bg-brand-offwhite">
                      <span className="font-bold block">👟 Non-Marking Shoes</span>
                      <span className="text-[10px] text-brand-muted">Indoor court shoes required</span>
                    </div>
                    <div className="p-2 rounded-xl bg-brand-offwhite">
                      <span className="font-bold block">🥤 Water Bottle</span>
                      <span className="text-[10px] text-brand-muted">Stay hydrated on court</span>
                    </div>
                    <div className="p-2 rounded-xl bg-brand-offwhite">
                      <span className="font-bold block">👕 Sportswear</span>
                      <span className="text-[10px] text-brand-muted">Dry-fit active apparel</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT INSTRUCTIONS & INLINE UTR SUBMISSION (For 'received' or 'rejected' states) */}
              {(currentStatus === 'received' || currentStatus === 'rejected') && paymentSettings && (
                <div className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                    <div className="flex items-center gap-2 text-brand-teal font-mono text-xs uppercase tracking-wider font-semibold">
                      <QrCode className="w-4 h-4" />
                      <span>{currentStatus === 'rejected' ? 'Re-payment & Verification' : 'Payment Instructions'}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold uppercase">
                      UPI QR Code
                    </span>
                  </div>

                  {inlineSubmitSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{inlineSubmitSuccess}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 p-2.5 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                      <div className="w-24 h-24 flex items-center justify-center p-1 bg-white overflow-hidden rounded-xl">
                        {paymentSettings.qr_image_path ? (
                          <img
                            src={paymentSettings.qr_image_path}
                            alt="Official UPI QR Code"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <QRCodeSVG
                            value={`upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.account_display_name)}&am=${result.registration_fee || 250}&cu=INR`}
                            size={96}
                            level="M"
                          />
                        )}
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-brand-muted uppercase mt-1.5">
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
                          <span className="font-mono font-bold text-brand-black text-xs px-2.5 py-1 rounded-lg bg-white border border-black/[0.08]">
                            {paymentSettings.upi_id}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.04] text-[10px] font-mono font-medium text-brand-charcoal flex items-center gap-1 transition-colors"
                          >
                            {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-brand-muted" />}
                            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-brand-muted">
                        Accepted: Google Pay • PhonePe • Paytm • BHIM
                      </div>
                    </div>
                  </div>

                  {/* 1-Tap Open UPI App Button */}
                  <div className="pt-2 border-t border-black/[0.06]">
                    <a
                      href={`upi://pay?pa=${encodeURIComponent(paymentSettings.upi_id)}&pn=${encodeURIComponent(paymentSettings.account_display_name || 'Sivaram P Babu')}&am=${result.registration_fee || 250}&cu=INR&tn=${encodeURIComponent(`NAADANSMASH ${result.registration_number}`)}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-teal to-[#0f4c5c] hover:from-[#126f8c] hover:to-[#0d3f4d] text-white font-heading font-bold text-xs uppercase tracking-wider shadow-sm transition-all transform active:scale-[0.98]"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-300" />
                      <span>Open UPI App to Pay ₹{result.registration_fee || 250} (GPay / PhonePe / Paytm)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-[10px] text-center text-brand-muted mt-1 font-mono">
                      Paying to <strong>{paymentSettings.upi_id}</strong> ({paymentSettings.account_display_name})
                    </p>
                  </div>

                  {/* Inline Form to Submit 12-Digit UTR */}
                  <form onSubmit={handleInlineSubmitPayment} className="pt-3 border-t border-black/[0.06] space-y-2.5">
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-black">
                      {currentStatus === 'rejected' ? 'Re-Submit Corrected 12-Digit UTR Reference' : 'Submit 12-Digit UTR Reference'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={inlineUtr}
                        onChange={(e) => setInlineUtr(e.target.value)}
                        placeholder="e.g. 432109876543"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.08] text-xs font-mono focus:border-brand-teal uppercase"
                      />
                      <button
                        type="submit"
                        disabled={inlineSubmitting}
                        className="px-4 py-2.5 rounded-xl bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
                      >
                        {inlineSubmitting ? 'Submitting...' : 'Submit Payment Details'}
                      </button>
                    </div>

                    {/* Optional Screenshot Upload */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.02] text-[11px] font-mono text-brand-charcoal cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-brand-teal" />
                        <span>{inlineScreenshot ? 'Screenshot Attached ✓' : 'Upload Receipt Screenshot (Optional)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          className="hidden"
                        />
                      </label>
                      {inlineScreenshot && (
                        <button
                          type="button"
                          onClick={() => setInlineScreenshot(null)}
                          className="text-[10px] font-mono text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {inlineSubmitError && (
                      <p className="text-xs text-rose-700 font-mono">{inlineSubmitError}</p>
                    )}
                  </form>
                </div>
              )}

              {/* WHATSAPP CONTACT ACTION (Configurable & Prefilled) */}
              <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Organiser WhatsApp Support</span>
                  </span>
                  <span className="text-[10px] font-mono text-brand-muted">
                    {getFormattedOrganiserWhatsApp()} (Sivaram)
                  </span>
                </div>

                {/* Status-specific WhatsApp prefilled button */}
                {currentStatus === 'received' && (
                  <a
                    href={createWhatsAppLink('registration_enquiry', {
                      regNumber: result.registration_number,
                      name: result.full_name,
                      eventTitle: result.event_title || 'Weekend Badminton Session',
                    }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Ask Registration Enquiry on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                {currentStatus === 'payment_submitted' && (
                  <a
                    href={createWhatsAppLink('payment_verification', {
                      regNumber: result.registration_number,
                      name: result.full_name,
                      eventTitle: result.event_title || 'Weekend Badminton Session',
                      utr: result.utr_reference || undefined,
                    }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Check Verification Status on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                {currentStatus === 'confirmed' && (
                  <a
                    href={createWhatsAppLink('event_info', {
                      regNumber: result.registration_number,
                      name: result.full_name,
                      eventTitle: result.event_title || 'Weekend Badminton Session',
                    }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-black hover:bg-brand-charcoal text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Event Information on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                {currentStatus === 'rejected' && (
                  <a
                    href={createWhatsAppLink('payment_rejection_appeal', {
                      regNumber: result.registration_number,
                      name: result.full_name,
                      eventTitle: result.event_title || 'Weekend Badminton Session',
                      rejectionReason: result.rejection_reason || 'Payment details could not be verified.',
                    }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Contact Organiser Regarding Rejection</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}

                <p className="text-[10px] text-brand-muted text-center leading-snug">
                  Clicking opens your personal WhatsApp app with a prefilled message. Messages are not sent automatically.
                </p>
              </div>

              {/* Reset / Lookup Another Registration */}
              <button
                onClick={() => {
                  setResult(null);
                  setInlineSubmitSuccess('');
                  setInlineSubmitError('');
                }}
                className="w-full py-3 rounded-full bg-brand-offwhite hover:bg-black/[0.04] text-brand-charcoal text-xs font-mono uppercase tracking-wider font-semibold border border-black/[0.08] transition-colors"
              >
                ← Look Up Another Registration
              </button>
            </div>
          ) : (
            /* =========================================================================
             * LOOKUP FORM VIEW (SECURE 1-TO-1 LOOKUP)
             * ========================================================================= */
            <form onSubmit={handleLookup} className="space-y-4">
              <p className="text-xs text-brand-charcoal/80 mb-5 leading-relaxed">
                Enter your unique Registration Number and your WhatsApp phone number to securely access your confirmation and attendance status.
              </p>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  required
                  placeholder="e.g. NS-2611-ABC123"
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono uppercase focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono focus:border-brand-teal"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Verifying Participant Record...' : 'Access My Confirmation'}
              </button>

              {/* QUICK TEST SHORTCUTS FOR QA VERIFICATION */}
              <div className="pt-4 border-t border-black/[0.06] mt-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted block mb-2">
                  Quick Verification Test Scenarios:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => handleFillTestId('NS-2611-77CC11', '9447654321')}
                    className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100 text-left transition-colors"
                  >
                    <span className="font-bold block">1. Received</span>
                    <span className="text-sky-700/80">NS-2611-77CC11</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillTestId('NS-2611-24EB29', '9998887776')}
                    className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 text-left transition-colors"
                  >
                    <span className="font-bold block">2. Submitted</span>
                    <span className="text-amber-700/80">NS-2611-24EB29</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillTestId('NS-2611-8899AA', '9847123456')}
                    className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 text-left transition-colors"
                  >
                    <span className="font-bold block">3. Confirmed</span>
                    <span className="text-emerald-700/80">NS-2611-8899AA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillTestId('NS-2611-99DD44', '9846112233')}
                    className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 text-left transition-colors"
                  >
                    <span className="font-bold block">4. Rejected</span>
                    <span className="text-rose-700/80">NS-2611-99DD44</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
