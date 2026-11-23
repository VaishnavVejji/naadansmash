import React, { useState, useEffect } from 'react';
import { X, Smartphone, Lock, AlertCircle, CheckCircle2, RotateCw, ArrowLeft, MessageCircle, ExternalLink } from 'lucide-react';
import { eventsService } from '../../services/eventsService';

interface PlayerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: { phone: string; fullPhone: string; verified: boolean }) => void;
  title?: string;
  subtitle?: string;
}

export const PlayerAuthModal: React.FC<PlayerAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Sign In with Mobile Number',
  subtitle = 'Verify your phone number to reserve session spots and access your match tickets.',
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [whatsAppDeliveryUrl, setWhatsAppDeliveryUrl] = useState<string>('');
  const [smsDeliveryUrl, setSmsDeliveryUrl] = useState<string>('');
  const [deliveredViaSms, setDeliveredViaSms] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await eventsService.sendPlayerPhoneOtp(phoneNumber);
      setLoading(false);

      if (res.success) {
        setOtpSent(true);
        setSuccessMsg(res.message);
        if (res.whatsAppUrl) setWhatsAppDeliveryUrl(res.whatsAppUrl);
        if (res.smsUrl) setSmsDeliveryUrl(res.smsUrl);
        if (res.deliveredViaSms) setDeliveredViaSms(true);
        setResendCooldown(30);
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setLoading(false);
      setErrorMsg('Failed to dispatch OTP. Please check your number and try again.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await eventsService.verifyPlayerPhoneOtp(phoneNumber, otpCode);
      setLoading(false);

      if (res.success && res.session) {
        onSuccess(res.session);
        setOtpCode('');
        setOtpSent(false);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setLoading(false);
      setErrorMsg('Verification failed. Please check the 6-digit code received on your phone.');
    }
  };

  const handleReset = () => {
    setOtpSent(false);
    setOtpCode('');
    setErrorMsg('');
    setSuccessMsg('');
    setResendCooldown(0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative bg-white rounded-3xl max-w-md w-full border border-black/[0.08] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-brand-offwhite border-b border-black/[0.08] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
              Player Verification
            </span>
            <h3 className="font-heading font-extrabold text-xl text-brand-black mt-1.5 uppercase">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-brand-muted hover:text-brand-black hover:bg-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-xs text-brand-charcoal/80 mb-5 leading-relaxed">
            {subtitle}
          </p>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-4 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!otpSent ? (
            /* Step 1: Phone input */
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="9876543210"
                    className="w-full px-3.5 py-3 text-sm font-mono tracking-wider text-brand-black bg-transparent outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-brand-muted mt-1.5 font-mono">
                  Your 6-digit verification code will be dispatched to this mobile phone number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:bg-black/20 text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>{loading ? 'Sending Code...' : 'Send OTP to Phone'}</span>
              </button>
            </form>
          ) : (
            /* Step 2: OTP verification on mobile */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] font-mono text-brand-teal hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change Number</span>
                  </button>
                </div>

                {/* Delivery Notice Card */}
                <div className="p-3.5 rounded-2xl bg-brand-offwhite border border-black/[0.08] mb-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-brand-muted">Target Phone:</span>
                    <strong className="text-brand-black text-sm">+91 {phoneNumber}</strong>
                  </div>
                  <div className="text-[11px] text-brand-charcoal/70 mt-1">
                    {deliveredViaSms 
                      ? '✓ Dispatched via SMS gateway to your mobile carrier.'
                      : '✓ Dispatched to your device. Check your messages or receive directly via WhatsApp below:'}
                  </div>
                </div>

                {/* Direct Phone Delivery Options */}
                {whatsAppDeliveryUrl && (
                  <div className="mb-3 space-y-2">
                    <a
                      href={whatsAppDeliveryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-heading font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all"
                      title="Receive code directly on WhatsApp on this phone"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Tap to Receive Code on WhatsApp</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                    </a>

                    {smsDeliveryUrl && (
                      <a
                        href={smsDeliveryUrl}
                        className="w-full py-2 px-3 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-brand-charcoal text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        title="Open device SMS inbox"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-brand-teal" />
                        <span>Open Native SMS App</span>
                      </a>
                    )}
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-black/[0.12] bg-white text-center text-2xl font-mono font-bold tracking-[0.4em] text-brand-black outline-none focus:border-brand-teal shadow-xs"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:bg-black/20 text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Verify Code & Continue'}</span>
              </button>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || resendCooldown > 0}
                  className="text-brand-charcoal hover:text-brand-black flex items-center gap-1 disabled:opacity-40"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </span>
                </button>

                <a
                  href={`https://wa.me/919778148482?text=${encodeURIComponent(`Hi NAADANSMASH! I need help verifying my phone number: +91 ${phoneNumber}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-muted hover:text-brand-teal flex items-center gap-1"
                >
                  <span>Help / Support</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
