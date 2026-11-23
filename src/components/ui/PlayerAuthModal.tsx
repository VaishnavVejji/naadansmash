import React, { useState } from 'react';
import { X, Smartphone, Lock, AlertCircle, CheckCircle2, RotateCw, ArrowLeft, MessageCircle } from 'lucide-react';
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
  const [activeTestOtp, setActiveTestOtp] = useState<string | null>(null);

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
        if (res.testOtp) {
          setActiveTestOtp(res.testOtp);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setLoading(false);
      setErrorMsg('Failed to send OTP. Please try again.');
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
        setActiveTestOtp(null);
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setLoading(false);
      setErrorMsg('Verification failed. Please check your code.');
    }
  };

  const handleReset = () => {
    setOtpSent(false);
    setOtpCode('');
    setErrorMsg('');
    setSuccessMsg('');
    setActiveTestOtp(null);
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
                  We'll send a 6-digit verification code to confirm your number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10}
                className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:bg-black/20 text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>{loading ? 'Sending Code...' : 'Send Login OTP'}</span>
              </button>
            </form>
          ) : (
            /* Step 2: 6-digit OTP input */
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-brand-charcoal">
                    Enter 6-Digit OTP
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

                <div className="text-xs font-mono text-brand-muted mb-2">
                  Code sent to <strong className="text-brand-black">+91 {phoneNumber}</strong>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-black/[0.12] bg-white text-center text-xl font-mono font-bold tracking-[0.4em] text-brand-black outline-none focus:border-brand-teal shadow-xs"
                  autoFocus
                />
              </div>

              {/* Development / Quick Access Auto-Fill Badge */}
              {activeTestOtp && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verification Code: <strong className="text-emerald-950 font-bold">{activeTestOtp}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(activeTestOtp)}
                    className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] uppercase font-bold hover:bg-emerald-800 transition-colors"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full py-3.5 px-6 rounded-full bg-brand-teal hover:bg-[#126f8c] disabled:bg-black/20 text-white font-heading font-semibold text-xs uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Verifying...' : 'Verify OTP & Continue'}</span>
              </button>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-brand-charcoal hover:text-brand-black flex items-center gap-1 hover:underline"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>

                <a
                  href={`https://wa.me/91${phoneNumber}?text=NAADANSMASH%20Login%20Verification%20Code:%20${activeTestOtp || '123456'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Send via WhatsApp</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
