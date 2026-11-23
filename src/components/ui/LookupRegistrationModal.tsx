import React, { useState, useEffect, useRef } from 'react';
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
  FileText,
  Upload,
  Trash2,
  ArrowRight,
  Ticket
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { eventsService } from '../../services/eventsService';
import { PaymentSettings, ParticipantRegistrationStatus } from '../../types';
import { createWhatsAppLink } from '../../utils/whatsapp';
import { optimizeImageForUpload } from '../../utils/imageOptimizer';

interface LookupRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerPhone?: string;
  onJoinClick?: () => void;
}

export const LookupRegistrationModal: React.FC<LookupRegistrationModalProps> = ({
  isOpen,
  onClose,
  playerPhone,
  onJoinClick,
}) => {
  // State
  const [phone, setPhone] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);

  // In-modal payment details submission (for 'received' and 'rejected' states)
  const [inlineUtr, setInlineUtr] = useState('');
  const [inlineScreenshot, setInlineScreenshot] = useState<string | null>(null);
  const [inlineScreenshotName, setInlineScreenshotName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSubmitError, setInlineSubmitError] = useState('');
  const [inlineSubmitSuccess, setInlineSubmitSuccess] = useState('');

  // Copy feedback states
  const [copiedReg, setCopiedReg] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Initialize and auto-search if a phone number is remembered
  useEffect(() => {
    if (isOpen) {
      eventsService.getPaymentSettings().then(setPaymentSettings);
      const savedPhone = playerPhone || localStorage.getItem('naadansmash_last_phone') || '';
      if (savedPhone) {
        const clean = savedPhone.replace(/\D/g, '').slice(-10);
        setPhone(clean);
        // Auto-query remembered phone
        setLoading(true);
        setSearched(true);
        setErrorMsg('');
        eventsService.getUserTickets(clean).then((tickets) => {
          setLoading(false);
          setUserTickets(tickets);
          if (tickets.length > 0) {
            setResult(tickets[0]);
          } else {
            setResult(null);
          }
        }).catch(() => {
          setLoading(false);
          setUserTickets([]);
          setResult(null);
        });
      } else {
        // Reset to initial search state
        setPhone('');
        setResult(null);
        setUserTickets([]);
        setSearched(false);
        setErrorMsg('');
      }
    }
  }, [isOpen, playerPhone]);

  // Do not render if modal is not open
  if (!isOpen) return null;

  // Handlers
  const handlePhoneSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSearched(true);
    setResult(null);

    try {
      const tickets = await eventsService.getUserTickets(cleanPhone);
      setUserTickets(tickets);
      if (tickets.length > 0) {
        setResult(tickets[0]);
        localStorage.setItem('naadansmash_last_phone', cleanPhone);
      } else {
        setResult(null);
      }
    } catch {
      setUserTickets([]);
      setResult(null);
      setErrorMsg('Failed to retrieve tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber.trim() || !phone.trim()) {
      setErrorMsg('Please enter both your Registration Number and Phone Number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setSearched(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const res = await eventsService.lookupRegistration(regNumber.trim(), cleanPhone);
      if (res.found && res.registration) {
        setResult(res.registration);
        setUserTickets([res.registration]);
        localStorage.setItem('naadansmash_last_phone', cleanPhone);
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

  const handleInlineScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setInlineSubmitError('Invalid file format. Please upload a PNG, JPG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setInlineSubmitError('Image size should be less than 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setInlineScreenshotName(file.name);
    setInlineSubmitError('');
    try {
      const optimized = await optimizeImageForUpload(file);
      setInlineScreenshot(optimized);
    } catch {
      setInlineSubmitError('Failed to process image. Please try another screenshot.');
    }
  };

  const handleRemoveInlineScreenshot = () => {
    setInlineScreenshot(null);
    setInlineScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInlineSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineScreenshot && !inlineUtr.trim()) {
      setInlineSubmitError('Please attach a photo screenshot of your payment or enter your 12-digit UTR.');
      return;
    }

    if (!result?.registration_number) return;

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

      if (res.success) {
        setInlineSubmitSuccess('✓ Payment details submitted for organiser approval!');
        // Refresh ticket view
        setResult((prev: any) => ({
          ...prev,
          utr_reference: inlineUtr.trim() || prev?.utr_reference,
          payment_screenshot_path: inlineScreenshot || prev?.payment_screenshot_path,
          registration_status: 'payment_submitted',
        }));
      } else {
        setInlineSubmitError(res.message);
      }
    } catch {
      setInlineSubmitError('Failed to submit payment details. Please contact the organiser directly.');
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

  const resetAndClose = () => {
    setResult(null);
    setErrorMsg('');
    setRegNumber('');
    setInlineUtr('');
    setInlineScreenshot(null);
    setInlineScreenshotName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setInlineSubmitError('');
    setInlineSubmitSuccess('');
    onClose();
  };

  // Participant status determination
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
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm text-white uppercase tracking-tight block">
                My Match Tickets
              </span>
              <span className="text-[10px] font-mono text-white/60">
                Official NAADANSMASH session passes
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

          {/* STATE 1: LOADING */}
          {loading ? (
            <div className="py-20 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full border-3 border-brand-teal/20 border-t-brand-teal animate-spin mx-auto mb-4" />
              <div className="text-xs font-mono uppercase tracking-widest text-brand-charcoal font-semibold">
                Searching registrations for +91 {phone || '...'}
              </div>
              <p className="text-[11px] text-brand-muted mt-1">Retrieving live match passes from database...</p>
            </div>
          ) : result ? (
            /* STATE 2: ACTIVE TICKET RESULT FOUND */
            <div className="space-y-5 animate-fade-in">
              {/* Multi-Ticket Selector */}
              {userTickets.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2">
                  <span className="text-[10px] font-mono text-brand-muted uppercase shrink-0 font-bold">Your Passes:</span>
                  {userTickets.map((t, idx) => (
                    <button
                      key={t.registration_number || idx}
                      onClick={() => setResult(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 ${
                        result.registration_number === t.registration_number
                          ? 'bg-brand-black text-white shadow-xs'
                          : 'bg-brand-offwhite text-brand-charcoal hover:bg-black/10'
                      }`}
                    >
                      {t.registration_number}
                    </button>
                  ))}
                </div>
              )}

              {/* Status Banner */}
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

              {/* Rejection reason callout */}
              {currentStatus === 'rejected' && (
                <div className="p-4 rounded-2xl bg-white border-2 border-rose-200 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 text-xs font-mono font-bold uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Administrator Rejection Reason:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-rose-900 text-xs font-medium leading-relaxed">
                    "{result.rejection_reason || 'Payment details could not be verified in the organiser bank statement.'}"
                  </div>
                </div>
              )}

              {/* Registration Number Badge */}
              <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-center">
                <span className="text-[10px] font-mono text-brand-muted uppercase tracking-widest font-semibold block mb-1">
                  OFFICIAL REGISTRATION NUMBER
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-heading font-extrabold text-2xl text-brand-black tracking-wider font-mono">
                    {result.registration_number}
                  </span>
                  <button
                    onClick={handleCopyReg}
                    className="p-1.5 rounded-lg hover:bg-black/10 text-brand-teal transition-colors"
                    title="Copy Registration Number"
                  >
                    {copiedReg ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Match Pass Details Grid */}
              <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 text-xs">
                  <span className="text-brand-muted font-mono">Player Name</span>
                  <span className="font-bold text-brand-black">{result.full_name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 text-xs">
                  <span className="text-brand-muted font-mono">Session</span>
                  <span className="font-semibold text-brand-black">{result.event_title || 'Weekend Badminton Session'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 text-xs">
                  <span className="text-brand-muted font-mono">Date & Time</span>
                  <span className="font-mono text-brand-black">
                    {result.event_date || 'Upcoming Weekend'} {result.start_time ? `(${result.start_time.slice(0, 5)} – ${result.end_time?.slice(0, 5)})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 text-xs">
                  <span className="text-brand-muted font-mono">Skill Level</span>
                  <span className="font-semibold text-brand-black capitalize">{result.skill_level}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 text-xs">
                  <span className="text-brand-muted font-mono">Venue</span>
                  <span className="font-semibold text-brand-black truncate max-w-[220px]">{result.venue || 'Kochi Badminton Arena'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-brand-muted font-mono">Entry Fee</span>
                  <span className="font-bold text-brand-teal text-sm">₹{result.registration_fee || 250}</span>
                </div>
                {result.utr_reference && (
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.06] text-xs">
                    <span className="text-brand-muted font-mono">Submitted UTR</span>
                    <strong className="font-mono text-brand-black">{result.utr_reference}</strong>
                  </div>
                )}
              </div>

              {/* QR Code Entry Pass */}
              <div className="p-5 rounded-2xl bg-brand-offwhite border border-black/[0.08] text-center space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-charcoal block">
                  Court Entry Pass QR
                </span>
                <div className="inline-block p-3 rounded-xl bg-white border border-black/[0.08] shadow-xs">
                  <QRCodeSVG
                    value={`NAADANSMASH:${result.registration_number}:${result.phone || phone}`}
                    size={130}
                    level="H"
                  />
                </div>
                <p className="text-[11px] text-brand-muted font-mono">
                  Present this QR or Registration Number at the reception desk.
                </p>
              </div>

              {/* In-Modal Payment Submission (If Pending or Rejected) */}
              {(currentStatus === 'received' || currentStatus === 'rejected') && paymentSettings && (
                <div className="p-5 rounded-2xl bg-white border-2 border-brand-teal/30 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-brand-black">
                    <QrCode className="w-5 h-5 text-brand-teal" />
                    <h4 className="font-heading font-extrabold text-sm uppercase">
                      Complete Entry Payment
                    </h4>
                  </div>

                  {/* Organiser UPI QR Code and Account Info */}
                  <div className="p-4 rounded-2xl bg-brand-offwhite border border-black/[0.08] flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 p-2.5 bg-white rounded-2xl border border-black/[0.08] shadow-xs flex flex-col items-center">
                      <div className="w-32 h-32 flex items-center justify-center p-1 bg-white overflow-hidden rounded-xl">
                        <img
                          src={paymentSettings.qr_image_path || '/images/qr.jpeg'}
                          alt="Official UPI QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-brand-charcoal/70 uppercase mt-1.5">
                        Scan with Any UPI App
                      </span>
                    </div>

                    <div className="flex-1 w-full space-y-2 text-xs">
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
                          Official UPI ID
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-brand-black text-xs px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] select-all">
                            {paymentSettings.upi_id}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="px-2.5 py-1 rounded-lg bg-white border border-black/[0.08] hover:bg-black/[0.04] text-[11px] font-mono font-medium text-brand-charcoal flex items-center gap-1.5 transition-colors"
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

                      <div className="p-2 rounded-xl bg-white border border-black/[0.06] text-[11px] font-mono text-brand-charcoal/90">
                        Pay <strong>₹{result.registration_fee || 250}</strong> to the QR or UPI ID above, then attach your screenshot below.
                      </div>
                    </div>
                  </div>

                  {/* Submission Form: Screenshot + Optional UTR */}
                  <form onSubmit={handleInlineSubmitPayment} className="space-y-3 pt-1">
                    {inlineSubmitSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        {inlineSubmitSuccess}
                      </div>
                    )}
                    {inlineSubmitError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                        {inlineSubmitError}
                      </div>
                    )}

                    {/* Screenshot Upload Dropzone */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                          Payment Screenshot *
                        </label>
                        <span className="text-[10px] font-mono text-brand-teal font-semibold">
                          PNG, JPG, WEBP (Max 5MB)
                        </span>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleInlineScreenshotChange}
                        className="hidden"
                        id="lookup-payment-screenshot"
                      />

                      {inlineScreenshot ? (
                        <div className="p-3 bg-brand-offwhite rounded-xl border border-emerald-300 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-black/[0.08] bg-black/5">
                              <img
                                src={inlineScreenshot}
                                alt="Payment Screenshot"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-mono font-bold text-emerald-800 truncate">
                                {inlineScreenshotName || 'Payment Screenshot Attached'}
                              </p>
                              <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Ready to submit
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveInlineScreenshot}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove screenshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="lookup-payment-screenshot"
                          className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-brand-teal/40 hover:border-brand-teal hover:bg-black/[0.02] cursor-pointer transition-all text-center space-y-1 group"
                        >
                          <Upload className="w-5 h-5 text-brand-teal" />
                          <span className="text-xs font-mono font-bold text-brand-teal uppercase tracking-wider">
                            Upload Payment Screenshot
                          </span>
                          <span className="text-[10px] font-mono text-brand-muted">
                            Screenshot of completed UPI payment
                          </span>
                        </label>
                      )}
                    </div>

                    {/* Optional 12-digit UTR */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-mono font-bold uppercase text-brand-charcoal">
                          12-Digit UPI Reference Number (UTR)
                        </label>
                        <span className="text-[10px] font-mono text-brand-muted">Optional</span>
                      </div>
                      <input
                        type="text"
                        value={inlineUtr}
                        onChange={(e) => setInlineUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder="e.g. 432109876543"
                        className="w-full px-3 py-2 rounded-xl bg-brand-offwhite border border-black/[0.1] text-xs font-mono focus:border-brand-teal"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inlineSubmitting || (!inlineScreenshot && !inlineUtr.trim())}
                      className="w-full py-2.5 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:opacity-50 text-white text-xs font-mono uppercase tracking-wider font-semibold shadow-xs transition-colors"
                    >
                      {inlineSubmitting ? 'Sending Payment Details...' : 'Send Payment for Approval'}
                    </button>
                  </form>
                </div>
              )}

              {/* Organiser Support Button */}
              <div className="pt-2">
                <a
                  href={createWhatsAppLink('registration_enquiry', {
                    regNumber: result.registration_number,
                    name: result.full_name,
                    eventTitle: result.event_title || 'Weekend Badminton Session',
                  }).url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Organiser on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>

              {/* Check Another Mobile Number */}
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setSearched(false);
                  setShowManualSearch(false);
                }}
                className="w-full py-3 rounded-full bg-brand-offwhite hover:bg-black/[0.04] text-brand-charcoal text-xs font-mono uppercase tracking-wider font-semibold border border-black/[0.08] transition-colors"
              >
                ← Check Another Mobile Number
              </button>
            </div>
          ) : searched && userTickets.length === 0 && !showManualSearch ? (
            /* STATE 3: NO TICKETS FOUND FOR THIS MOBILE NUMBER */
            <div className="text-center py-10 px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-block mb-2">
                No Tickets Registered
              </span>
              <h4 className="font-heading font-extrabold text-xl sm:text-2xl text-brand-black uppercase leading-tight">
                This mobile number is not registered with an event.
              </h4>
              <p className="text-xs text-brand-charcoal/80 mt-2 max-w-sm mx-auto leading-relaxed mb-6">
                We could not find any active session registrations for <strong className="text-brand-black font-mono">+91 {phone}</strong>. Reserve your spot for the upcoming weekend session now!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {onJoinClick && (
                  <button
                    onClick={() => {
                      onClose();
                      onJoinClick();
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white font-heading font-semibold text-xs uppercase tracking-widest shadow-sm transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Register for Upcoming Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearched(false);
                    setUserTickets([]);
                    setResult(null);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-brand-offwhite hover:bg-black/10 text-brand-charcoal font-heading font-medium text-xs uppercase tracking-wider transition-colors border border-black/[0.08]"
                >
                  <span>Check Another Number</span>
                </button>
              </div>

              <div className="pt-6 mt-8 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowManualSearch(true)}
                  className="text-xs font-mono text-brand-teal hover:underline inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Have a Registration Number? Search manually →</span>
                </button>
              </div>
            </div>
          ) : showManualSearch ? (
            /* STATE 4: MANUAL 1-TO-1 LOOKUP (REGISTRATION NUMBER + PHONE) */
            <form onSubmit={handleManualLookup} className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-brand-charcoal/80 leading-relaxed">
                  Enter your unique Registration Number and registered mobile number.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualSearch(false);
                    setSearched(false);
                  }}
                  className="text-[11px] font-mono text-brand-teal hover:underline shrink-0"
                >
                  ← Phone Lookup
                </button>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  required
                  placeholder="e.g. NS-001"
                  className="w-full px-4 py-2.5 rounded-xl bg-brand-offwhite border border-black/[0.08] text-sm font-mono uppercase focus:border-brand-teal outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                  Phone / WhatsApp Number *
                </label>
                <div className="flex rounded-xl overflow-hidden border border-black/[0.12] bg-white focus-within:border-brand-teal transition-all">
                  <span className="inline-flex items-center px-3 bg-brand-offwhite border-r border-black/[0.08] text-xs font-mono font-bold text-brand-charcoal select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 text-sm font-mono tracking-wider text-brand-black bg-transparent outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-brand-teal hover:bg-[#126f8c] text-white text-xs font-mono uppercase tracking-widest font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? 'Verifying Participant Record...' : 'Access My Confirmation'}
              </button>
            </form>
          ) : (
            /* STATE 5: INITIAL PHONE NUMBER ENTRY PROMPT */
            <form onSubmit={handlePhoneSearch} className="space-y-5 animate-fade-in py-2">
              <div className="text-center max-w-sm mx-auto mb-2">
                <div className="w-14 h-14 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 text-brand-teal flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Ticket className="w-7 h-7" />
                </div>
                <h4 className="font-heading font-extrabold text-xl text-brand-black uppercase">
                  View Your Match Tickets
                </h4>
                <p className="text-xs text-brand-charcoal/80 mt-1 leading-relaxed">
                  Enter your registered 10-digit mobile number to view your court pass and live verification status.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal mb-1.5">
                  Mobile / WhatsApp Number
                </label>
                <div className="flex rounded-xl overflow-hidden border border-black/[0.12] bg-white focus-within:border-brand-teal transition-all shadow-xs">
                  <span className="inline-flex items-center px-3.5 bg-brand-offwhite border-r border-black/[0.08] text-xs font-mono font-bold text-brand-charcoal select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="9876543210"
                    className="w-full px-3.5 py-3 text-base font-mono tracking-wider text-brand-black bg-transparent outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                className="w-full py-3.5 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:bg-black/20 text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Find My Tickets</span>
              </button>

              <div className="pt-4 border-t border-black/[0.06] text-center">
                <button
                  type="button"
                  onClick={() => setShowManualSearch(true)}
                  className="text-xs font-mono text-brand-teal hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Have a Registration Number? Search manually →</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
